from django.db import models as django_models
from django.db import transaction
from django.db.models import F

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from listings.models import Listing

from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer


class OrderPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 100


class OrderListView(APIView):
    """
    GET /api/orders/
    Returns the current buyer's order history.
    """

    def get(self, request):

        orders = (
            Order.objects
            .filter(buyer=request.user)
            .select_related('listing', 'supplier', 'buyer')
            .only(
                'id',
                'status',
                'quantity',
                'unit_price',
                'total_price',
                'created_at',
                'notes',

                'listing__product_name',
                'listing__unit',
                'listing__image_url',

                'supplier__username',
                'supplier__first_name',
                'supplier__last_name',

                'buyer__username',
                'buyer__first_name',
                'buyer__last_name',
            )
            .order_by('-created_at')
        )

        paginator = OrderPagination()

        result_page = paginator.paginate_queryset(
            orders,
            request
        )

        serializer = OrderSerializer(
            result_page,
            many=True
        )

        return paginator.get_paginated_response(
            serializer.data
        )


class SupplierOrderListView(APIView):
    """
    GET /api/orders/incoming/
    Supplier's incoming orders.
    """

    def get(self, request):

        orders = (
            Order.objects
            .filter(supplier=request.user)
            .select_related('listing', 'supplier', 'buyer')
            .only(
                'id',
                'status',
                'quantity',
                'unit_price',
                'total_price',
                'created_at',
                'notes',

                'listing__product_name',
                'listing__unit',
                'listing__image_url',

                'supplier__username',
                'supplier__first_name',
                'supplier__last_name',

                'buyer__username',
                'buyer__first_name',
                'buyer__last_name',
            )
            .order_by('-created_at')
        )

        paginator = OrderPagination()

        result_page = paginator.paginate_queryset(
            orders,
            request
        )

        serializer = OrderSerializer(
            result_page,
            many=True
        )

        return paginator.get_paginated_response(
            serializer.data
        )


class OrderPlaceView(APIView):
    """
    POST /api/orders/place/
    Shopkeeper places an order safely.
    """

    def post(self, request):

        ser = OrderCreateSerializer(data=request.data)

        if not ser.is_valid():
            return Response(
                ser.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        qty = ser.validated_data['quantity']

        try:

            with transaction.atomic():

                listing = (
                    Listing.objects
                    .select_for_update()
                    .get(
                        id=ser.validated_data['listing_id'],
                        status='active'
                    )
                )

                if listing.supplier_id == request.user.id:
                    return Response(
                        {
                            'detail': (
                                'You cannot order your own listing.'
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if qty < listing.min_order_qty:
                    return Response(
                        {
                            'detail': (
                                f'Minimum order is '
                                f'{listing.min_order_qty} '
                                f'{listing.unit}.'
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if listing.quantity < qty:
                    return Response(
                        {
                            'detail': (
                                f'Only {listing.quantity} '
                                f'{listing.unit} available.'
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
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

                Listing.objects.filter(
                    pk=listing.pk
                ).update(
                    quantity=F('quantity') - qty
                )

        except Listing.DoesNotExist:

            return Response(
                {
                    'detail': (
                        'Listing not found or not active.'
                    )
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )


class OrderDetailView(APIView):
    """
    GET /api/orders/<order_id>/
    PATCH /api/orders/<order_id>/
    """

    def _get_order(self, order_id):

        return (
            Order.objects
            .select_related('listing', 'supplier', 'buyer')
            .filter(id=order_id)
            .first()
        )

    def get(self, request, order_id):

        order = self._get_order(order_id)

        if not order:
            return Response(
                {'detail': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user.id not in (
            order.buyer_id,
            order.supplier_id
        ):
            return Response(
                {'detail': 'Forbidden.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response(OrderSerializer(order).data)

    def patch(self, request, order_id):

        order = self._get_order(order_id)

        if not order:
            return Response(
                {'detail': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get('status')

        valid = {
            'confirmed',
            'shipped',
            'delivered',
            'cancelled',
        }

        if new_status not in valid:
            return Response(
                {
                    'detail': (
                        f'status must be one of: '
                        f'{", ".join(valid)}'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        is_supplier = request.user.id == order.supplier_id
        is_buyer = request.user.id == order.buyer_id

        if is_buyer and not is_supplier:

            if new_status != 'cancelled':
                return Response(
                    {
                        'detail': (
                            'Buyers may only cancel orders.'
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if order.status != 'pending':
                return Response(
                    {
                        'detail': (
                            'You can only cancel orders '
                            'that are still pending.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        elif not is_supplier:
            return Response(
                {
                    'detail': (
                        'Only the supplier may '
                        'update order status.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        order.status = new_status

        order.save(
            update_fields=['status', 'updated_at']
        )

        if (
            new_status == 'cancelled'
            and order.listing_id
        ):

            Listing.objects.filter(
                pk=order.listing_id
            ).update(
                quantity=django_models.F('quantity')
                + order.quantity
            )

        return Response(OrderSerializer(order).data)