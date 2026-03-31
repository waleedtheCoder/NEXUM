from rest_framework import serializers
from .models import Order
from listings.utils import time_ago


class OrderSerializer(serializers.ModelSerializer):
    """
    Used by both endpoints:
      GET /api/orders/           — shopkeeper's order history
      GET /api/orders/incoming/  — supplier's incoming orders

    camelCase field names match the frontend exactly.
    Fields present in both views:
      id, productName, quantity, unit, unitPrice, totalPrice,
      imageUrl, status, statusLabel, orderDate, notes
    Shopkeeper uses: supplierName
    Supplier uses:   buyerName
    Both fields are always included — each view just ignores the one it doesn't need.
    """
    id           = serializers.SerializerMethodField()
    productName  = serializers.SerializerMethodField()
    supplierName = serializers.SerializerMethodField()
    buyerName    = serializers.SerializerMethodField()
    unit         = serializers.SerializerMethodField()
    unitPrice    = serializers.DecimalField(source='unit_price',  max_digits=10, decimal_places=2)
    totalPrice   = serializers.DecimalField(source='total_price', max_digits=12, decimal_places=2)
    imageUrl     = serializers.SerializerMethodField()
    orderDate    = serializers.SerializerMethodField()
    statusLabel  = serializers.SerializerMethodField()
    hasReview    = serializers.SerializerMethodField()
    notes        = serializers.CharField(default='')

    class Meta:
        model  = Order
        fields = [
            'id', 'productName', 'supplierName', 'buyerName',
            'quantity', 'unit', 'unitPrice', 'totalPrice',
            'imageUrl', 'status', 'statusLabel', 'orderDate', 'notes', 'hasReview',
        ]

    def get_id(self, obj):
        return str(obj.id)

    def get_productName(self, obj):
        return obj.listing.product_name if obj.listing else 'Listing removed'

    def get_supplierName(self, obj):
        if not obj.supplier:
            return 'Unknown'
        return obj.supplier.get_full_name() or obj.supplier.username

    def get_buyerName(self, obj):
        if not obj.buyer:
            return 'Unknown'
        return obj.buyer.get_full_name() or obj.buyer.username

    def get_unit(self, obj):
        return obj.listing.unit if obj.listing else 'units'

    def get_imageUrl(self, obj):
        return obj.listing.image_url if obj.listing else ''

    def get_orderDate(self, obj):
        return time_ago(obj.created_at)

    def get_hasReview(self, obj):
        return hasattr(obj, 'review')

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