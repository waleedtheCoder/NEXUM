from django.urls import path
from analytics.views import (
    MarketCurrentView,
    MarketHistoryView,
    MarketForecastView,
    MarketTopProductsView,
    SupplierAnalysisView,
    ShopkeeperRecommendationsView,
    AdminRefreshView,
)

urlpatterns = [
    path('market/current/',      MarketCurrentView.as_view()),
    path('market/history/',      MarketHistoryView.as_view()),
    path('market/forecast/',     MarketForecastView.as_view()),
    path('market/top-products/', MarketTopProductsView.as_view()),
    path('supplier/',            SupplierAnalysisView.as_view()),
    path('shopkeeper/',          ShopkeeperRecommendationsView.as_view()),
    path('admin/refresh/',       AdminRefreshView.as_view()),
]
