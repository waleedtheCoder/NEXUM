import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import models as django_models

from .models import Conversation, Message


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat.

    Connection URL:  ws://<host>/ws/chat/<conv_id>/?token=<firebase_id_token>

    Each conversation maps to a channel group named  chat_<conv_id>.
    Both participants join the same group on connect. When one sends a message,
    it is persisted to the database and then broadcast to the whole group,
    so both sides receive it instantly without polling.

    Auth flow:
      1. Client appends ?token=<id_token> to the WebSocket URL.
      2. Consumer verifies it with Firebase Admin SDK (same as HTTP endpoints).
      3. Consumer checks the user is a participant in that conversation.
      4. If either check fails, closes the socket with a 4001 / 4003 code.
    """

    async def connect(self):
        self.conv_id    = self.scope['url_route']['kwargs']['conv_id']
        self.group_name = f"chat_{self.conv_id}"

        query_string = self.scope.get('query_string', b'').decode()
        token = self._parse_qs_token(query_string)
        user  = await self._authenticate(token)

        if user is None:
            await self.close(code=4001)
            return

        if not await self._is_participant(user, self.conv_id):
            await self.close(code=4003)
            return

        self.user = user
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """Client sends: { "text": "message content" }"""
        try:
            payload = json.loads(text_data)
            text    = payload.get('text', '').strip()
        except (json.JSONDecodeError, AttributeError):
            return

        if not text:
            return

        message = await self._save_message(self.user, self.conv_id, text)
        if not message:
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type':      'chat.message',
                'id':        str(message.id),
                'text':      message.text,
                'time':      message.created_at.strftime('%I:%M %p'),
                'sender_id': self.user.id,
            }
        )

    async def chat_message(self, event):
        """
        Handles the group broadcast. Sets mine=True/False per connection.
        Called automatically by Channels when a chat.message event arrives.
        """
        await self.send(text_data=json.dumps({
            'id':   event['id'],
            'text': event['text'],
            'time': event['time'],
            'mine': event['sender_id'] == self.user.id,
        }))

    # ── Private helpers ───────────────────────────────────────────────────────

    def _parse_qs_token(self, query_string: str):
        for part in query_string.split('&'):
            if part.startswith('token='):
                return part[len('token='):]
        return None

    @database_sync_to_async
    def _authenticate(self, token):
        if not token:
            return None
        try:
            import firebase_admin.auth as fa
            decoded = fa.verify_id_token(token)
            uid     = decoded['uid']
            from users.models import UserProfile
            return UserProfile.objects.select_related('user').get(firebase_uid=uid).user
        except Exception:
            return None

    @database_sync_to_async
    def _is_participant(self, user, conv_id):
        return Conversation.objects.filter(
            id=conv_id
        ).filter(
            django_models.Q(buyer=user) | django_models.Q(seller=user)
        ).exists()

    @database_sync_to_async
    def _save_message(self, sender, conv_id, text):
        try:
            conv = Conversation.objects.get(id=conv_id)
            msg  = Message.objects.create(
                conversation=conv,
                sender=sender,
                text=text,
            )
            conv.last_message = text
            if sender.id == conv.buyer_id:
                conv.seller_unread = django_models.F('seller_unread') + 1
            else:
                conv.buyer_unread  = django_models.F('buyer_unread') + 1
            conv.save(update_fields=['last_message', 'buyer_unread', 'seller_unread', 'updated_at'])
            return msg
        except Conversation.DoesNotExist:
            return None
