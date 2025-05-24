# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
# from django.db import models
# from django.contrib.auth.models import User 


# class AppkioskoCategorias(models.Model):
#     nombre = models.CharField(max_length=50)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_categorias'


# class AppkioskoClientes(models.Model):
#     cedula = models.CharField(unique=True, max_length=10)
#     nombres = models.CharField(max_length=100)
#     apellidos = models.CharField(max_length=100)
#     email = models.CharField(unique=True, max_length=100, blank=True, null=True)
#     telefono = models.CharField(max_length=10, blank=True, null=True)
#     sexo = models.CharField(max_length=50, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)
#     user = models.OneToOneField(User, models.DO_NOTHING, blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_clientes'


# class AppkioskoCupon(models.Model):
#     codigo = models.CharField(unique=True, max_length=50)
#     descuento = models.DecimalField(max_digits=5, decimal_places=2)
#     fecha_creacioncupon = models.DateTimeField(db_column='fecha_creacionCupon', blank=True, null=True)  # Field name made lowercase.
#     fecha_fincupon = models.DateTimeField(db_column='fecha_finCupon', blank=True, null=True)  # Field name made lowercase.
#     estado = models.ForeignKey('AppkioskoEstados', models.DO_NOTHING, blank=True, null=True)
#     cliente = models.ForeignKey(AppkioskoClientes, models.DO_NOTHING, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_cupon'


# class AppkioskoDetallefacturaproducto(models.Model):
#     factura = models.OneToOneField('AppkioskoFacturas', models.DO_NOTHING, primary_key=True)  # The composite primary key (factura_id, producto_id) found, that is not supported. The first column is selected.
#     producto = models.ForeignKey('AppkioskoProductos', models.DO_NOTHING)
#     cantidad = models.IntegerField()
#     precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
#     iva = models.DecimalField(db_column='IVA', max_digits=5, decimal_places=2)  # Field name made lowercase.
#     descuento = models.DecimalField(db_column='DESCUENTO', max_digits=5, decimal_places=2, blank=True, null=True)  # Field name made lowercase.
#     total = models.DecimalField(max_digits=10, decimal_places=2)
#     subtotal = models.DecimalField(max_digits=10, decimal_places=2)
#     fecha_emisionfactura = models.DateTimeField(db_column='fecha_emisionFactura')  # Field name made lowercase.
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_detallefacturaproducto'
#         unique_together = (('factura', 'producto'),)


# class AppkioskoEmpleados(models.Model):
#     cedula = models.CharField(unique=True, max_length=10)
#     nombres = models.CharField(max_length=100)
#     apellidos = models.CharField(max_length=100)
#     telefono = models.CharField(max_length=10, blank=True, null=True)
#     sexo = models.CharField(max_length=50, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)
#     user = models.OneToOneField(User, models.DO_NOTHING, blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_empleados'


# class AppkioskoEstablecimientos(models.Model):
#     nombre = models.CharField(max_length=50)
#     direccion = models.CharField(max_length=200)
#     telefono = models.CharField(max_length=15, blank=True, null=True)
#     tipo_establecimiento = models.CharField(max_length=50, blank=True, null=True)
#     correo = models.CharField(max_length=100, blank=True, null=True)
#     image_url = models.CharField(db_column='image_URL', max_length=500, blank=True, null=True)  # Field name made lowercase.
#     estado = models.ForeignKey('AppkioskoEstados', models.DO_NOTHING, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_establecimientos'


# class AppkioskoEstablecimientosusuarios(models.Model):
#     establecimiento = models.OneToOneField(AppkioskoEstablecimientos, models.DO_NOTHING, primary_key=True)  # The composite primary key (establecimiento_id, empleado_id) found, that is not supported. The first column is selected.
#     empleado = models.ForeignKey(AppkioskoEmpleados, models.DO_NOTHING)
#     fecha_iniciotrabajo = models.DateTimeField(db_column='fecha_inicioTrabajo')  # Field name made lowercase.
#     fecha_fintrabajo = models.DateTimeField(db_column='fecha_finTrabajo', blank=True, null=True)  # Field name made lowercase.
#     estado = models.ForeignKey('AppkioskoEstados', models.DO_NOTHING, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_establecimientosusuarios'
#         unique_together = (('establecimiento', 'empleado'),)


# class AppkioskoEstados(models.Model):
#     is_active = models.IntegerField()
#     is_eliminated = models.IntegerField()
#     is_inactive = models.IntegerField()
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_estados'


# class AppkioskoFacturas(models.Model):
#     nombre_cliente = models.CharField(max_length=100)
#     email_cliente = models.CharField(max_length=100, blank=True, null=True)
#     cedula_cliente = models.CharField(max_length=10, blank=True, null=True)
#     telefono_cliente = models.CharField(max_length=10, blank=True, null=True)
#     pedido = models.OneToOneField('AppkioskoPedidos', models.DO_NOTHING, blank=True, null=True)
#     cliente = models.ForeignKey(AppkioskoClientes, models.DO_NOTHING, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_facturas'


