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

urlpatterns = [
    # ── Public (no auth required) ────────────────────────────────────────
    path('',              ListingsView.as_view(),     name='listings-list'),
    path('search/',       SearchView.as_view(),        name='listings-search'),
    path('categories/',   CategoriesView.as_view(),    name='listings-categories'),
    path('<int:pk>/',     ListingDetailView.as_view(), name='listing-detail'),

    # ── Protected (requires auth) ────────────────────────────────────────
    path('my/',                      MyListingsView.as_view(),       name='my-listings'),
    path('create/',                  CreateListingView.as_view(),    name='listing-create'),
    path('<int:pk>/manage/',         ListingManageView.as_view(),    name='listing-manage'),
    path('<int:pk>/save/',           SaveListingView.as_view(),      name='listing-save'),
    path('supplier/dashboard/',      SupplierDashboardView.as_view(), name='supplier-dashboard'),
]
