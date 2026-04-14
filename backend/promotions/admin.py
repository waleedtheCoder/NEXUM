from django.contrib import admin
from .models import Promotion


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display  = ('title', 'badge', 'is_active', 'order', 'starts_at', 'ends_at')
    list_filter   = ('is_active',)
    ordering      = ('order',)
    list_editable = ('is_active', 'order')
