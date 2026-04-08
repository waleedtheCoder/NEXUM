# promotions/urls.py
from django.urls import path
from .views import PromotionListView

urlpatterns = [
    path('', PromotionListView.as_view()),   # GET /api/promotions/
]
