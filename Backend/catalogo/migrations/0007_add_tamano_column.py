# Generated by Django 5.1.7 on 2025-06-12 23:42

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo', '0006_fix_table_name'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='appkioskomenuproductos',
            options={'managed': True, 'verbose_name': 'Producto del Menú', 'verbose_name_plural': 'Productos del Menú'},
        ),
    ]
