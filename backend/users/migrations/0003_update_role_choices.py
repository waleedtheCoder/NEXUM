from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_userprofile_email_verified'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[
                    ('SHOPKEEPER', 'Shopkeeper'),
                    ('SUPPLIER', 'Supplier'),
                    ('ADMIN', 'Admin'),
                ],
                default='SHOPKEEPER',
                max_length=20,
            ),
        ),
    ]
