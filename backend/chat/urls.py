from django.urls import path
from .views import (
    ConversationListView,
    StartConversationView,
    MessageListView,
    SendMessageView,
    TypingView,
)

urlpatterns = [
    path('',                             ConversationListView.as_view(),  name='chat-list'),
    path('start/',                       StartConversationView.as_view(), name='chat-start'),
    path('<int:conv_id>/messages/',      MessageListView.as_view(),       name='chat-messages'),
    path('<int:conv_id>/messages/send/', SendMessageView.as_view(),       name='chat-send'),
    path('<int:conv_id>/typing/',        TypingView.as_view(),            name='chat-typing'),
]
