# ─────────────────────────────────────────────
# promotions/models.py
# ─────────────────────────────────────────────
from django.db import models


class Promotion(models.Model):
    title      = models.CharField(max_length=120)
    subtitle   = models.CharField(max_length=200, blank=True)
    image_url  = models.URLField()
    action_url = models.CharField(max_length=300, blank=True,
                                  help_text='Deep-link or external URL the banner navigates to')
    badge      = models.CharField(max_length=40, blank=True,
                                  help_text='Short badge text e.g. "15% OFF", "NEW"')
    is_active  = models.BooleanField(default=True)
    order      = models.PositiveIntegerField(default=0,
                                             help_text='Display order — lower number shown first')
    starts_at  = models.DateTimeField(null=True, blank=True)
    ends_at    = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title
