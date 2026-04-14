from django.contrib import admin
from .models import Listing, SavedListing


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display  = ['product_name', 'supplier', 'category', 'price', 'quantity', 'unit', 'status', 'is_featured', 'views', 'created_at']
    list_filter   = ['status', 'category', 'is_featured', 'condition']
    search_fields = ['product_name', 'supplier__email', 'supplier__first_name', 'location']
    readonly_fields = ['views', 'created_at', 'updated_at']
    actions = ['approve_listings', 'feature_listings', 'unfeature_listings']

    @admin.action(description='Approve selected listings (set to active)')
    def approve_listings(self, request, queryset):
        queryset.update(status='active')

    @admin.action(description='Mark selected as featured')
    def feature_listings(self, request, queryset):
        queryset.update(is_featured=True)

    @admin.action(description='Remove featured status')
    def unfeature_listings(self, request, queryset):
        queryset.update(is_featured=False)


@admin.register(SavedListing)
class SavedListingAdmin(admin.ModelAdmin):
    list_display = ['user', 'listing', 'created_at']
    search_fields = ['user__email', 'listing__product_name']
