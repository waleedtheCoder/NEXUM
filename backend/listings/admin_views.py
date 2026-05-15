from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import Listing

ADMIN_SECRET = 'nexum_admin_2024'


def _is_admin(request):
    return request.headers.get('X-Admin-Secret') == ADMIN_SECRET


class AdminListingsView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        if not _is_admin(request):
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        listings = Listing.objects.select_related('supplier').order_by('-created_at')[:500]
        results = []
        for l in listings:
            results.append({
                'id':            l.id,
                'title':         l.product_name,
                'price':         str(l.price),
                'unit':          l.unit,
                'quantity':      l.quantity,
                'category':      l.category,
                'status':        l.status,
                'condition':     l.condition,
                'location':      l.location,
                'imageUrl':      l.image_url or '',
                'cities':        l.cities or [],
                'is_featured':   l.is_featured,
                'views':         l.views,
                'created_at':    l.created_at.strftime('%d %b %Y'),
                'supplier_id':   l.supplier.id,
                'supplier_name': l.supplier.first_name or l.supplier.email,
            })
        return Response(results)
