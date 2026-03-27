from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Listing, SavedListing
from .serializers import (
    ListingCardSerializer,
    ListingDetailSerializer,
    MyListingSerializer,
    CreateListingSerializer,
    UpdateListingSerializer,
)
from .utils import time_ago, avatar_color_for, get_initials

# ---------------------------------------------------------------------------
# Static category data  (mirrors the frontend CategoryNavigationScreen)
# ---------------------------------------------------------------------------

CATEGORIES = [
    {
        'id': '1',
        'section': 'FOOD & GROCERY',
        'name': 'Rice & Grains',
        'icon': 'leaf',
    },
    {'id': '2',  'section': 'FOOD & GROCERY',        'name': 'Flour & Atta',                    'icon': 'bag'},
    {'id': '3',  'section': 'FOOD & GROCERY',        'name': 'Pulses & Lentils',                'icon': 'restaurant'},
    {'id': '4',  'section': 'FOOD & GROCERY',        'name': 'Cooking Oil & Ghee',              'icon': 'water'},
    {'id': '5',  'section': 'FOOD & GROCERY',        'name': 'Sugar & Salt',                    'icon': 'cube'},
    {'id': '6',  'section': 'FOOD & GROCERY',        'name': 'Spices & Masalas',                'icon': 'flame'},
    {'id': '7',  'section': 'FOOD & GROCERY',        'name': 'Tea & Coffee',                    'icon': 'cafe'},
    {'id': '8',  'section': 'FOOD & GROCERY',        'name': 'Dry Fruits & Nuts',               'icon': 'nutrition'},
    {'id': '9',  'section': 'SNACKS & BEVERAGES',    'name': 'Packaged Snacks & Biscuits',      'icon': 'fast-food'},
    {'id': '10', 'section': 'SNACKS & BEVERAGES',    'name': 'Beverages & Soft Drinks',         'icon': 'beer'},
    {'id': '11', 'section': 'SNACKS & BEVERAGES',    'name': 'Dairy Products',                  'icon': 'flask'},
    {'id': '12', 'section': 'SNACKS & BEVERAGES',    'name': 'Frozen Foods',                    'icon': 'snow'},
    {'id': '13', 'section': 'HOME & HYGIENE',        'name': 'Cleaning & Household',            'icon': 'sparkles'},
    {'id': '14', 'section': 'HOME & HYGIENE',        'name': 'Personal Care',                   'icon': 'body'},
    {'id': '15', 'section': 'HOME & HYGIENE',        'name': 'Packaging Materials',             'icon': 'archive'},
]


# ---------------------------------------------------------------------------
# Public — Marketplace (anyone can browse)
# ---------------------------------------------------------------------------

