# ─────────────────────────────────────────────────────────────────────────────
# listings/urls_additions.py
#
# MERGE these path() entries into the existing listings/urls.py urlpatterns list.
# ─────────────────────────────────────────────────────────────────────────────
from django.urls import path
from .views_additions import TrendingSearchView, SavedListingsView, ImageUploadView

# Add to existing listings/urls.py:
extra_urlpatterns = [
    path('search/trending/', TrendingSearchView.as_view()),   # GET  /api/listings/search/trending/
    path('saved/',           SavedListingsView.as_view()),    # GET  /api/listings/saved/
    path('upload-image/',    ImageUploadView.as_view()),      # POST /api/listings/upload-image/
]

# Also update users/urls.py with:
# path('supplier/<int:supplier_id>/', SupplierPublicProfileView.as_view()),
# → GET /api/users/supplier/<id>/
