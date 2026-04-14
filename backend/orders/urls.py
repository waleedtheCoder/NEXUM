from django.urls import path
from . import views
from .review_views import CreateReviewView, SupplierReviewsView

urlpatterns = [
    path('',           views.OrderListView.as_view()),          # GET  /api/orders/
    path('place/',     views.OrderPlaceView.as_view()),         # POST /api/orders/place/
    path('incoming/',  views.SupplierOrderListView.as_view()),  # GET  /api/orders/incoming/
    path('reviews/',   SupplierReviewsView.as_view()),          # GET  /api/orders/reviews/?supplier_id=X
    path('<int:order_id>/', views.OrderDetailView.as_view()),   # GET/PATCH /api/orders/<id>/
    path('<int:order_id>/review/', CreateReviewView.as_view()), # POST /api/orders/<id>/review/
]
