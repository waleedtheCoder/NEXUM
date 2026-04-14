from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Listing, ListingPromotion


class ListingPromotionView(APIView):
    """
    POST /api/listings/<pk>/promote/
        Body: { discount_percent: 20 }
        Creates or updates a promotion on the supplier's own listing.

    DELETE /api/listings/<pk>/promote/
        Removes (deactivates) the promotion.

    Both require IsAuthenticated — supplier must own the listing.
    """
    permission_classes = [IsAuthenticated]

    def _get_listing(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk, supplier=request.user)
        except Listing.DoesNotExist:
            return None
        return listing

    def post(self, request, pk):
        listing = self._get_listing(request, pk)
        if listing is None:
            return Response(
                {'detail': 'Listing not found or not yours.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        discount = request.data.get('discount_percent')
        try:
            discount = int(discount)
            if not (1 <= discount <= 99):
                raise ValueError
        except (TypeError, ValueError):
            return Response(
                {'detail': 'discount_percent must be an integer between 1 and 99.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ends_at = request.data.get('ends_at')  # optional ISO datetime string

        promo, _ = ListingPromotion.objects.update_or_create(
            listing=listing,
            defaults={
                'discount_percent': discount,
                'is_active':        True,
                'ends_at':          ends_at,
            },
        )

        return Response({
            'discountPercent':  promo.discount_percent,
            'discountedPrice':  str(round(promo.discounted_price, 2)),
            'originalPrice':    str(listing.price),
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        listing = self._get_listing(request, pk)
        if listing is None:
            return Response(
                {'detail': 'Listing not found or not yours.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        deleted, _ = ListingPromotion.objects.filter(listing=listing).delete()
        if deleted:
            return Response({'detail': 'Promotion removed.'}, status=status.HTTP_200_OK)
        return Response({'detail': 'No active promotion found.'}, status=status.HTTP_404_NOT_FOUND)
