"""
Market snapshot computation and retrieval.
"""
import datetime
from collections import defaultdict
from decimal import Decimal

from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone


def _month_start(year: int, month: int) -> datetime.date:
    return datetime.date(year, month, 1)


def _next_month(d: datetime.date) -> datetime.date:
    if d.month == 12:
        return datetime.date(d.year + 1, 1, 1)
    return datetime.date(d.year, d.month + 1, 1)


def rebuild_snapshots(months_back: int = 13) -> int:
    """Recompute MarketSnapshot rows for the last N months via a single bulk upsert."""
    from orders.models import Order
    from analytics.models import MarketSnapshot

    cutoff = datetime.date.today() - datetime.timedelta(days=months_back * 31)

    rows = (
        Order.objects
        .filter(
            created_at__date__gte=cutoff,
            status__in=['confirmed', 'shipped', 'delivered'],
            listing__isnull=False,
        )
        .annotate(month=TruncMonth('created_at'))
        .values('month', 'listing__category', 'listing__location')
        .annotate(
            total_units=Sum('quantity'),
            total_revenue=Sum('total_price'),
            total_orders=Count('id'),
        )
    )

    to_upsert = []
    for r in rows:
        raw_month  = r['month']
        month_date = raw_month.date() if hasattr(raw_month, 'date') else raw_month
        to_upsert.append(MarketSnapshot(
            city=r['listing__location'] or '',
            category=r['listing__category'] or '',
            month=month_date,
            units_sold=r['total_units'] or 0,
            revenue=r['total_revenue'] or Decimal('0'),
            order_count=r['total_orders'] or 0,
        ))

    if to_upsert:
        MarketSnapshot.objects.bulk_create(
            to_upsert,
            update_conflicts=True,
            unique_fields=['city', 'category', 'month'],
            update_fields=['units_sold', 'revenue', 'order_count'],
        )

    return len(to_upsert)


def rebuild_top_products() -> None:
    """Recompute top-10 products per city for the current month via a single cross-city query."""
    from orders.models import Order
    from analytics.models import TopProduct

    today      = datetime.date.today()
    month_start = today.replace(day=1)
    month_end   = _next_month(month_start)

    # One query across all cities — avoids O(n_cities) round trips.
    rows = (
        Order.objects
        .filter(
            created_at__date__gte=month_start,
            created_at__date__lt=month_end,
            status__in=['confirmed', 'shipped', 'delivered'],
            listing__isnull=False,
        )
        .values('listing__location', 'listing')
        .annotate(units=Sum('quantity'))
        .order_by('listing__location', '-units')
    )

    # Group by city in Python, keep top-10 per city.
    by_city: dict[str, list] = {}
    for row in rows:
        city = row['listing__location'] or ''
        if city not in by_city:
            by_city[city] = []
        if len(by_city[city]) < 10 and row['listing']:
            by_city[city].append(row)

    # Delete all existing rows for this month, then bulk create the new rankings.
    TopProduct.objects.filter(month=month_start).delete()

    to_create = []
    for city, city_rows in by_city.items():
        for rank, item in enumerate(city_rows, 1):
            to_create.append(TopProduct(
                city=city,
                listing_id=item['listing'],
                rank=rank,
                units_sold=item['units'],
                month=month_start,
            ))

    if to_create:
        TopProduct.objects.bulk_create(to_create)


# ── Read helpers ──────────────────────────────────────────────────────────────

