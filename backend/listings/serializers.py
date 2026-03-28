from rest_framework import serializers
from .models import Listing, SavedListing
from .utils import time_ago, get_initials, compute_total_value


class ListingCardSerializer(serializers.ModelSerializer):
    """
    Compact shape used by MarketplaceBrowsingScreen and MobileListingScreen.
    Field names match the mock data exactly so no frontend changes are needed.
    """
    id        = serializers.IntegerField()
    title     = serializers.CharField(source='product_name')
    price     = serializers.DecimalField(max_digits=12, decimal_places=2)
    location  = serializers.CharField()
    time      = serializers.SerializerMethodField()
    isFeatured = serializers.BooleanField(source='is_featured')
    imageUrl  = serializers.URLField(source='image_url')
    category  = serializers.CharField()

    class Meta:
        model  = Listing
        fields = ['id', 'title', 'price', 'location', 'time', 'isFeatured', 'imageUrl', 'category']

    def get_time(self, obj):
        return time_ago(obj.created_at)


class ListingDetailSerializer(serializers.ModelSerializer):
    """
    Full shape used by ProductDetailScreen.
    Mirrors the DEFAULT_PRODUCT structure in ProductDetailScreen.js exactly.
    """
    id         = serializers.IntegerField()
    title      = serializers.CharField(source='product_name')
    price      = serializers.DecimalField(max_digits=12, decimal_places=2)
    location   = serializers.CharField()
    timePosted = serializers.SerializerMethodField()
    isFeatured = serializers.BooleanField(source='is_featured')
    images     = serializers.SerializerMethodField()
    details    = serializers.SerializerMethodField()
    description = serializers.CharField()
    seller     = serializers.SerializerMethodField()

    class Meta:
        model  = Listing
        fields = [
            'id', 'title', 'price', 'location', 'timePosted',
            'isFeatured', 'images', 'details', 'description', 'seller',
        ]

    def get_timePosted(self, obj):
        return time_ago(obj.created_at)

    def get_images(self, obj):
        return [obj.image_url] if obj.image_url else []

    def get_details(self, obj):
        return [
            {'label': 'Category',   'value': obj.category},
            {'label': 'Quantity',   'value': f'{obj.quantity} {obj.unit} available'},
            {'label': 'Min. Order', 'value': f'25 {obj.unit}'},
            {'label': 'Condition',  'value': obj.condition},
        ]

    def get_seller(self, obj):
        supplier = obj.supplier
        name     = supplier.first_name or supplier.email or 'Supplier'
        profile  = getattr(supplier, 'profile', None)
        return {
            'id':       supplier.pk,
            'name':     name,
            'initials': get_initials(name),
            'rating':   4.8,
            'sales':    0,
            'phone':    (profile.phone_number or '') if profile else '',
        }


class MyListingSerializer(serializers.ModelSerializer):
    """
    Shape used by MyListingsScreen for the supplier's own listings.
    Also returned by CreateListingView and ListingManageView (PATCH).

    FIX: added `description` field so CreateListingScreen edit mode
    pre-fills the description field instead of clearing it on save.
    """
    id           = serializers.CharField(source='pk')
    productName  = serializers.CharField(source='product_name')
    description  = serializers.CharField(default='')          # ← was missing
    category     = serializers.CharField()
    quantity     = serializers.SerializerMethodField()
    unit         = serializers.CharField()
    pricePerUnit = serializers.DecimalField(source='price', max_digits=12, decimal_places=2)
    totalValue   = serializers.SerializerMethodField()
    status       = serializers.CharField()
    imageUrl     = serializers.URLField(source='image_url')
    postedDate   = serializers.SerializerMethodField()
    location     = serializers.CharField()
    views        = serializers.IntegerField()
    inquiries    = serializers.SerializerMethodField()

    class Meta:
        model  = Listing
        fields = [
            'id', 'productName', 'description', 'category', 'quantity', 'unit',
            'pricePerUnit', 'totalValue', 'status', 'imageUrl',
            'postedDate', 'location', 'views', 'inquiries',
        ]

    def get_quantity(self, obj):
        return str(obj.quantity)

    def get_totalValue(self, obj):
        return compute_total_value(obj.price, obj.quantity)

    def get_postedDate(self, obj):
        return time_ago(obj.created_at)

    def get_inquiries(self, obj):
        return obj.conversations.count()


class CreateListingSerializer(serializers.Serializer):
    """Validates the CreateListingScreen form submission."""
    productName = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False, default='')
    price       = serializers.DecimalField(max_digits=12, decimal_places=2)
    quantity    = serializers.IntegerField(min_value=1)
    unit        = serializers.ChoiceField(
        choices=['kg', 'liters', 'pieces', 'boxes', 'cartons', 'bags', 'bottles'],
        default='kg',
    )
    condition   = serializers.ChoiceField(
        choices=['New', 'Bulk Wholesale', 'Clearance Stock'],
        default='New',
    )
    location    = serializers.CharField(max_length=255)
    category    = serializers.CharField(max_length=100, default='General')
    imageUrl    = serializers.URLField(required=False, allow_blank=True, default='')


class UpdateListingSerializer(serializers.Serializer):
    """Partial update — all fields optional."""
    productName = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(allow_blank=True, required=False)
    price       = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    quantity    = serializers.IntegerField(min_value=1, required=False)
    unit        = serializers.ChoiceField(
        choices=['kg', 'liters', 'pieces', 'boxes', 'cartons', 'bags', 'bottles'],
        required=False,
    )
    condition   = serializers.ChoiceField(
        choices=['New', 'Bulk Wholesale', 'Clearance Stock'],
        required=False,
    )
    location    = serializers.CharField(max_length=255, required=False)
    status      = serializers.ChoiceField(
        choices=['active', 'pending', 'removed'],
        required=False,
    )
    imageUrl    = serializers.URLField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('Provide at least one field to update.')
        return attrs