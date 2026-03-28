from django.urls import path
from . import views

urlpatterns = [
    path('',           views.OrderListView.as_view()),          # GET  /api/orders/
    path('place/',     views.OrderPlaceView.as_view()),         # POST /api/orders/place/
    path('incoming/',  views.SupplierOrderListView.as_view()),  # GET  /api/orders/incoming/
    path('<int:order_id>/', views.OrderDetailView.as_view()),   # GET/PATCH /api/orders/<id>/
]
