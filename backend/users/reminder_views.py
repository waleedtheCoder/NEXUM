from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import RestockReminder


class RemindersView(APIView):
    """
    GET  /api/users/reminders/  — list all reminders for the authenticated user
    POST /api/users/reminders/  — create a new reminder
    Body: { product, quantity, unit, active? }
    """
    def get(self, request):
        reminders = RestockReminder.objects.filter(user=request.user)
        return Response([_serialize(r) for r in reminders])

    def post(self, request):
        product  = str(request.data.get('product', '')).strip()
        quantity = str(request.data.get('quantity', '')).strip()
        unit     = str(request.data.get('unit', 'kg')).strip()

        if not product:
            return Response({'detail': 'product is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not quantity:
            return Response({'detail': 'quantity is required.'}, status=status.HTTP_400_BAD_REQUEST)

        valid_units = {'kg', 'bags', 'boxes', 'cartons', 'pieces', 'liters', 'bottles'}
        if unit not in valid_units:
            unit = 'kg'

        reminder = RestockReminder.objects.create(
            user=request.user,
            product=product,
            quantity=quantity,
            unit=unit,
            active=bool(request.data.get('active', True)),
        )
        return Response(_serialize(reminder), status=status.HTTP_201_CREATED)


class ReminderDetailView(APIView):
    """
    PATCH  /api/users/reminders/<id>/  — toggle active / update fields
    DELETE /api/users/reminders/<id>/  — delete reminder
    """
    def _get(self, request, reminder_id):
        try:
            return RestockReminder.objects.get(pk=reminder_id, user=request.user), None
        except RestockReminder.DoesNotExist:
            return None, Response({'detail': 'Reminder not found.'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, reminder_id):
        reminder, err = self._get(request, reminder_id)
        if err:
            return err

        if 'active' in request.data:
            reminder.active = bool(request.data['active'])
        if 'product' in request.data:
            reminder.product = str(request.data['product']).strip()
        if 'quantity' in request.data:
            reminder.quantity = str(request.data['quantity']).strip()
        if 'unit' in request.data:
            reminder.unit = str(request.data['unit']).strip()

        reminder.save()
        return Response(_serialize(reminder))

    def delete(self, request, reminder_id):
        reminder, err = self._get(request, reminder_id)
        if err:
            return err
        reminder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _serialize(r):
    return {
        'id':       r.id,
        'product':  r.product,
        'quantity': r.quantity,
        'unit':     r.unit,
        'active':   r.active,
    }