# class AppkioskoImagen(models.Model):
#     nombre = models.CharField(max_length=100)
#     ruta = models.CharField(max_length=500)
#     categoria_imagen = models.CharField(max_length=100, blank=True, null=True)
#     codigo_referencial_imagen = models.IntegerField(blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_imagen'


# class AppkioskoKioskostouch(models.Model):
#     nombre = models.CharField(max_length=50)
#     estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
#     token = models.CharField(max_length=255, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)
#     establecimiento = models.ForeignKey(AppkioskoEstablecimientos, models.DO_NOTHING, db_column='establecimiento_ID', blank=True, null=True)  # Field name made lowercase.
#     pantallascocina = models.ForeignKey('AppkioskoPantallascocina', models.DO_NOTHING, db_column='pantallasCocina_ID', blank=True, null=True)  # Field name made lowercase.

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_kioskostouch'


# class AppkioskoMenuproductos(models.Model):
#     producto = models.OneToOneField('AppkioskoProductos', models.DO_NOTHING, primary_key=True)  # The composite primary key (producto_id, menu_id) found, that is not supported. The first column is selected.
#     menu = models.ForeignKey('AppkioskoMenus', models.DO_NOTHING)
#     cantidad = models.IntegerField()
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_menuproductos'
#         unique_together = (('producto', 'menu'),)


# class AppkioskoMenus(models.Model):
#     nombre = models.CharField(max_length=50)
#     descripcion = models.TextField(blank=True, null=True)
#     precio = models.DecimalField(max_digits=10, decimal_places=2)
#     tipo_menu = models.CharField(max_length=50, blank=True, null=True)
#     estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_menus'


# class AppkioskoPantallascocina(models.Model):
#     nombre = models.CharField(max_length=50)
#     estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
#     token = models.CharField(max_length=255, blank=True, null=True)
#     establecimiento = models.ForeignKey(AppkioskoEstablecimientos, models.DO_NOTHING, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_pantallascocina'


# class AppkioskoPedidos(models.Model):
#     invoice_number = models.CharField(max_length=50)
#     tipo_entrega = models.CharField(max_length=50, blank=True, null=True)
#     total = models.DecimalField(max_digits=10, decimal_places=2)
#     numero_mesa = models.IntegerField(blank=True, null=True)
#     cliente = models.ForeignKey(AppkioskoClientes, models.DO_NOTHING, blank=True, null=True)
#     valor_descuento = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
#     cupon = models.ForeignKey(AppkioskoCupon, models.DO_NOTHING, blank=True, null=True)
#     tipopago = models.ForeignKey('AppkioskoTipopago', models.DO_NOTHING, db_column='tipoPago_id', blank=True, null=True)  # Field name made lowercase.
#     fecha_pago = models.DateTimeField(blank=True, null=True)
#     is_facturado = models.IntegerField(blank=True, null=True)
#     estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_pedidos'


# class AppkioskoPedidosessions(models.Model):
#     kioskotouch = models.ForeignKey(AppkioskoKioskostouch, models.DO_NOTHING, db_column='kioskoTouch_id')  # Field name made lowercase.
#     pedido = models.ForeignKey(AppkioskoPedidos, models.DO_NOTHING)
#     promocion = models.ForeignKey('AppkioskoPromociones', models.DO_NOTHING, blank=True, null=True)
#     fecha_iniciopedido = models.DateTimeField(db_column='fecha_inicioPedido')  # Field name made lowercase.
#     fecha_finpedido = models.DateTimeField(db_column='fecha_finPedido', blank=True, null=True)  # Field name made lowercase.
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_pedidosessions'


# class AppkioskoPedidosproductos(models.Model):
#     pedido = models.OneToOneField(AppkioskoPedidos, models.DO_NOTHING, primary_key=True)  # The composite primary key (pedido_id, producto_id) found, that is not supported. The first column is selected.
#     producto = models.ForeignKey('AppkioskoProductos', models.DO_NOTHING)
#     cantidad = models.DecimalField(max_digits=5, decimal_places=2)
#     precio_unitario = models.DecimalField(max_digits=5, decimal_places=2)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_pedidosproductos'
#         unique_together = (('pedido', 'producto'),)


# class AppkioskoProductos(models.Model):
#     nombre = models.CharField(max_length=50)
#     descripcion = models.TextField(blank=True, null=True)
#     precio = models.DecimalField(max_digits=10, decimal_places=2)
#     categoria = models.ForeignKey(AppkioskoCategorias, models.DO_NOTHING, blank=True, null=True)
#     estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
#     promocion = models.ForeignKey('AppkioskoPromociones', models.DO_NOTHING, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_productos'


