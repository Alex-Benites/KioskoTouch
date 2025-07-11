# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models

 
class AppkioskoCategorias(models.Model):
    nombre = models.CharField(max_length=50)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_categorias'


class AppkioskoClientes(models.Model):
    cedula = models.CharField(unique=True, max_length=10)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    email = models.CharField(unique=True, max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=10, blank=True, null=True)
    sexo = models.CharField(max_length=50, blank=True, null=True)
    user = models.OneToOneField('AuthUser', models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_clientes'


class AppkioskoCupon(models.Model):
    codigo = models.CharField(unique=True, max_length=50)
    descuento = models.DecimalField(max_digits=5, decimal_places=2)
    fecha_creacion_cupon = models.DateTimeField(blank=True, null=True)
    fecha_fin_cupon = models.DateTimeField(blank=True, null=True)
    estado = models.ForeignKey('AppkioskoEstados', models.DO_NOTHING, blank=True, null=True)
    cliente = models.ForeignKey(AppkioskoClientes, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_cupon'


class AppkioskoDetallefacturaproducto(models.Model):
    factura = models.ForeignKey('AppkioskoFacturas', models.DO_NOTHING, blank=True, null=True)
    producto = models.ForeignKey('AppkioskoProductos', models.DO_NOTHING, blank=True, null=True)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    iva = models.DecimalField(max_digits=5, decimal_places=2)
    descuento = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_emision_factura = models.DateTimeField()
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_detallefacturaproducto'
        unique_together = (('factura', 'producto'),)


class AppkioskoDetallepedido(models.Model):
    pedido = models.ForeignKey('AppkioskoPedidos', models.DO_NOTHING, blank=True, null=True)
    producto = models.ForeignKey('AppkioskoProductos', models.DO_NOTHING, blank=True, null=True)
    menu = models.ForeignKey('AppkioskoMenus', models.DO_NOTHING, blank=True, null=True)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_detallepedido'


class AppkioskoEmpleados(models.Model):
    cedula = models.CharField(unique=True, max_length=10)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    telefono = models.CharField(max_length=10, blank=True, null=True)
    sexo = models.CharField(max_length=50, blank=True, null=True)
    turno_trabajo = models.CharField(max_length=20, blank=True, null=True)
    user = models.OneToOneField('AuthUser', models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_empleados'


class AppkioskoEstablecimientos(models.Model):
    nombre = models.CharField(max_length=50)
    direccion = models.CharField(max_length=200)
    telefono = models.CharField(max_length=15, blank=True, null=True)
    tipo_establecimiento = models.CharField(max_length=50, blank=True, null=True)
    correo = models.CharField(max_length=100, blank=True, null=True)
    estado = models.ForeignKey('AppkioskoEstados', models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_establecimientos'


class AppkioskoEstablecimientosusuarios(models.Model):
    establecimiento = models.ForeignKey(AppkioskoEstablecimientos, models.DO_NOTHING, blank=True, null=True)
    empleado = models.ForeignKey(AppkioskoEmpleados, models.DO_NOTHING, blank=True, null=True)
    fecha_inicio_trabajo = models.DateTimeField()
    fecha_fin_trabajo = models.DateTimeField(blank=True, null=True)
    estado = models.ForeignKey('AppkioskoEstados', models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_establecimientosusuarios'
        unique_together = (('establecimiento', 'empleado', 'fecha_inicio_trabajo'),)


class AppkioskoEstados(models.Model):
    nombre = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.IntegerField()
    is_eliminated = models.IntegerField()
    is_inactive = models.IntegerField()
    is_order_preparing = models.IntegerField()
    is_order_finished = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_estados'


class AppkioskoFacturas(models.Model):
    nombre_cliente = models.CharField(max_length=100)
    email_cliente = models.CharField(max_length=100, blank=True, null=True)
    cedula_cliente = models.CharField(max_length=10, blank=True, null=True)
    telefono_cliente = models.CharField(max_length=10, blank=True, null=True)
    pedido = models.OneToOneField('AppkioskoPedidos', models.DO_NOTHING, blank=True, null=True)
    cliente = models.ForeignKey(AppkioskoClientes, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_facturas'


class AppkioskoImagen(models.Model):
    ruta = models.CharField(max_length=500)
    categoria_imagen = models.CharField(max_length=100, blank=True, null=True)
    entidad_relacionada_id = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_imagen'


class AppkioskoIngredientes(models.Model):
    nombre = models.CharField(max_length=100)
    precio_adicional = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_ingredientes'


class AppkioskoKioskostouch(models.Model):
    nombre = models.CharField(max_length=50)
    estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
    token = models.CharField(max_length=255, blank=True, null=True)
    establecimiento = models.ForeignKey(AppkioskoEstablecimientos, models.DO_NOTHING, blank=True, null=True)
    pantallas_cocina = models.ForeignKey('AppkioskoPantallascocina', models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_kioskostouch'


class AppkioskoMenuproductos(models.Model):
    producto = models.ForeignKey('AppkioskoProductos', models.DO_NOTHING, blank=True, null=True)
    menu = models.ForeignKey('AppkioskoMenus', models.DO_NOTHING, blank=True, null=True)
    cantidad = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_menuproductos'
        unique_together = (('producto', 'menu'),)


class AppkioskoMenus(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    tipo_menu = models.CharField(max_length=50, blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_menus'


class AppkioskoPantallascocina(models.Model):
    nombre = models.CharField(max_length=50)
    estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
    token = models.CharField(max_length=255, blank=True, null=True)
    establecimiento = models.ForeignKey(AppkioskoEstablecimientos, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_pantallascocina'


class AppkioskoPedidoProductoIngredientes(models.Model):
    pedido = models.ForeignKey('AppkioskoPedidos', models.DO_NOTHING, blank=True, null=True)
    producto = models.ForeignKey('AppkioskoProductos', models.DO_NOTHING, blank=True, null=True)
    ingrediente = models.ForeignKey(AppkioskoIngredientes, models.DO_NOTHING, blank=True, null=True)
    accion = models.CharField(max_length=20)
    precio_aplicado = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_pedido_producto_ingredientes'
        unique_together = (('pedido', 'producto', 'ingrediente', 'accion'),)


class AppkioskoPedidos(models.Model):
    invoice_number = models.CharField(max_length=50)
    tipo_entrega = models.CharField(max_length=50, blank=True, null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    numero_mesa = models.IntegerField(blank=True, null=True)
    cliente = models.ForeignKey(AppkioskoClientes, models.DO_NOTHING, blank=True, null=True)
    valor_descuento = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    cupon = models.ForeignKey(AppkioskoCupon, models.DO_NOTHING, blank=True, null=True)
    tipo_pago = models.ForeignKey('AppkioskoTipopago', models.DO_NOTHING, blank=True, null=True)
    fecha_pago = models.DateTimeField(blank=True, null=True)
    is_facturado = models.IntegerField(blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_pedidos'


class AppkioskoPedidosessions(models.Model):
    kiosko_touch = models.ForeignKey(AppkioskoKioskostouch, models.DO_NOTHING)
    pedido = models.ForeignKey(AppkioskoPedidos, models.DO_NOTHING, blank=True, null=True)
    promocion = models.ForeignKey('AppkioskoPromociones', models.DO_NOTHING, blank=True, null=True)
    fecha_inicio_pedido = models.DateTimeField()
    fecha_fin_pedido = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_pedidosessions'


class AppkioskoProductos(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.ForeignKey(AppkioskoCategorias, models.DO_NOTHING, blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_productos'


class AppkioskoProductosIngredientes(models.Model):
    producto = models.ForeignKey(AppkioskoProductos, models.DO_NOTHING, blank=True, null=True)
    ingrediente = models.ForeignKey(AppkioskoIngredientes, models.DO_NOTHING, blank=True, null=True)
    es_base = models.IntegerField(blank=True, null=True)
    permite_extra = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_productos_ingredientes'
        unique_together = (('producto', 'ingrediente'),)


class AppkioskoPromociones(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=100, blank=True, null=True)
    valor_descuento = models.IntegerField()
    fecha_inicio_promo = models.DateTimeField()
    fecha_fin_promo = models.DateTimeField(blank=True, null=True)
    tipo_promocion = models.CharField(max_length=50, blank=True, null=True)
    codigo_promocional = models.CharField(max_length=50, blank=True, null=True)
    limite_uso_usuario = models.IntegerField(blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
    limite_uso_total = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_promociones'


class AppkioskoPromocionmenu(models.Model):
    menu = models.ForeignKey(AppkioskoMenus, models.DO_NOTHING, blank=True, null=True)
    promocion = models.ForeignKey(AppkioskoPromociones, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_promocionmenu'
        unique_together = (('menu', 'promocion'),)


class AppkioskoPromocionproductos(models.Model):
    producto = models.ForeignKey(AppkioskoProductos, models.DO_NOTHING, blank=True, null=True)
    promocion = models.ForeignKey(AppkioskoPromociones, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_promocionproductos'
        unique_together = (('producto', 'promocion'),)


class AppkioskoPublicidades(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    tipo_publicidad = models.CharField(max_length=100, blank=True, null=True)
    fecha_inicio_publicidad = models.DateTimeField(blank=True, null=True)
    fecha_fin_publicidad = models.DateTimeField(blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, models.DO_NOTHING, blank=True, null=True)
    promocion = models.ForeignKey(AppkioskoPromociones, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_publicidades'


class AppkioskoPublicidadestablecimiento(models.Model):
    establecimiento = models.ForeignKey(AppkioskoEstablecimientos, models.DO_NOTHING, blank=True, null=True)
    publicidad = models.ForeignKey(AppkioskoPublicidades, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_publicidadestablecimiento'
        unique_together = (('establecimiento', 'publicidad'),)


class AppkioskoPublicidadkioskotouch(models.Model):
    kiosko_touch = models.ForeignKey(AppkioskoKioskostouch, models.DO_NOTHING, blank=True, null=True)
    publicidad = models.ForeignKey(AppkioskoPublicidades, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_publicidadkioskotouch'
        unique_together = (('kiosko_touch', 'publicidad'),)


class AppkioskoTipopago(models.Model):
    nombre = models.CharField(max_length=100)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_tipopago'


class AppkioskoVideo(models.Model):
    nombre = models.CharField(max_length=100)
    ruta = models.CharField(max_length=500)
    duracion = models.IntegerField()
    publicidad = models.ForeignKey(AppkioskoPublicidades, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_video'


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=80)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=50)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField()
    is_superuser = models.IntegerField()
    username = models.CharField(unique=True, max_length=30)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.CharField(max_length=75)
    is_staff = models.IntegerField()
    is_active = models.IntegerField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.PositiveSmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'
