from rest_framework import serializers
from .models import Notification
from listings.utils import time_ago


class NotificationSerializer(serializers.ModelSerializer):
    """
    Field names match the NOTIFICATIONS mock array in NotificationsScreen.js:
      { id, type, title, body, time, read, icon, color }
    """
    id    = serializers.CharField(source='pk')
    type  = serializers.CharField()
    title = serializers.CharField()
    body  = serializers.CharField()
    time  = serializers.SerializerMethodField()
    read  = serializers.BooleanField(source='is_read')
    icon  = serializers.CharField()
    color = serializers.CharField()

    class Meta:
        model  = Notification
        fields = ['id', 'type', 'title', 'body', 'time', 'read', 'icon', 'color']

    def get_time(self, obj):
        return time_ago(obj.created_at)
