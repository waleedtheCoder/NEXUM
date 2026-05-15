"""
Daily product recommendations for shopkeepers.
Sourced from order history; falls back to top-selling products in the area.
Only recommends from verified or highly-rated (avg ≥ 4.0) suppliers.
"""
import datetime
from collections import Counter


_CACHE_TTL_HOURS = 24


def _is_stale(rec) -> bool:
    if rec is None:
        return True
    age = datetime.datetime.now(datetime.timezone.utc) - rec.computed_at
    return age.total_seconds() > _CACHE_TTL_HOURS * 3600


def _trusted_supplier_ids() -> set[int]:
    """IDs of verified OR highly-rated (avg rating ≥ 4) suppliers."""
    from django.db.models import Avg
    from users.models import UserProfile
    from orders.models import Review

    verified = set(
        UserProfile.objects.filter(
            verification_status='verified', role='SUPPLIER'
        ).values_list('user_id', flat=True)
    )

    # Aggregate on the Review table grouped by supplier — avoids annotating
    # every User in the system just to find a few high-rated suppliers.
    highly_rated = set(
        Review.objects
        .values('supplier_id')
        .annotate(avg_r=Avg('rating'))
        .filter(avg_r__gte=4.0)
        .values_list('supplier_id', flat=True)
    )

    return verified | highly_rated


def _compute_recommendations(user) -> dict:
    from orders.models import Order
    from listings.models import Listing

    trusted = _trusted_supplier_ids()

    past_orders = list(
        Order.objects.filter(
            buyer=user,
            listing__isnull=False,
            status__in=['confirmed', 'shipped', 'delivered'],
        )
        .select_related('listing')
        .order_by('-created_at')[:100]
    )

    if past_orders:
        # Build category preference from order history
        category_weights: Counter = Counter()
        bought_listing_ids = set()
        buyer_location = ''

        for o in past_orders:
            category_weights[o.listing.category] += o.quantity
            bought_listing_ids.add(o.listing_id)
            if not buyer_location:
                buyer_location = o.listing.location

        top_categories = [cat for cat, _ in category_weights.most_common(5)]

        recs = list(
            Listing.objects.filter(
                category__in=top_categories,
                status='active',
                supplier_id__in=trusted,
            )
            .exclude(id__in=bought_listing_ids)
            .order_by('-is_featured', '-views')[:30]
        )

        reasoning = (
            f"Based on your purchase history in: {', '.join(top_categories)}. "
            f"Showing products from verified and highly-rated suppliers."
        )
    else:
        # Fall back: top-viewed active listings from trusted suppliers
        recs = list(
            Listing.objects.filter(
                status='active',
                supplier_id__in=trusted,
            )
            .order_by('-is_featured', '-views')[:20]
        )
        reasoning = (
            "Top products from verified and highly-rated suppliers in your area."
        )

    return {
        'listing_ids': [l.id for l in recs],
        'reasoning': reasoning,
    }


def get_recommendations(user) -> dict:
    from analytics.models import ShopkeeperRecommendation
    from listings.models import Listing

    try:
        rec = ShopkeeperRecommendation.objects.get(shopkeeper=user)
    except ShopkeeperRecommendation.DoesNotExist:
        rec = None

    if _is_stale(rec):
        data = _compute_recommendations(user)
        rec, _ = ShopkeeperRecommendation.objects.update_or_create(
            shopkeeper=user,
            defaults={
                'listing_ids': data['listing_ids'],
                'reasoning': data['reasoning'],
            },
        )

    listing_ids = rec.listing_ids or []
    listings = {
        l.id: l
        for l in Listing.objects.filter(id__in=listing_ids)
        .select_related('supplier', 'supplier__profile')
    }

    products = []
    for lid in listing_ids:
        lst = listings.get(lid)
        if not lst:
            continue
        products.append({
            'id': lst.id,
            'title': lst.product_name,
            'category': lst.category,
            'price': str(lst.price),
            'unit': lst.unit,
            'imageUrl': lst.image_url,
            'location': lst.location,
            'supplier': {
                'id': lst.supplier_id,
                'name': lst.supplier.get_full_name() or lst.supplier.username,
                'verified': lst.supplier.profile.verification_status == 'verified',
            },
        })

    return {
        'products': products,
        'reasoning': rec.reasoning,
        'computedAt': rec.computed_at.isoformat(),
    }
