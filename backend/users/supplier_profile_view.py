from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from django.contrib.auth.models import User

from listings.models import Listing
from listings.serializers import ListingCardSerializer
from listings.utils import get_initials, avatar_color_for
from users.models import UserProfile


class SupplierPublicProfileView(APIView):
    """
    GET /api/users/supplier/<supplier_id>/
    Public. Returns a supplier's public profile and their active listings.
    Used by ProductDetailScreen when the user taps the seller card.

    Response:
    {
        "id":            "42",
        "name":          "Bismillah Rice Mills",
        "initials":      "BR",
        "avatarColor":   "#F59E0B",
        "rating":        4.5,
        "totalListings": 12,
        "listings":      [ ...ListingCard objects (max 20)... ]
    }
    """
    authentication_classes = []
    permission_classes     = [AllowAny]

    def get(self, request, supplier_id):
        try:
            user    = User.objects.get(id=supplier_id)
            profile = UserProfile.objects.get(user=user)
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return Response(
                {'detail': 'Supplier not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if profile.role != 'supplier':
            return Response(
                {'detail': 'User is not a supplier.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        listings = Listing.objects.filter(supplier=user, status='active').order_by('-created_at')
        name     = user.get_full_name() or user.username

        return Response({
            'id':            str(user.id),
            'name':          name,
            'initials':      get_initials(name),
            'avatarColor':   avatar_color_for(user.id),
            'rating':        4.5,               # static until a Review model is added
            'totalListings': listings.count(),
            'listings':      ListingCardSerializer(listings[:20], many=True).data,
        })