class ListingsView(APIView):
    """
    GET /api/listings/
    Query params:
      - category  (exact match, e.g. "Rice & Grains")
      - q         (search by product name / location)
      - sort      ("price_asc" | "price_desc" | "newest")
      - featured  ("true" to return featured only)
      - status    (default "active")

    Returns the compact card shape used by MarketplaceBrowsingScreen
    and MobileListingScreen.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        qs = Listing.objects.filter(status='active').select_related('supplier__profile')

        category = request.query_params.get('category', '').strip()
        if category:
            qs = qs.filter(category__iexact=category)

        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(product_name__icontains=q) |
                Q(location__icontains=q) |
                Q(category__icontains=q)
            )

        featured = request.query_params.get('featured', '').lower()
        if featured == 'true':
            qs = qs.filter(is_featured=True)

        sort = request.query_params.get('sort', 'newest')
        if sort == 'price_asc':
            qs = qs.order_by('price')
        elif sort == 'price_desc':
            qs = qs.order_by('-price')
        else:
            qs = qs.order_by('-created_at')

        serializer = ListingCardSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListingDetailView(APIView):
    """
    GET /api/listings/<id>/
    Returns the full product detail shape used by ProductDetailScreen.
    Also increments the view counter on each visit.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request, pk):
        try:
            listing = Listing.objects.select_related('supplier__profile').get(pk=pk)
        except Listing.DoesNotExist:
            return Response({'detail': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Increment view counter (fire-and-forget)
        Listing.objects.filter(pk=pk).update(views=listing.views + 1)

        serializer = ListingDetailSerializer(listing)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CategoriesView(APIView):
    """
    GET /api/listings/categories/
    Returns the full category tree so screens are not hardcoded.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(CATEGORIES, status=status.HTTP_200_OK)


class SearchView(APIView):
    """
    GET /api/listings/search/?q=...
    Unified search returning products only (supplier profiles coming later).
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'detail': 'Query parameter "q" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Listing.objects.filter(
            status='active'
        ).filter(
            Q(product_name__icontains=q) |
            Q(category__icontains=q) |
            Q(location__icontains=q) |
            Q(description__icontains=q)
        ).select_related('supplier__profile').order_by('-created_at')

        serializer = ListingCardSerializer(qs, many=True)
        return Response({'results': serializer.data}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Protected — Supplier listing management
# ---------------------------------------------------------------------------

class MyListingsView(APIView):
    """
    GET  /api/listings/my/
    Returns the authenticated supplier's own listings for MyListingsScreen.
    Query param:
      - status  ("active" | "pending" | "removed") — optional filter
    """
    def get(self, request):
        qs = Listing.objects.filter(supplier=request.user).order_by('-created_at')

        status_filter = request.query_params.get('status', '').strip()
        if status_filter in ('active', 'pending', 'removed'):
            qs = qs.filter(status=status_filter)

        serializer = MyListingSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateListingView(APIView):
    """
    POST /api/listings/create/
    Creates a new listing. Starts in "pending" status (needs admin approval).
    Matches the CreateListingScreen form fields exactly.
    """
    def post(self, request):
        serializer = CreateListingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        d = serializer.validated_data
        listing = Listing.objects.create(
            supplier=request.user,
            product_name=d['productName'],
            description=d.get('description', ''),
            price=d['price'],
            quantity=d['quantity'],
            unit=d.get('unit', 'kg'),
            condition=d.get('condition', 'New'),
            location=d['location'],
            category=d.get('category', 'General'),
            image_url=d.get('imageUrl', ''),
            status='pending',   # requires approval before going live
        )

        # Return in the myListing shape so MyListingsScreen can show it immediately
        return Response(
            MyListingSerializer(listing).data,
            status=status.HTTP_201_CREATED,
        )


class ListingManageView(APIView):
    """
    PATCH /api/listings/<id>/manage/  — edit listing fields
    DELETE /api/listings/<id>/manage/ — remove (soft-delete) a listing

    Only the listing's own supplier can call these.
    """
    def _get_owned_listing(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return None, Response({'detail': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)
        if listing.supplier_id != request.user.id:
            return None, Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        return listing, None

    def patch(self, request, pk):
        listing, err = self._get_owned_listing(request, pk)
        if err:
            return err

        serializer = UpdateListingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        d = serializer.validated_data
        # Map camelCase keys back to model fields
        field_map = {
            'productName': 'product_name',
            'description': 'description',
            'price': 'price',
            'quantity': 'quantity',
            'unit': 'unit',
            'condition': 'condition',
            'location': 'location',
            'status': 'status',
            'imageUrl': 'image_url',
        }
        for frontend_key, model_field in field_map.items():
            if frontend_key in d:
                setattr(listing, model_field, d[frontend_key])

        listing.save()
        return Response(MyListingSerializer(listing).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        listing, err = self._get_owned_listing(request, pk)
        if err:
            return err

        # Soft delete — set status to removed, keep record for audit
        listing.status = 'removed'
        listing.save(update_fields=['status'])
        return Response({'detail': 'Listing removed.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Protected — Save / unsave a listing (heart button)
# ---------------------------------------------------------------------------

class SaveListingView(APIView):
    """
    POST   /api/listings/<id>/save/   — save (heart) a listing
    DELETE /api/listings/<id>/save/   — unsave a listing
    """
    def _get_listing(self, pk):
        try:
            return Listing.objects.get(pk=pk), None
        except Listing.DoesNotExist:
            return None, Response({'detail': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, pk):
        listing, err = self._get_listing(pk)
        if err:
            return err
        SavedListing.objects.get_or_create(user=request.user, listing=listing)
        return Response({'detail': 'Listing saved.'}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        listing, err = self._get_listing(pk)
        if err:
            return err
        SavedListing.objects.filter(user=request.user, listing=listing).delete()
        return Response({'detail': 'Listing unsaved.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Protected — Supplier dashboard (SupplierAccountScreen)
# ---------------------------------------------------------------------------

class SupplierDashboardView(APIView):
    """
    GET /api/listings/supplier/dashboard/

    Returns the performance stats and recent inquiries that
    SupplierAccountScreen currently shows as hardcoded mock data.
    """
    def get(self, request):
        # Import here to avoid circular dependency at module load time
        from chat.models import Conversation, Message

        user = request.user

        # ── Performance stats ─────────────────────────────────────────────
        active_count  = Listing.objects.filter(supplier=user, status='active').count()
        pending_count = Listing.objects.filter(supplier=user, status='pending').count()
        total_inquiries = Conversation.objects.filter(seller=user).count()

        performance = [
            {
                'label': 'Active Listings',
                'value': str(active_count),
                'icon': 'cube-outline',
                'color': '#00A859',
            },
            {
                'label': 'Pending Review',
                'value': str(pending_count),
                'icon': 'time-outline',
                'color': '#F59E0B',
            },
            {
                'label': 'Total Inquiries',
                'value': str(total_inquiries),
                'icon': 'chatbubble-outline',
                'color': '#F59E0B',
            },
            {
                'label': 'Avg. Response',
                'value': '< 1hr',
                'icon': 'time-outline',
                'color': '#8B5CF6',
            },
        ]

        # ── Recent inquiries (last 10 conversations where user is seller) ─
        recent_convs = (
            Conversation.objects
            .filter(seller=user)
            .select_related('buyer', 'listing')
            .order_by('-updated_at')[:10]
        )

        recent_inquiries = []
        for conv in recent_convs:
            # Get the latest message in this conversation
            last_msg = conv.messages.order_by('-created_at').first()
            buyer_name = conv.buyer.first_name or conv.buyer.email or 'Buyer'
            recent_inquiries.append({
                'id': f'INQ-{conv.pk:03d}',
                'buyer': buyer_name,
                'product': conv.listing.product_name if conv.listing else 'Product inquiry',
                'message': last_msg.text if last_msg else '',
                'time': time_ago(conv.updated_at),
                'read': last_msg.is_read if last_msg else True,
                'avatarColor': avatar_color_for(conv.buyer_id),
                'init': get_initials(buyer_name),
            })

        return Response(
            {
                'performance': performance,
                'recent_inquiries': recent_inquiries,
            },
            status=status.HTTP_200_OK,
        )
