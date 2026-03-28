from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display  = ('id', 'buyer', 'supplier', 'listing', 'quantity', 'total_price', 'status', 'created_at')
    list_filter   = ('status', 'created_at')
    search_fields = ('buyer__username', 'supplier__username')
    ordering      = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
