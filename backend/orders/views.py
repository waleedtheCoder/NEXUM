from django.db import models as django_models

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from listings.models import Listing
from notifications.models import Notification
from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer


class OrderListView(APIView):
    """
    GET /api/orders/
    Returns the current shopkeeper's order history (newest first).
    Used by AccountSettingsScreen RECENT_ORDERS section.
    """
    def get(self, request):
        orders = Order.objects.filter(buyer=request.user).select_related('listing', 'supplier')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class OrderPlaceView(APIView):
    """
    POST /api/orders/place/
    Shopkeeper places an order on a listing.

    Body: { listing_id, quantity, notes? }
    Response (201): the new order object in OrderSerializer shape.
    """
    def post(self, request):
        ser = OrderCreateSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            listing = Listing.objects.get(id=ser.validated_data['listing_id'], status='active')
        except Listing.DoesNotExist:
            return Response({'detail': 'Listing not found or not active.'}, status=status.HTTP_404_NOT_FOUND)

        if listing.supplier_id == request.user.id:
            return Response({'detail': 'You cannot order your own listing.'}, status=status.HTTP_400_BAD_REQUEST)

        qty = ser.validated_data['quantity']

        # Check minimum order quantity
        if qty < listing.min_order_qty:
            return Response(
                {'detail': f'Minimum order is {listing.min_order_qty} {listing.unit}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check available stock
        if listing.quantity < qty:
            return Response(
                {'detail': f'Only {listing.quantity} {listing.unit} available.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = Order.objects.create(
            buyer=request.user,
            supplier_id=listing.supplier_id,
            listing=listing,
            quantity=qty,
            unit_price=listing.price,
            total_price=listing.price * qty,
            notes=ser.validated_data.get('notes', ''),
        )

        # Deduct stock
        listing.quantity = listing.quantity - qty
        listing.save(update_fields=['quantity'])

        # Notify the supplier
        Notification.objects.create(
            user_id=listing.supplier_id,
            type='order',
            title='New order received',
            body=f'{request.user.get_full_name() or request.user.username} ordered {qty} {listing.unit} of {listing.product_name}.',
            listing_id=listing.id,
        )

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    """
    GET  /api/orders/<order_id>/   — fetch single order
    PATCH /api/orders/<order_id>/  — supplier updates status (confirmed/shipped/delivered/cancelled)
    """
    def _get_order(self, order_id, user):
        try:
            return Order.objects.select_related('listing', 'supplier', 'buyer').get(id=order_id)
        except Order.DoesNotExist:
            return None

    def get(self, request, order_id):
        order = self._get_order(order_id, request.user)
        if not order:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Only buyer or supplier may view
        if request.user.id not in (order.buyer_id, order.supplier_id):
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(OrderSerializer(order).data)

    def patch(self, request, order_id):
        order = self._get_order(order_id, request.user)
        if not order:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        valid = {'confirmed', 'shipped', 'delivered', 'cancelled'}
        if new_status not in valid:
            return Response({'detail': f'status must be one of: {", ".join(valid)}'}, status=status.HTTP_400_BAD_REQUEST)

        is_supplier = request.user.id == order.supplier_id
        is_buyer    = request.user.id == order.buyer_id

        # Buyers may only cancel their own pending orders
        if is_buyer and not is_supplier:
            if new_status != 'cancelled':
                return Response({'detail': 'Buyers may only cancel orders.'}, status=status.HTTP_403_FORBIDDEN)
            if order.status != 'pending':
                return Response({'detail': 'You can only cancel orders that are still pending.'}, status=status.HTTP_400_BAD_REQUEST)
        elif not is_supplier:
            return Response({'detail': 'Only the supplier may update order status.'}, status=status.HTTP_403_FORBIDDEN)

        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])

        # Restore stock if cancelled
        if new_status == 'cancelled' and order.listing_id:
            from listings.models import Listing as ListingModel
            ListingModel.objects.filter(pk=order.listing_id).update(
                quantity=django_models.F('quantity') + order.quantity
            )

        # Notify the buyer
        labels = {
            'confirmed': 'Order confirmed',
            'shipped':   'Order shipped',
            'delivered': 'Order delivered',
            'cancelled': 'Order cancelled',
        }
        Notification.objects.create(
            user_id=order.buyer_id,
            type='order',
            title=labels[new_status],
            body=f'Your order for {order.listing.product_name if order.listing else "a listing"} has been {new_status}.',
            listing_id=order.listing_id,
        )

        return Response(OrderSerializer(order).data)


class SupplierOrderListView(APIView):
    """
    GET /api/orders/incoming/
    Supplier's view — all orders placed on their listings.
    """
    def get(self, request):
        orders = Order.objects.filter(supplier=request.user).select_related('listing', 'buyer')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
