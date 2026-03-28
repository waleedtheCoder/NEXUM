from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Listing
from .utils import time_ago, get_initials, avatar_color_for
from chat.models import Conversation


class SupplierDashboardView(APIView):
    """
    GET /api/listings/supplier/dashboard/
    Protected (supplier only).

    REPLACES the existing SupplierDashboardView in listings/views.py.
    Change from the original: adds 'Completed Sales' to the performance array
    by querying the orders app once it is migrated. Falls back to 0 gracefully
    so the app continues working before the orders app is set up.

    Response shape is identical to the existing endpoint — no frontend changes needed.
    """
    def get(self, request):
        user = request.user

        active_count  = Listing.objects.filter(supplier=user, status='active').count()
        pending_count = Listing.objects.filter(supplier=user, status='pending').count()
        total_inquiries = Conversation.objects.filter(seller=user).count()

        # Graceful fallback while orders app migration is pending
        try:
            from orders.models import Order
            completed_sales = Order.objects.filter(
                supplier=user, status='delivered'
            ).count()
        except Exception:
            completed_sales = 0

        performance = [
            {
                'label': 'Active Listings',
                'value': str(active_count),
                'icon':  'cube-outline',
                'color': '#00A859',
            },
            {
                'label': 'Pending Review',
                'value': str(pending_count),
                'icon':  'time-outline',
                'color': '#F59E0B',
            },
            {
                'label': 'Total Inquiries',
                'value': str(total_inquiries),
                'icon':  'chatbubble-outline',
                'color': '#F59E0B',
            },
            {
                'label': 'Completed Sales',
                'value': str(completed_sales),
                'icon':  'checkmark-circle-outline',
                'color': '#8B5CF6',
            },
        ]

        recent_convs = (
            Conversation.objects
            .filter(seller=user)
            .select_related('buyer', 'listing')
            .order_by('-updated_at')[:5]
        )

        recent_inquiries = []
        for conv in recent_convs:
            buyer_name = conv.buyer.get_full_name() or conv.buyer.username
            recent_inquiries.append({
                'id':          str(conv.id),
                'buyer':       buyer_name,
                'product':     conv.listing.product_name if conv.listing else '',
                'message':     conv.last_message or '',
                'time':        time_ago(conv.updated_at),
                'read':        conv.seller_unread == 0,
                'avatarColor': avatar_color_for(conv.buyer_id),
                'init':        get_initials(buyer_name),
            })

        return Response({
            'performance':      performance,
            'recent_inquiries': recent_inquiries,
        })
