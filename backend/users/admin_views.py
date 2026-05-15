from datetime import timedelta

from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from django.db.models import Count, Q

from .models import UserProfile
from listings.models import Listing
from orders.models import Order

ADMIN_SECRET = 'nexum_admin_2024'


def _is_admin(request):
    return request.headers.get('X-Admin-Secret') == ADMIN_SECRET


class AdminStatsView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        if not _is_admin(request):
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        now      = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d  = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)

        # Collapse the three date-range counts into one query.
        user_agg = User.objects.aggregate(
            new_24h=Count('id', filter=Q(date_joined__gte=last_24h)),
            new_7d=Count('id', filter=Q(date_joined__gte=last_7d)),
            new_30d=Count('id', filter=Q(date_joined__gte=last_30d)),
        )

        return Response({
            'total_suppliers':   UserProfile.objects.filter(role='SUPPLIER').count(),
            'total_shopkeepers': UserProfile.objects.filter(role='SHOPKEEPER').count(),
            'total_products':    Listing.objects.filter(status='active').count(),
            'total_orders':      Order.objects.count(),
            'new_users_24h':     user_agg['new_24h'],
            'new_users_7d':      user_agg['new_7d'],
            'new_users_30d':     user_agg['new_30d'],
        })


class AdminSuppliersView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        if not _is_admin(request):
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        profiles = (
            UserProfile.objects
            .filter(role='SUPPLIER')
            .select_related('user')
            .annotate(_listing_count=Count('user__listings', filter=Q(user__listings__status='active')))
        )
        results = []
        for p in profiles:
            results.append({
                'id':                p.user.id,
                'name':              p.user.first_name or p.user.email,
                'email':             p.user.email,
                'phone':             p.phone_number or '',
                'profile_image_url': p.profile_image_url or '',
                'total_listings':    p._listing_count,
                'joined_date':       p.user.date_joined.strftime('%b %Y'),
            })
        return Response(results)


class AdminShopkeepersView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        if not _is_admin(request):
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        profiles = (
            UserProfile.objects
            .filter(role='SHOPKEEPER')
            .select_related('user')
            .annotate(_order_count=Count('user__orders'))
        )
        results = []
        for p in profiles:
            results.append({
                'id':                p.user.id,
                'name':              p.user.first_name or p.user.email,
                'email':             p.user.email,
                'phone':             p.phone_number or '',
                'profile_image_url': p.profile_image_url or '',
                'total_orders':      p._order_count,
                'joined_date':       p.user.date_joined.strftime('%b %Y'),
            })
        return Response(results)


class AdminVerificationsView(APIView):
    """
    GET  /api/users/admin/verifications/          — list pending requests
    POST /api/users/admin/verifications/<id>/     — approve (id = user pk)
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        if not _is_admin(request):
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        profiles = (
            UserProfile.objects
            .filter(role='SUPPLIER', verification_status='pending')
            .select_related('user')
            .annotate(_listing_count=Count('user__listings', filter=Q(user__listings__status='active')))
        )

        results = []
        for p in profiles:
            results.append({
                'id':                p.user.id,
                'name':              p.user.first_name or p.user.email,
                'email':             p.user.email,
                'phone':             p.phone_number or '',
                'profile_image_url': p.profile_image_url or '',
                'total_listings':    p._listing_count,
                'joined_date':       p.user.date_joined.strftime('%b %Y'),
            })
        return Response(results)

    def post(self, request, supplier_id=None):
        if not _is_admin(request):
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        if not supplier_id:
            return Response({'detail': 'supplier_id required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = UserProfile.objects.select_related('user').get(
                user__id=supplier_id, role='SUPPLIER'
            )
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Supplier not found.'}, status=status.HTTP_404_NOT_FOUND)

        profile.verification_status = 'verified'
        profile.save(update_fields=['verification_status'])

        # Mark all their active listings as featured
        Listing.objects.filter(supplier=profile.user, status='active').update(is_featured=True)

        return Response({'detail': 'Supplier verified.', 'id': supplier_id})
