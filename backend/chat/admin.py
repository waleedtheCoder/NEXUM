from django.contrib import admin
from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display  = ['id', 'buyer', 'seller', 'listing', 'last_message', 'buyer_unread', 'seller_unread', 'updated_at']
    list_filter   = ['is_favourite']
    search_fields = ['buyer__email', 'seller__email', 'listing__product_name']
    raw_id_fields = ['buyer', 'seller', 'listing']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ['id', 'conversation', 'sender', 'text', 'is_read', 'created_at']
    list_filter   = ['is_read']
    search_fields = ['sender__email', 'text']
    raw_id_fields = ['conversation', 'sender']
