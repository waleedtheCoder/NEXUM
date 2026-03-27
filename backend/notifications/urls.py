from django.urls import path
from .views import NotificationsView, MarkNotificationReadView, MarkAllReadView

urlpatterns = [
    path('',                    NotificationsView.as_view(),      name='notifications-list'),
    path('mark-all-read/',      MarkAllReadView.as_view(),        name='notifications-mark-all-read'),
    path('<int:pk>/read/',      MarkNotificationReadView.as_view(), name='notification-read'),
]
