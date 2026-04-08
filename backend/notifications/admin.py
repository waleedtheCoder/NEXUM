from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'type', 'title', 'is_read', 'created_at']
    list_filter   = ['type', 'is_read']
    search_fields = ['user__email', 'title', 'body']
    readonly_fields = ['created_at']

    # Allow admin to trigger notifications manually for testing
    actions = ['mark_all_read']

    @admin.action(description='Mark selected notifications as read')
    def mark_all_read(self, request, queryset):
        queryset.update(is_read=True)
