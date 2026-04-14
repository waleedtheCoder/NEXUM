from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('listings', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Conversation',
            fields=[
                ('id',             models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_message',   models.TextField(blank=True, default='')),
                ('is_favourite',   models.BooleanField(default=False)),
                ('buyer_unread',   models.PositiveIntegerField(default=0)),
                ('seller_unread',  models.PositiveIntegerField(default=0)),
                ('created_at',     models.DateTimeField(auto_now_add=True)),
                ('updated_at',     models.DateTimeField(auto_now=True)),
                ('buyer', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='buying_conversations',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('seller', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='selling_conversations',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('listing', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='conversations',
                    to='listings.listing',
                )),
            ],
            options={'ordering': ['-updated_at']},
        ),
        migrations.AlterUniqueTogether(
            name='conversation',
            unique_together={('buyer', 'seller', 'listing')},
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text',       models.TextField()),
                ('is_read',    models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('conversation', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='messages',
                    to='chat.conversation',
                )),
                ('sender', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='sent_messages',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['created_at']},
        ),
    ]
