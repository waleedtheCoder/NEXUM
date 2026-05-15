from rest_framework import serializers

from .models import Order
from listings.utils import time_ago


class OrderSerializer(serializers.ModelSerializer):

    productName = serializers.CharField(
        source='listing.product_name',
        default='Listing removed'
    )

    unit = serializers.CharField(
        source='listing.unit',
        default='units'
    )

    imageUrl = serializers.CharField(
        source='listing.image_url',
        default=''
    )

    supplierName = serializers.SerializerMethodField()

    buyerName = serializers.SerializerMethodField()

    unitPrice = serializers.DecimalField(
        source='unit_price',
        max_digits=10,
        decimal_places=2
    )

    totalPrice = serializers.DecimalField(
        source='total_price',
        max_digits=12,
        decimal_places=2
    )

    orderDate = serializers.SerializerMethodField()

    statusLabel = serializers.SerializerMethodField()

    hasReview = serializers.SerializerMethodField()

    notes = serializers.CharField(default='')

    class Meta:

        model = Order

        fields = [
            'id',
            'productName',
            'supplierName',
            'buyerName',
            'quantity',
            'unit',
            'unitPrice',
            'totalPrice',
            'imageUrl',
            'status',
            'statusLabel',
            'orderDate',
            'notes',
            'hasReview',
        ]

    def get_supplierName(self, obj):

        if not obj.supplier:
            return 'Unknown'

        full_name = obj.supplier.get_full_name()

        return full_name or obj.supplier.username

    def get_buyerName(self, obj):

        if not obj.buyer:
            return 'Unknown'

        full_name = obj.buyer.get_full_name()

        return full_name or obj.buyer.username

    def get_orderDate(self, obj):

        return time_ago(obj.created_at)

    def get_hasReview(self, obj):

        return False

    def get_statusLabel(self, obj):

        labels = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled',
        }

        return labels.get(
            obj.status,
            obj.status.title()
        )


class OrderCreateSerializer(serializers.Serializer):

    listing_id = serializers.IntegerField()

    quantity = serializers.IntegerField(
        min_value=1
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True
    )