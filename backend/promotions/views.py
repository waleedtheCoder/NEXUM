from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from listings.models import ListingPromotion


class PromotionListView(APIView):
    """
    GET /api/promotions/
    Public. Returns all active listing promotions for HomeScreen.

    Response:
    [
      {
        "id":              1,
        "title":           "Basmati Rice",
        "subtitle":        "20% OFF · Ahmad Rice Mills",
        "imageUrl":        "https://...",
        "badge":           "20% OFF",
        "discountPercent": 20,
        "originalPrice":   "1600.00",
        "discountedPrice": "1280.00",
        "listingId":       42
      }
    ]
    """
    permission_classes = [AllowAny]

    def get(self, request):
        now = timezone.now()
        promos = (
            ListingPromotion.objects
            .filter(is_active=True)
            .filter(Q(ends_at__isnull=True) | Q(ends_at__gte=now))
            .select_related('listing', 'listing__supplier')
            .order_by('-created_at')
        )

        result = []
        for p in promos:
            listing       = p.listing
            supplier      = listing.supplier
            supplier_name = supplier.get_full_name() or supplier.username
            result.append({
                'id':              p.id,
                'title':           listing.product_name,
                'subtitle':        f'{p.discount_percent}% OFF · {supplier_name}',
                'imageUrl':        listing.image_url or '',
                'badge':           f'{p.discount_percent}% OFF',
                'discountPercent': p.discount_percent,
                'originalPrice':   str(listing.price),
                'discountedPrice': str(round(p.discounted_price, 2)),
                'listingId':       listing.id,
            })

        return Response(result)
