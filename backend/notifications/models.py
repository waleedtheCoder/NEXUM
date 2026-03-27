from django.db import models
from django.contrib.auth.models import User


class Notification(models.Model):
    TYPE_CHOICES = [
        ('inquiry',  'Inquiry'),
        ('price',    'Price Alert'),
        ('restock',  'Restock Reminder'),
        ('supplier', 'New Supplier'),
        ('promo',    'Promotion'),
        ('system',   'System'),
    ]

    user    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type    = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    title   = models.CharField(max_length=255)
    body    = models.TextField()
    is_read = models.BooleanField(default=False)
    # Optional link-back to a conversation or listing
    conversation_id = models.IntegerField(null=True, blank=True)
    listing_id      = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.user.email}: {self.title}"

    # Icon and colour helpers — mirror the static values in NotificationsScreen
    ICON_MAP = {
        'inquiry':  ('chatbubble-ellipses', '#00A859'),
        'price':    ('trending-down',        '#10B981'),
        'restock':  ('reload-circle',        '#F59E0B'),
        'supplier': ('business',             '#8B5CF6'),
        'promo':    ('pricetag',             '#F59E0B'),
        'system':   ('checkmark-circle',     '#10B981'),
    }

    @property
    def icon(self):
        return self.ICON_MAP.get(self.type, ('notifications', '#9CA3AF'))[0]

    @property
    def color(self):
        return self.ICON_MAP.get(self.type, ('notifications', '#9CA3AF'))[1]
