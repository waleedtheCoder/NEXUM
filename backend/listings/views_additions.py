import uuid

from django.db.models import Count

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .models import Listing, SavedListing
from .serializers import ListingCardSerializer
from core.storage import upload_image, StorageNotConfigured, StorageUploadFailed


# ── 3. Trending search ───────────────────────────────────────────────────────

class TrendingSearchView(APIView):
    """
    GET /api/listings/search/trending/
    Public. Returns the most-viewed listings and most-searched supplier names
    to populate the suggestion chips in SearchScreen.js.

    Response:
    {
        "popularProducts":  ["Premium Basmati Rice 25kg", ...],   // top 6 by views
        "popularSuppliers": ["Bismillah Rice Mills", ...]          // top 6 by listing count
    }
    """
    authentication_classes = []
    permission_classes     = [AllowAny]

    def get(self, request):
        # Top 6 most-viewed active listing titles
        top_listings = (
            Listing.objects
            .filter(status='active')
            .order_by('-views')
            .values_list('product_name', flat=True)[:6]
        )

        # Top 6 suppliers by number of active listings
        from django.contrib.auth.models import User
        top_suppliers = (
            Listing.objects
            .filter(status='active')
            .values('supplier__id')
            .annotate(listing_count=Count('id'))
            .order_by('-listing_count')
            .values_list('supplier__first_name', 'supplier__last_name')[:6]
        )
        supplier_names = [
            f"{fn} {ln}".strip() or f"Supplier #{i+1}"
            for i, (fn, ln) in enumerate(top_suppliers)
        ]

        return Response({
            'popularProducts':  list(top_listings),
            'popularSuppliers': supplier_names,
        })


# ── 4. Saved listings list ───────────────────────────────────────────────────

class SavedListingsView(APIView):
    """
    GET /api/listings/saved/
    Protected. Returns all listings the current user has saved (hearted).

    Response: array of listing card objects (same shape as GET /api/listings/).
    """
    def get(self, request):
        saved_ids = SavedListing.objects.filter(
            user=request.user
        ).values_list('listing_id', flat=True)

        listings = Listing.objects.filter(id__in=saved_ids, status='active').select_related('supplier__profile', 'promotion').prefetch_related('images')
        serializer = ListingCardSerializer(listings, many=True)
        return Response(serializer.data)


# ── 7. Image upload ───────────────────────────────────────────────────────────

class ImageUploadView(APIView):
    """
    POST /api/listings/upload-image/
    Protected. Accepts a multipart image file, uploads it to Supabase Storage,
    and returns the public CDN URL.

    Request:  multipart/form-data  { image: <file> }
    Response: { imageUrl: "https://<project>.supabase.co/storage/v1/object/public/listings/<uuid>.<ext>" }
    """
    ALLOWED_TYPES  = {'image/jpeg', 'image/png', 'image/webp'}
    MAX_SIZE_BYTES = 5 * 1024 * 1024   # 5 MB

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({'detail': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if image.content_type not in self.ALLOWED_TYPES:
            return Response(
                {'detail': 'Unsupported file type. Use JPEG, PNG, or WebP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if image.size > self.MAX_SIZE_BYTES:
            return Response(
                {'detail': 'File too large. Maximum size is 5 MB.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ext      = image.name.rsplit('.', 1)[-1].lower() if '.' in image.name else 'jpg'
        filename = f"{uuid.uuid4().hex}.{ext}"

        try:
            public_url = upload_image(image.read(), image.content_type, filename)
        except StorageNotConfigured as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except StorageUploadFailed as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({'imageUrl': public_url}, status=status.HTTP_201_CREATED)
