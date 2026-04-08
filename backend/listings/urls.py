from django.urls import path
from .views import (
    ListingsView,
    ListingDetailView,
    CategoriesView,
    SearchView,
    MyListingsView,
    CreateListingView,
    ListingManageView,
    SaveListingView,
    SupplierDashboardView,
)
from .views_additions import TrendingSearchView, SavedListingsView, ImageUploadView
from .promotion_view import ListingPromotionView

urlpatterns = [
    # ── Public (no auth required) ────────────────────────────────────────
    path('',                ListingsView.as_view(),      name='listings-list'),
    # IMPORTANT: search/trending/ must come BEFORE search/ to avoid being
    # swallowed by the search catch-all
    path('search/trending/', TrendingSearchView.as_view(), name='listings-trending'),
    path('search/',          SearchView.as_view(),          name='listings-search'),
    path('categories/',      CategoriesView.as_view(),      name='listings-categories'),

    # ── Protected (requires auth) ────────────────────────────────────────
    # IMPORTANT: saved/ must come BEFORE <int:pk>/ to avoid being matched as pk
    path('saved/',                   SavedListingsView.as_view(),    name='listings-saved'),
    path('upload-image/',            ImageUploadView.as_view(),      name='listings-upload-image'),
    path('my/',                      MyListingsView.as_view(),       name='my-listings'),
    path('create/',                  CreateListingView.as_view(),    name='listing-create'),
    path('supplier/dashboard/',      SupplierDashboardView.as_view(), name='supplier-dashboard'),
    path('<int:pk>/',                ListingDetailView.as_view(),    name='listing-detail'),
    path('<int:pk>/manage/',         ListingManageView.as_view(),    name='listing-manage'),
    path('<int:pk>/save/',           SaveListingView.as_view(),      name='listing-save'),
    path('<int:pk>/promote/',        ListingPromotionView.as_view(), name='listing-promote'),
]