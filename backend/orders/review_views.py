from django.contrib.auth.models import User
from django.db.models import Avg, Count

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Order, Review


class CreateReviewView(APIView):
    """
    POST /api/orders/<order_id>/review/
    Buyer submits a review after their order is delivered.
    Body: { rating: 1-5, text?: "..." }
    Rules: order must be delivered, requester must be the buyer, one review per order.
    """
    def post(self, request, order_id):
        try:
            order = Order.objects.select_related('buyer', 'supplier', 'listing').get(pk=order_id)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.buyer_id != request.user.id:
            return Response({'detail': 'Only the buyer can review this order.'}, status=status.HTTP_403_FORBIDDEN)

        if order.status != 'delivered':
            return Response({'detail': 'You can only review delivered orders.'}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(order, 'review'):
            return Response({'detail': 'You have already reviewed this order.'}, status=status.HTTP_400_BAD_REQUEST)

        rating = request.data.get('rating')
        try:
            rating = int(rating)
            if not 1 <= rating <= 5:
                raise ValueError
        except (TypeError, ValueError):
            return Response({'detail': 'rating must be an integer between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        text = str(request.data.get('text', '')).strip()

        review = Review.objects.create(
            order=order,
            supplier=order.supplier,
            buyer=request.user,
            rating=rating,
            text=text,
        )

        return Response({
            'id':        review.id,
            'rating':    review.rating,
            'text':      review.text,
            'createdAt': review.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)


class SupplierReviewsView(APIView):
    """
    GET /api/orders/reviews/?supplier_id=<id>
    Returns all reviews for a supplier plus their average rating.
    Public — no auth required.
    """
    authentication_classes = []
    permission_classes     = []

    def get(self, request):
        supplier_id = request.query_params.get('supplier_id', '').strip()
        if not supplier_id:
            return Response({'detail': 'supplier_id query param is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            supplier = User.objects.get(pk=supplier_id)
        except User.DoesNotExist:
            return Response({'detail': 'Supplier not found.'}, status=status.HTTP_404_NOT_FOUND)

        reviews = Review.objects.filter(supplier=supplier).select_related('buyer', 'order__listing')
        agg = reviews.aggregate(avg=Avg('rating'), count=Count('id'))

        results = []
        for r in reviews:
            buyer_name = r.buyer.get_full_name() or r.buyer.username
            results.append({
                'id':          r.id,
                'rating':      r.rating,
                'text':        r.text,
                'buyerName':   buyer_name,
                'productName': r.order.listing.product_name if r.order.listing else 'Product',
                'createdAt':   r.created_at.isoformat(),
            })

        return Response({
            'avgRating':    round(agg['avg'], 1) if agg['avg'] else None,
            'totalReviews': agg['count'],
            'reviews':      results,
        })
