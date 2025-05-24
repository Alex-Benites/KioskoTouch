from django.db import models
# from apps.comun.models import AppkioskoEstados
# from apps.usuarios.models import AppkioskoClientes
# from apps.marketing.models import AppkioskoCupon, AppkioskoPromociones
# from apps.catalogo.models import AppkioskoProductos
# from apps.establecimientos.models import AppkioskoKioskostouch

class AppkioskoTipopago(models.Model):
    nombre = models.CharField(max_length=100)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_tipopago'
        verbose_name = 'Tipo de Pago'
        verbose_name_plural = 'Tipos de Pago'

    def __str__(self):
        return self.nombre

class AppkioskoPedidos(models.Model):
    invoice_number = models.CharField(max_length=50) # Considerar unique=True
    tipo_entrega = models.CharField(max_length=50, blank=True, null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    numero_mesa = models.IntegerField(blank=True, null=True)
    cliente = models.ForeignKey('usuarios.AppkioskoClientes', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    valor_descuento = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    cupon = models.ForeignKey('marketing.AppkioskoCupon', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    tipopago = models.ForeignKey(AppkioskoTipopago, on_delete=models.PROTECT, db_column='tipoPago_id', blank=True, null=True) # Ajustar on_delete
    fecha_pago = models.DateTimeField(blank=True, null=True)
    is_facturado = models.IntegerField(blank=True, null=True) # Considerar BooleanField
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    productos = models.ManyToManyField(
        'catalogo.AppkioskoProductos',
        through='AppkioskoPedidosproductos',
        related_name='pedidos_asociados' # Nombre de relación único
    )

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_pedidos'
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'

    def __str__(self):
        return f"Pedido {self.invoice_number}"

class AppkioskoFacturas(models.Model):
    nombre_cliente = models.CharField(max_length=100)
    email_cliente = models.CharField(max_length=100, blank=True, null=True) # Considerar EmailField
    cedula_cliente = models.CharField(max_length=10, blank=True, null=True)
    telefono_cliente = models.CharField(max_length=10, blank=True, null=True)
    pedido = models.OneToOneField(AppkioskoPedidos, on_delete=models.PROTECT, blank=True, null=True) # Ajustar on_delete
    cliente = models.ForeignKey('usuarios.AppkioskoClientes', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    # Considerar añadir campos como numero_factura_sri, fecha_autorizacion, etc.

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_facturas'
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'

    def __str__(self):
        return f"Factura para {self.nombre_cliente} (Pedido: {self.pedido_id})"

class AppkioskoDetallefacturaproducto(models.Model):
    # factura = models.OneToOneField(AppkioskoFacturas, models.DO_NOTHING, primary_key=True) # ANTERIOR
    # producto = models.ForeignKey('catalogo.AppkioskoProductos', models.DO_NOTHING) # ANTERIOR
    factura = models.ForeignKey(AppkioskoFacturas, on_delete=models.CASCADE) # CORREGIDO
    producto = models.ForeignKey('catalogo.AppkioskoProductos', on_delete=models.PROTECT) # CORREGIDO, proteger producto
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    iva = models.DecimalField(db_column='IVA', max_digits=5, decimal_places=2)
    descuento = models.DecimalField(db_column='DESCUENTO', max_digits=5, decimal_places=2, blank=True, null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_emisionfactura = models.DateTimeField(db_column='fecha_emisionFactura') # Considerar si es redundante (ya está en Factura)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_detallefacturaproducto'
        unique_together = (('factura', 'producto'),)
        verbose_name = 'Detalle de Factura'
        verbose_name_plural = 'Detalles de Factura'

class AppkioskoPedidosessions(models.Model):
    kioskotouch = models.ForeignKey('establecimientos.AppkioskoKioskostouch', on_delete=models.CASCADE, db_column='kioskoTouch_id') # Ajustar on_delete
    pedido = models.ForeignKey(AppkioskoPedidos, on_delete=models.CASCADE) # Ajustar on_delete
    promocion = models.ForeignKey('marketing.AppkioskoPromociones', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    fecha_iniciopedido = models.DateTimeField(db_column='fecha_inicioPedido')
    fecha_finpedido = models.DateTimeField(db_column='fecha_finPedido', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_pedidosessions'
        verbose_name = 'Sesión de Pedido'
        verbose_name_plural = 'Sesiones de Pedido'

class AppkioskoPedidosproductos(models.Model):
    # pedido = models.OneToOneField(AppkioskoPedidos, models.DO_NOTHING, primary_key=True) # ANTERIOR
    # producto = models.ForeignKey('catalogo.AppkioskoProductos', models.DO_NOTHING) # ANTERIOR
    pedido = models.ForeignKey(AppkioskoPedidos, on_delete=models.CASCADE) # CORREGIDO
    producto = models.ForeignKey('catalogo.AppkioskoProductos', on_delete=models.PROTECT) # CORREGIDO, proteger producto
    cantidad = models.DecimalField(max_digits=5, decimal_places=2) # O IntegerField
    precio_unitario = models.DecimalField(max_digits=5, decimal_places=2) # Considerar max_digits=10
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_pedidosproductos'
        unique_together = (('pedido', 'producto'),)
        verbose_name = 'Producto de Pedido'
        verbose_name_plural = 'Productos de Pedido'