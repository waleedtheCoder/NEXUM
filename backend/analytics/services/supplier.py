"""
Biweekly personal analysis for verified (premium) suppliers.
"""
import datetime
from decimal import Decimal


_BIWEEKLY_DAYS = 14
_LOW_UNITS_THRESHOLD = 5   # fewer than this in 90 days → low performing


def _current_period_start() -> datetime.date:
    """Returns the start of the current biweekly period (either 1st or 15th)."""
    today = datetime.date.today()
    if today.day >= 15:
        return today.replace(day=15)
    return today.replace(day=1)


def _compute_listing_analysis(listing, supplier_cats: set) -> dict:
    """
    Compute per-listing analysis.

    supplier_cats is pre-computed by the caller (once for all listings) to avoid
    an extra DB query per listing.
    """
    from orders.models import Order
    from analytics.models import MarketSnapshot
    from analytics.services.embeddings import category_avg_price
    from django.db.models import Sum

    today        = datetime.date.today()
    window_start = today - datetime.timedelta(days=90)

    # Detect active promotion before deciding how to fetch orders.
    has_active_promo = False
    promo_start      = None
    try:
        if listing.promotion.is_active:
            has_active_promo = True
            promo_start = listing.promotion.created_at.date()
    except Exception:
        pass

    if has_active_promo:
        # Need per-order dates for promo/pre-promo split.
        # Use .values() to load only the two columns we need — avoids full ORM
        # object construction and reduces memory.
        orders_qs = (
            Order.objects
            .filter(
                listing=listing,
                status__in=['confirmed', 'shipped', 'delivered'],
                created_at__date__gte=window_start,
            )
            .order_by('created_at')
            .values('quantity', 'created_at')
        )
        # Single pass through the result set.
        total_units = promo_units = pre_units = 0
        for o in orders_qs:
            q = o['quantity']
            total_units += q
            if o['created_at'].date() >= promo_start:
                promo_units += q
            else:
                pre_units += q
    else:
        # No per-order iteration needed — let the DB do the sum.
        agg = Order.objects.filter(
            listing=listing,
            status__in=['confirmed', 'shipped', 'delivered'],
            created_at__date__gte=window_start,
        ).aggregate(total=Sum('quantity'))
        total_units = agg['total'] or 0
        promo_units = pre_units = 0

    # ── Price impact ─────────────────────────────────────────────────────────
    avg_market    = category_avg_price(listing.category)
    current_price = float(listing.price)

    if avg_market and avg_market > 0:
        diff_pct = (current_price - avg_market) / avg_market * 100
        if diff_pct > 10:
            price_impact = (
                f"Your price ({current_price:.0f}) is {diff_pct:.0f}% above market avg "
                f"({avg_market:.0f}) for {listing.category}. Lowering may increase volume."
            )
            recommended_price = Decimal(str(round(avg_market * 0.95, 2)))
        elif diff_pct < -10:
            price_impact = (
                f"Your price ({current_price:.0f}) is below market avg ({avg_market:.0f}). "
                f"You have room to increase margin without losing buyers."
            )
            recommended_price = Decimal(str(round(avg_market * 0.92, 2)))
        else:
            price_impact = f"Your price is competitive (market avg: {avg_market:.0f})."
            recommended_price = listing.price
    else:
        price_impact      = "Insufficient market data to compare pricing for this category."
        recommended_price = listing.price

    if has_active_promo and pre_units > 0 and promo_units > 0:
        boost = (promo_units / pre_units - 1) * 100
        price_impact += f" Active promotion boosted sales by {boost:.0f}%."

    # ── Best city targeting ───────────────────────────────────────────────────
    city_demand = (
        MarketSnapshot.objects
        .filter(
            category__iexact=listing.category,
            month__gte=(today.replace(day=1) - datetime.timedelta(days=90)),
        )
        .values('city')
        .annotate(total=Sum('units_sold'))
        .order_by('-total')
    )

    if city_demand:
        best_city = city_demand[0]['city']
        if best_city.lower() == listing.location.lower():
            city_reasoning = (
                f"Your current city ({listing.location}) already leads demand for "
                f"{listing.category}. Good placement."
            )
        else:
            city_reasoning = (
                f"{best_city} has the highest demand for {listing.category}. "
                f"Add {best_city} to your listing's cities for maximum reach."
            )
    else:
        best_city      = listing.location
        city_reasoning = "Not enough city data yet. Keep your current listing city."

    # ── Low-performing guidance ───────────────────────────────────────────────
    is_low         = total_units < _LOW_UNITS_THRESHOLD
    low_perf_guidance = ''
    if is_low:
        price_floor = round(float(recommended_price) * 0.85, 0)
        low_perf_guidance = (
            f"Only {total_units} units sold in the last 90 days. Suggestions: "
            f"(1) Lower price to ~{price_floor:.0f} for clearance. "
            f"(2) Expand to {best_city} if not listed there. "
            f"(3) Refresh product images and description."
        )

    # ── Portfolio expansion suggestions ──────────────────────────────────────
    # supplier_cats is passed in — computed once for all listings by the caller.
    top_categories = (
        MarketSnapshot.objects
        .filter(
            city__iexact=listing.location,
            month__gte=(today.replace(day=1) - datetime.timedelta(days=90)),
        )
        .values('category')
        .annotate(total=Sum('units_sold'))
        .order_by('-total')[:10]
    )
    portfolio_suggestions = [
        c['category']
        for c in top_categories
        if c['category'] not in supplier_cats
    ][:3]

    return {
        'price_impact_summary': price_impact,
        'recommended_price':    recommended_price,
        'best_city':            best_city,
        'city_reasoning':       city_reasoning,
        'is_low_performing':    is_low,
        'low_perf_guidance':    low_perf_guidance,
        'portfolio_suggestions': portfolio_suggestions,
    }


