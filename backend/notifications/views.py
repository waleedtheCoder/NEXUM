from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Notification
from .serializers import NotificationSerializer


class NotificationsView(APIView):
    """
    GET /api/notifications/
    Returns all notifications for the authenticated user, used by NotificationsScreen.
    Query params:
      - filter  ("all" | "unread" | "inquiries" | "alerts") — mirrors the FILTER_TABS
    """
    def get(self, request):
        qs = Notification.objects.filter(user=request.user)

        f = request.query_params.get('filter', 'all').lower()
        if f == 'unread':
            qs = qs.filter(is_read=False)
        elif f == 'inquiries':
            qs = qs.filter(type='inquiry')
        elif f == 'alerts':
            qs = qs.filter(type__in=['price', 'restock', 'promo'])

        serializer = NotificationSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MarkNotificationReadView(APIView):
    """
    PATCH /api/notifications/<id>/read/
    Mark a single notification as read.
    """
    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)

        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notif).data, status=status.HTTP_200_OK)


class MarkAllReadView(APIView):
    """
    POST /api/notifications/mark-all-read/
    Mark every notification for the authenticated user as read.
    """
    def post(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': f'{updated} notification(s) marked as read.'}, status=status.HTTP_200_OK)
