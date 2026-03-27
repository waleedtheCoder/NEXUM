from django.db import IntegrityError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer,
    MessageSerializer,
    SendMessageSerializer,
    StartConversationSerializer,
)


class ConversationListView(APIView):
    """
    GET  /api/chat/
    Returns all conversations for the authenticated user, used by ChatListScreen.
    Query params:
      - type  ("buying" | "selling") — optional filter matching the chip tabs
    """
    def get(self, request):
        from django.db.models import Q
        user = request.user

        qs = Conversation.objects.filter(
            Q(buyer=user) | Q(seller=user)
        ).select_related('buyer', 'seller', 'listing').order_by('-updated_at')

        type_filter = request.query_params.get('type', '').lower()
        if type_filter == 'buying':
            qs = qs.filter(buyer=user)
        elif type_filter == 'selling':
            qs = qs.filter(seller=user)
        elif type_filter == 'favourites':
            qs = qs.filter(is_favourite=True)

        serializer = ConversationListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class StartConversationView(APIView):
    """
    POST /api/chat/start/
    Create a new conversation about a listing (buyer contacts supplier).
    Body: { listing_id, message }
    """
    def post(self, request):
        serializer = StartConversationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        from listings.models import Listing
        listing_id = serializer.validated_data['listing_id']
        text       = serializer.validated_data['message']

        try:
            listing = Listing.objects.select_related('supplier').get(pk=listing_id)
        except Listing.DoesNotExist:
            return Response({'detail': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)

        if listing.supplier_id == request.user.id:
            return Response(
                {'detail': 'You cannot start a conversation about your own listing.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # get_or_create so duplicate "contact supplier" taps don't create duplicate threads
        try:
            conversation, created = Conversation.objects.get_or_create(
                buyer=request.user,
                seller=listing.supplier,
                listing=listing,
            )
        except IntegrityError:
            # Race condition — just fetch it
            conversation = Conversation.objects.get(
                buyer=request.user,
                seller=listing.supplier,
                listing=listing,
            )
            created = False

        # Always send the opening message (skip duplicates on re-tap)
        if created or not conversation.messages.exists():
            msg = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                text=text,
            )
            conversation.last_message = text
            conversation.increment_unread_for(request.user)   # increments seller unread
            # save updated_at via increment_unread_for

        conv_data = ConversationListSerializer(
            conversation, context={'request': request}
        ).data
        return Response(
            {'conversation': conv_data, 'created': created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MessageListView(APIView):
    """
    GET /api/chat/<conv_id>/messages/
    Returns all messages in a conversation (used by ChatConversationScreen).
    Also marks messages from the other party as read.
    """
    def _get_conversation(self, request, conv_id):
        from django.db.models import Q
        try:
            return Conversation.objects.get(
                pk=conv_id
            ), None
        except Conversation.DoesNotExist:
            return None, Response({'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

    def _assert_participant(self, request, conv):
        if request.user.id not in (conv.buyer_id, conv.seller_id):
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        return None

    def get(self, request, conv_id):
        conv, err = self._get_conversation(request, conv_id)
        if err:
            return err
        err = self._assert_participant(request, conv)
        if err:
            return err

        # Mark incoming messages as read and reset unread counter
        Message.objects.filter(
            conversation=conv,
            is_read=False,
        ).exclude(sender=request.user).update(is_read=True)
        conv.reset_unread_for(request.user)

        messages = conv.messages.select_related('sender').order_by('created_at')
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SendMessageView(APIView):
    """
    POST /api/chat/<conv_id>/messages/
    Send a message in an existing conversation.
    Body: { text }
    """
    def post(self, request, conv_id):
        try:
            conv = Conversation.objects.get(pk=conv_id)
        except Conversation.DoesNotExist:
            return Response({'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.id not in (conv.buyer_id, conv.seller_id):
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        text = serializer.validated_data['text']
        msg  = Message.objects.create(
            conversation=conv,
            sender=request.user,
            text=text,
        )

        # Update conversation metadata
        conv.last_message = text
        conv.increment_unread_for(request.user)   # increments the OTHER party's counter

        return Response(
            MessageSerializer(msg, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