# class AppkioskoPromocioncategoria(models.Model):
#     categoria = models.OneToOneField(AppkioskoCategorias, models.DO_NOTHING, primary_key=True)  # The composite primary key (categoria_id, promocion_id) found, that is not supported. The first column is selected.
#     promocion = models.ForeignKey('AppkioskoPromociones', models.DO_NOTHING)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_promocioncategoria'
#         unique_together = (('categoria', 'promocion'),)


# class AppkioskoPromociones(models.Model):
#     nombre = models.CharField(max_length=100)
#     descripcion = models.CharField(max_length=100, blank=True, null=True)
#     valor_descuento = models.IntegerField()
#     fecha_iniciopromo = models.DateTimeField(db_column='fecha_inicioPromo')  # Field name made lowercase.
#     fecha_finpromo = models.DateTimeField(db_column='fecha_finPromo', blank=True, null=True)  # Field name made lowercase.
#     tipo_promocion = models.CharField(max_length=50, blank=True, null=True)
#     codigo_promocional = models.CharField(max_length=50, blank=True, null=True)
#     limite_uso_usuario = models.IntegerField(blank=True, null=True)
#     aplicable_a = models.CharField(max_length=100, blank=True, null=True)
#     estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
#     limite_uso_total = models.IntegerField(blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_promociones'


# class AppkioskoPromocionmenu(models.Model):
#     menu = models.OneToOneField(AppkioskoMenus, models.DO_NOTHING, primary_key=True)  # The composite primary key (menu_id, promocion_id) found, that is not supported. The first column is selected.
#     promocion = models.ForeignKey(AppkioskoPromociones, models.DO_NOTHING)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_promocionmenu'
#         unique_together = (('menu', 'promocion'),)


# class AppkioskoPromocionproductos(models.Model):
#     producto = models.OneToOneField(AppkioskoProductos, models.DO_NOTHING, primary_key=True)  # The composite primary key (producto_id, promocion_id) found, that is not supported. The first column is selected.
#     promocion = models.ForeignKey(AppkioskoPromociones, models.DO_NOTHING)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_promocionproductos'
#         unique_together = (('producto', 'promocion'),)


# class AppkioskoPublicidades(models.Model):
#     nombre = models.CharField(max_length=100)
#     descripcion = models.TextField(blank=True, null=True)
#     tipo_publicidad = models.CharField(max_length=100, blank=True, null=True)
#     imagen_or_video_url = models.CharField(db_column='imagen_or_video_URL', max_length=500, blank=True, null=True)  # Field name made lowercase.
#     fecha_iniciopublicidad = models.DateTimeField(db_column='fecha_inicioPublicidad', blank=True, null=True)  # Field name made lowercase.
#     fecha_finpublicidad = models.DateTimeField(db_column='fecha_finPublicidad', blank=True, null=True)  # Field name made lowercase.
#     estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
#     promocion = models.ForeignKey(AppkioskoPromociones, models.DO_NOTHING, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_publicidades'


# class AppkioskoPublicidadestablecimiento(models.Model):
#     establecimiento = models.OneToOneField(AppkioskoEstablecimientos, models.DO_NOTHING, primary_key=True)  # The composite primary key (establecimiento_id, publicidad_id) found, that is not supported. The first column is selected.
#     publicidad = models.ForeignKey(AppkioskoPublicidades, models.DO_NOTHING)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_publicidadestablecimiento'
#         unique_together = (('establecimiento', 'publicidad'),)


# class AppkioskoPublicidadkioskotouch(models.Model):
#     kioskotouch = models.OneToOneField(AppkioskoKioskostouch, models.DO_NOTHING, db_column='kioskoTouch_id', primary_key=True)  # Field name made lowercase. The composite primary key (kioskoTouch_id, publicidad_id) found, that is not supported. The first column is selected.
#     publicidad = models.ForeignKey(AppkioskoPublicidades, models.DO_NOTHING)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_publicidadkioskotouch'
#         unique_together = (('kioskotouch', 'publicidad'),)


# class AppkioskoTipopago(models.Model):
#     nombre = models.CharField(max_length=100)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_tipopago'


# class AppkioskoVideo(models.Model):
#     nombre = models.CharField(max_length=100)
#     ruta = models.CharField(max_length=500)
#     duracion = models.IntegerField()
#     publicidad = models.ForeignKey(AppkioskoPublicidades, models.DO_NOTHING, blank=True, null=True)
#     created_at = models.DateTimeField(blank=True, null=True)
#     updated_at = models.DateTimeField(blank=True, null=True)

#     class Meta:
#         managed = False
#         db_table = 'appkiosko_video'


