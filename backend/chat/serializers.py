from rest_framework import serializers
from .models import Conversation, Message
from listings.utils import time_ago, get_initials, avatar_color_for


class MessageSerializer(serializers.ModelSerializer):
    """
    Shape used by ChatConversationScreen.
    Field names match the INITIAL_MESSAGES mock array exactly:
      { id, text, time, mine }
    """
    id   = serializers.CharField(source='pk')
    text = serializers.CharField()
    time = serializers.SerializerMethodField()
    mine = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = ['id', 'text', 'time', 'mine']

    def get_time(self, obj):
        if not obj.created_at:
            return ''
        t = obj.created_at
        hour = t.hour % 12 or 12
        return f"{hour}:{t.strftime('%M %p')}"

    def get_mine(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender_id == request.user.id
        return False


class ConversationListSerializer(serializers.ModelSerializer):
    """
    Shape used by ChatListScreen.
    Field names match the MOCK_CHATS array exactly:
      { id, username, productTitle, secondaryDetail, timestamp,
        isUnread, isFavourite, avatarColor, avatarInitial, type }
    """
    id              = serializers.CharField(source='pk')
    username        = serializers.SerializerMethodField()
    productTitle    = serializers.SerializerMethodField()
    secondaryDetail = serializers.SerializerMethodField()
    timestamp       = serializers.SerializerMethodField()
    isUnread        = serializers.SerializerMethodField()
    isFavourite     = serializers.BooleanField(source='is_favourite')
    avatarColor     = serializers.SerializerMethodField()
    avatarInitial   = serializers.SerializerMethodField()
    type            = serializers.SerializerMethodField()   # "buying" | "selling"

    class Meta:
        model  = Conversation
        fields = [
            'id', 'username', 'productTitle', 'secondaryDetail',
            'timestamp', 'isUnread', 'isFavourite',
            'avatarColor', 'avatarInitial', 'type',
        ]

    def _other_party(self, obj):
        """Return the participant that is NOT the requesting user."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if obj.buyer_id == request.user.id:
                return obj.seller
            return obj.buyer
        return obj.seller

    def get_username(self, obj):
        other = self._other_party(obj)
        return other.first_name or other.email or 'User'

    def get_productTitle(self, obj):
        return obj.listing.product_name if obj.listing else 'General inquiry'

    def get_secondaryDetail(self, obj):
        return obj.last_message or ''

    def get_timestamp(self, obj):
        return time_ago(obj.updated_at)

    def get_isUnread(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.unread_for(request.user) > 0
        return False

    def get_avatarColor(self, obj):
        other = self._other_party(obj)
        return avatar_color_for(other.id)

    def get_avatarInitial(self, obj):
        name = self.get_username(obj)
        return get_initials(name)

    def get_type(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return 'buying' if obj.buyer_id == request.user.id else 'selling'
        return 'buying'


class SendMessageSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=4096)


class StartConversationSerializer(serializers.Serializer):
    listing_id = serializers.IntegerField()
    message    = serializers.CharField(max_length=4096)
