# Generated by Django 5.1.7 on 2025-05-30 06:10

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('catalogo', '0001_initial'),
        ('comun', '0001_initial'),
        ('establecimientos', '0001_initial'),
        ('marketing', '0001_initial'),
        ('usuarios', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AppkioskoCupon',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo', models.CharField(max_length=50, unique=True)),
                ('descuento', models.DecimalField(decimal_places=2, max_digits=5)),
                ('fecha_creacion_cupon', models.DateTimeField(blank=True, null=True)),
                ('fecha_fin_cupon', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
                ('cliente', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='usuarios.appkioskoclientes')),
                ('estado', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='comun.appkioskoestados')),
            ],
            options={
                'verbose_name': 'Cupón',
                'verbose_name_plural': 'Cupones',
                'db_table': 'appkiosko_cupon',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='AppkioskoPedidos',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('invoice_number', models.CharField(max_length=50)),
                ('tipo_entrega', models.CharField(blank=True, max_length=50, null=True)),
                ('total', models.DecimalField(decimal_places=2, max_digits=10)),
                ('numero_mesa', models.IntegerField(blank=True, null=True)),
                ('valor_descuento', models.DecimalField(decimal_places=2, default=0.0, max_digits=5)),
                ('fecha_pago', models.DateTimeField(blank=True, null=True)),
                ('is_facturado', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
                ('cliente', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='usuarios.appkioskoclientes')),
                ('cupon', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='ventas.appkioskocupon')),
                ('estado', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='comun.appkioskoestados')),
                ('tipo_pago', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='comun.appkioskotipopago')),
            ],
            options={
                'verbose_name': 'Pedido',
                'verbose_name_plural': 'Pedidos',
                'db_table': 'appkiosko_pedidos',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='AppkioskoFacturas',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre_cliente', models.CharField(max_length=100)),
                ('email_cliente', models.CharField(blank=True, max_length=100, null=True)),
                ('cedula_cliente', models.CharField(blank=True, max_length=10, null=True)),
                ('telefono_cliente', models.CharField(blank=True, max_length=10, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
                ('cliente', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='usuarios.appkioskoclientes')),
                ('pedido', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='ventas.appkioskopedidos')),
            ],
            options={
                'verbose_name': 'Factura',
                'verbose_name_plural': 'Facturas',
                'db_table': 'appkiosko_facturas',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='AppkioskoDetallepedido',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cantidad', models.IntegerField()),
                ('precio_unitario', models.DecimalField(decimal_places=2, max_digits=10)),
                ('subtotal', models.DecimalField(decimal_places=2, max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
                ('menu', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='catalogo.appkioskomenus')),
                ('producto', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='catalogo.appkioskoproductos')),
                ('pedido', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='ventas.appkioskopedidos')),
            ],
            options={
                'verbose_name': 'Detalle de Pedido',
                'verbose_name_plural': 'Detalles de Pedido',
                'db_table': 'appkiosko_detallepedido',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='AppkioskoPedidosessions',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha_inicio_pedido', models.DateTimeField()),
                ('fecha_fin_pedido', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
                ('kiosko_touch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='establecimientos.appkioskokioskostouch')),
                ('pedido', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='ventas.appkioskopedidos')),
                ('promocion', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='marketing.appkioskopromociones')),
            ],
            options={
                'verbose_name': 'Sesión de Pedido',
                'verbose_name_plural': 'Sesiones de Pedido',
                'db_table': 'appkiosko_pedidosessions',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='AppkioskoDetallefacturaproducto',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cantidad', models.IntegerField()),
                ('precio_unitario', models.DecimalField(decimal_places=2, max_digits=10)),
                ('iva', models.DecimalField(decimal_places=2, default=0.0, max_digits=5)),
                ('descuento', models.DecimalField(decimal_places=2, default=0.0, max_digits=5)),
                ('subtotal', models.DecimalField(decimal_places=2, max_digits=10)),
                ('total', models.DecimalField(decimal_places=2, max_digits=10)),
                ('fecha_emision_factura', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
                ('producto', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='catalogo.appkioskoproductos')),
                ('factura', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='ventas.appkioskofacturas')),
            ],
            options={
                'verbose_name': 'Detalle Factura Producto',
                'verbose_name_plural': 'Detalles Factura Producto',
                'db_table': 'appkiosko_detallefacturaproducto',
                'managed': True,
                'unique_together': {('factura', 'producto')},
            },
        ),
        migrations.CreateModel(
            name='AppkioskoPedidoProductoIngredientes',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('accion', models.CharField(max_length=20)),
                ('precio_aplicado', models.DecimalField(decimal_places=2, default=0.0, max_digits=5)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('ingrediente', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='catalogo.appkioskoingredientes')),
                ('producto', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='catalogo.appkioskoproductos')),
                ('pedido', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='ventas.appkioskopedidos')),
            ],
            options={
                'verbose_name': 'Personalización de Pedido',
                'verbose_name_plural': 'Personalizaciones de Pedido',
                'db_table': 'appkiosko_pedido_producto_ingredientes',
                'managed': True,
                'unique_together': {('pedido', 'producto', 'ingrediente', 'accion')},
            },
        ),
    ]
