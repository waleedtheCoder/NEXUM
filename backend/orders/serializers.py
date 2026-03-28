from rest_framework import serializers
from .models import Order
from listings.utils import time_ago


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer for order list view (shopkeeper's RECENT_ORDERS).
    camelCase field names match frontend mock shape exactly.
    """
    id            = serializers.SerializerMethodField()
    productName   = serializers.SerializerMethodField()
    supplierName  = serializers.SerializerMethodField()
    unitPrice     = serializers.DecimalField(source='unit_price',  max_digits=10, decimal_places=2)
    totalPrice    = serializers.DecimalField(source='total_price', max_digits=12, decimal_places=2)
    imageUrl      = serializers.SerializerMethodField()
    orderDate     = serializers.SerializerMethodField()
    statusLabel   = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'productName', 'supplierName',
            'quantity', 'unitPrice', 'totalPrice',
            'imageUrl', 'status', 'statusLabel', 'orderDate',
        ]

    def get_id(self, obj):
        return str(obj.id)

    def get_productName(self, obj):
        return obj.listing.product_name if obj.listing else 'Listing removed'

    def get_supplierName(self, obj):
        return obj.supplier.get_full_name() or obj.supplier.username if obj.supplier else 'Unknown'

    def get_imageUrl(self, obj):
        return obj.listing.image_url if obj.listing else ''

    def get_orderDate(self, obj):
        return time_ago(obj.created_at)

    def get_statusLabel(self, obj):
        labels = {
            'pending':   'Pending',
            'confirmed': 'Confirmed',
            'shipped':   'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled',
        }
        return labels.get(obj.status, obj.status.title())


class OrderCreateSerializer(serializers.Serializer):
    """Validates the body for POST /api/orders/place/"""
    listing_id = serializers.IntegerField()
    quantity   = serializers.IntegerField(min_value=1)
    notes      = serializers.CharField(required=False, allow_blank=True)