def get_current_month_summary(city: str = '') -> dict:
    from analytics.models import MarketSnapshot

    today       = datetime.date.today()
    month_start = today.replace(day=1)

    qs = MarketSnapshot.objects.filter(month=month_start)
    if city:
        qs = qs.filter(city__iexact=city)

    categories: dict[str, dict] = {}
    city_totals: dict[str, dict] = {}

    for snap in qs:
        # category roll-up
        c = categories.setdefault(snap.category, {
            'category': snap.category, 'unitsSold': 0, 'revenue': '0.00', 'orderCount': 0
        })
        c['unitsSold']  += snap.units_sold
        c['revenue']     = str(Decimal(c['revenue']) + snap.revenue)
        c['orderCount'] += snap.order_count

        # city roll-up
        ct = city_totals.setdefault(snap.city, {
            'city': snap.city, 'unitsSold': 0, 'topCategory': '', '_top': 0
        })
        ct['unitsSold'] += snap.units_sold
        if snap.units_sold > ct['_top']:
            ct['_top']        = snap.units_sold
            ct['topCategory'] = snap.category

    # compute growth vs previous month
    prev_month_start = (month_start - datetime.timedelta(days=1)).replace(day=1)
    prev_qs = MarketSnapshot.objects.filter(month=prev_month_start)
    if city:
        prev_qs = prev_qs.filter(city__iexact=city)
    prev_totals: dict[str, int] = defaultdict(int)
    for snap in prev_qs:
        prev_totals[snap.category] += snap.units_sold

    for cat_data in categories.values():
        prev = prev_totals.get(cat_data['category'], 0)
        if prev > 0:
            cat_data['growthPct'] = round(
                (cat_data['unitsSold'] - prev) / prev * 100, 1
            )
        else:
            cat_data['growthPct'] = None

    city_list = [{k: v for k, v in ct.items() if k != '_top'} for ct in city_totals.values()]

    return {
        'month':         month_start.strftime('%Y-%m'),
        'categories':    sorted(categories.values(), key=lambda x: -x['unitsSold']),
        'cityBreakdown': sorted(city_list, key=lambda x: -x['unitsSold']),
    }


def get_history(city: str = '', category: str = '', months: int = 12) -> dict:
    from analytics.models import MarketSnapshot

    today  = datetime.date.today()
    cutoff = (today.replace(day=1) - datetime.timedelta(days=months * 31)).replace(day=1)

    qs = MarketSnapshot.objects.filter(month__gte=cutoff).order_by('month')
    if city:
        qs = qs.filter(city__iexact=city)
    if category:
        qs = qs.filter(category__iexact=category)

    by_month: dict[str, dict] = {}
    for snap in qs:
        key = snap.month.strftime('%Y-%m')
        m   = by_month.setdefault(key, {
            'month': key, 'totalUnits': 0, 'totalRevenue': '0.00',
            'totalOrders': 0, 'categories': {}
        })
        m['totalUnits']   += snap.units_sold
        m['totalRevenue']  = str(Decimal(m['totalRevenue']) + snap.revenue)
        m['totalOrders']  += snap.order_count
        cat = m['categories'].setdefault(snap.category, {
            'category': snap.category, 'unitsSold': 0
        })
        cat['unitsSold'] += snap.units_sold

    result = []
    for m in by_month.values():
        m['categories'] = sorted(m['categories'].values(), key=lambda x: -x['unitsSold'])
        result.append(m)

    return {'months': result}


def get_top_products(city: str = '') -> dict:
    from analytics.models import TopProduct
    from listings.models import Listing

    today       = datetime.date.today()
    month_start = today.replace(day=1)

    qs = TopProduct.objects.filter(month=month_start).select_related(
        'listing', 'listing__supplier', 'listing__supplier__profile'
    )
    if city:
        qs = qs.filter(city__iexact=city)

    by_city: dict[str, list] = {}
    for tp in qs:
        lst = tp.listing
        by_city.setdefault(tp.city, []).append({
            'rank':      tp.rank,
            'id':        lst.id,
            'title':     lst.product_name,
            'category':  lst.category,
            'price':     str(lst.price),
            'unitsSold': tp.units_sold,
            'imageUrl':  lst.image_url,
            'supplier': {
                'id':       lst.supplier_id,
                'name':     lst.supplier.get_full_name() or lst.supplier.username,
                'verified': lst.supplier.profile.verification_status == 'verified',
            },
        })

    cities_list = [
        {'city': c, 'topProducts': sorted(prods, key=lambda x: x['rank'])}
        for c, prods in by_city.items()
    ]

    return {'month': month_start.strftime('%Y-%m'), 'cities': cities_list}