def _save_analysis(listing, data: dict):
    from analytics.models import SupplierAnalysis
    period = _current_period_start()
    SupplierAnalysis.objects.update_or_create(
        listing=listing,
        period_start=period,
        defaults=data,
    )


def get_supplier_analysis(user) -> dict:
    from listings.models import Listing
    from analytics.models import SupplierAnalysis

    period = _current_period_start()

    listings = list(
        Listing.objects.filter(supplier=user, status='active')
        .select_related('promotion')
    )

    # Pre-fetch all cached analyses for this period in one query.
    existing = {
        sa.listing_id: sa
        for sa in SupplierAnalysis.objects.filter(listing__in=listings, period_start=period)
    }

    # Pre-compute supplier's own active categories once — avoids one DB query
    # per listing inside _compute_listing_analysis.
    supplier_cats = set(
        Listing.objects
        .filter(supplier=user, status='active')
        .values_list('category', flat=True)
    )

    result = []
    for listing in listings:
        saved = existing.get(listing.id)
        if saved is None:
            data = _compute_listing_analysis(listing, supplier_cats)
            _save_analysis(listing, data)
        else:
            data = {
                'price_impact_summary': saved.price_impact_summary,
                'recommended_price':    saved.recommended_price,
                'best_city':            saved.best_city,
                'city_reasoning':       saved.city_reasoning,
                'is_low_performing':    saved.is_low_performing,
                'low_perf_guidance':    saved.low_perf_guidance,
                'portfolio_suggestions': saved.portfolio_suggestions,
            }

        result.append({
            'listingId':    listing.id,
            'title':        listing.product_name,
            'category':     listing.category,
            'currentPrice': str(listing.price),
            'analysis': {
                'priceImpact':           data['price_impact_summary'],
                'recommendedPrice':      str(data['recommended_price']),
                'bestCity':              data['best_city'],
                'cityReasoning':         data['city_reasoning'],
                'isLowPerforming':       data['is_low_performing'],
                'lowPerfGuidance':       data['low_perf_guidance'],
                'portfolioSuggestions':  data['portfolio_suggestions'],
            },
        })

    return {
        'listings':    result,
        'periodStart': _current_period_start().isoformat(),
    }
