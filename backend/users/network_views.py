from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from django.contrib.auth.models import User

from listings.utils import get_initials, avatar_color_for
from users.models import FavouriteSupplier, UserProfile


class SupplierNetworkView(APIView):
    """
    GET /api/users/network/
    Returns all suppliers that the authenticated shopkeeper has favourited.
    Protected — requires Firebase or session auth.

    Response: [ { id, name, initials, avatarColor, totalListings }, ... ]
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favourites = (
            FavouriteSupplier.objects
            .filter(shopkeeper=request.user)
            .select_related('supplier')
        )

        result = []
        for fav in favourites:
            sup = fav.supplier
            name = sup.get_full_name() or sup.username
            listing_count = sup.listings.filter(status='active').count()
            result.append({
                'id':            sup.id,
                'name':          name,
                'initials':      get_initials(name),
                'avatarColor':   avatar_color_for(sup.id),
                'totalListings': listing_count,
            })

        return Response(result)


class ToggleFavouriteSupplierView(APIView):
    """
    POST /api/users/network/toggle/
    Body: { supplier_id: <int> }
    Adds the supplier to favourites if not already saved, removes if already saved.
    Protected.

    Response: { is_favourite: true|false }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        supplier_id = request.data.get('supplier_id')
        if not supplier_id:
            return Response({'detail': 'supplier_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            supplier = User.objects.get(id=supplier_id)
            profile  = UserProfile.objects.get(user=supplier)
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return Response({'detail': 'Supplier not found.'}, status=status.HTTP_404_NOT_FOUND)

        if profile.role != 'SUPPLIER':
            return Response({'detail': 'User is not a supplier.'}, status=status.HTTP_400_BAD_REQUEST)

        obj, created = FavouriteSupplier.objects.get_or_create(
            shopkeeper=request.user,
            supplier=supplier,
        )
        if not created:
            obj.delete()
            return Response({'is_favourite': False})

        return Response({'is_favourite': True}, status=status.HTTP_201_CREATED)
