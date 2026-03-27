from django.db import models
from django.contrib.auth.models import User


class Conversation(models.Model):
    """
    A thread between a buyer and a seller about a specific listing.
    Maps to ChatListScreen — each row is one "chat item" in the list.
    """
    buyer  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='buying_conversations')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='selling_conversations')
    # Nullable so a general inquiry can exist without a listing
    listing = models.ForeignKey(
        'listings.Listing',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='conversations',
    )
    # Convenience: last message text, stored denormalized to avoid N+1 on list view
    last_message    = models.TextField(blank=True, default='')
    is_favourite    = models.BooleanField(default=False)
    buyer_unread    = models.PositiveIntegerField(default=0)
    seller_unread   = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        # One conversation per (buyer, seller, listing) combination
        unique_together = ('buyer', 'seller', 'listing')

    def __str__(self):
        listing_name = self.listing.product_name if self.listing else 'General'
        return f"{self.buyer.email} ↔ {self.seller.email} [{listing_name}]"

    def unread_for(self, user):
        if user.id == self.buyer_id:
            return self.buyer_unread
        if user.id == self.seller_id:
            return self.seller_unread
        return 0

    def reset_unread_for(self, user):
        if user.id == self.buyer_id:
            self.buyer_unread = 0
        elif user.id == self.seller_id:
            self.seller_unread = 0
        self.save(update_fields=['buyer_unread', 'seller_unread'])

    def increment_unread_for(self, user):
        """Increment unread count for the OTHER participant."""
        if user.id == self.buyer_id:
            self.seller_unread += 1
        else:
            self.buyer_unread += 1
        self.save(update_fields=['buyer_unread', 'seller_unread', 'updated_at'])


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )
    sender  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    text    = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.conversation_id}] {self.sender.email}: {self.text[:40]}"
