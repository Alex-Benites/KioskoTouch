from django.db import models
from comun.models import AppkioskoEstados, AppkioskoTipopago
from usuarios.models import AppkioskoClientes
from catalogo.models import AppkioskoProductos, AppkioskoMenus, AppkioskoIngredientes
from establecimientos.models import AppkioskoKioskostouch
from marketing.models import AppkioskoPromociones

class AppkioskoCupon(models.Model):
    codigo = models.CharField(unique=True, max_length=50)
    descuento = models.DecimalField(max_digits=5, decimal_places=2)
    fecha_creacion_cupon = models.DateTimeField(blank=True, null=True)
    fecha_fin_cupon = models.DateTimeField(blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    cliente = models.ForeignKey(AppkioskoClientes, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_cupon'
        verbose_name = 'Cupón'
        verbose_name_plural = 'Cupones'

    def __str__(self):
        return self.codigo

class AppkioskoPedidos(models.Model):
    invoice_number = models.CharField(max_length=50)
    tipo_entrega = models.CharField(max_length=50, blank=True, null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    numero_mesa = models.IntegerField(blank=True, null=True)
    cliente = models.ForeignKey(AppkioskoClientes, on_delete=models.SET_NULL, blank=True, null=True)
    valor_descuento = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    cupon = models.ForeignKey(AppkioskoCupon, on_delete=models.SET_NULL, blank=True, null=True)
    tipo_pago = models.ForeignKey(AppkioskoTipopago, on_delete=models.SET_NULL, blank=True, null=True)
    fecha_pago = models.DateTimeField(blank=True, null=True)
    is_facturado = models.BooleanField(default=False)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_pedidos'
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'

    def __str__(self):
        return f"Pedido #{self.invoice_number}"

class AppkioskoDetallepedido(models.Model):
    pedido = models.ForeignKey(AppkioskoPedidos, on_delete=models.CASCADE, blank=True, null=True)
    producto = models.ForeignKey(AppkioskoProductos, on_delete=models.SET_NULL, blank=True, null=True)
    menu = models.ForeignKey(AppkioskoMenus, on_delete=models.SET_NULL, blank=True, null=True)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_detallepedido'
        verbose_name = 'Detalle de Pedido'
        verbose_name_plural = 'Detalles de Pedido'

class AppkioskoPedidosessions(models.Model):
    kiosko_touch = models.ForeignKey(AppkioskoKioskostouch, on_delete=models.CASCADE)
    pedido = models.ForeignKey(AppkioskoPedidos, on_delete=models.CASCADE, blank=True, null=True)
    promocion = models.ForeignKey(AppkioskoPromociones, on_delete=models.SET_NULL, blank=True, null=True)
    fecha_inicio_pedido = models.DateTimeField()
    fecha_fin_pedido = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_pedidosessions'
        verbose_name = 'Sesión de Pedido'
        verbose_name_plural = 'Sesiones de Pedido'

class AppkioskoFacturas(models.Model):
    nombre_cliente = models.CharField(max_length=100)
    email_cliente = models.CharField(max_length=100, blank=True, null=True)
    cedula_cliente = models.CharField(max_length=10, blank=True, null=True)
    telefono_cliente = models.CharField(max_length=10, blank=True, null=True)
    pedido = models.OneToOneField(AppkioskoPedidos, on_delete=models.SET_NULL, blank=True, null=True)
    cliente = models.ForeignKey(AppkioskoClientes, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_facturas'
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'

    def __str__(self):
        return f"Factura {self.id} - {self.nombre_cliente}"

class AppkioskoDetallefacturaproducto(models.Model):
    factura = models.ForeignKey(AppkioskoFacturas, on_delete=models.CASCADE, blank=True, null=True)
    producto = models.ForeignKey(AppkioskoProductos, on_delete=models.CASCADE, blank=True, null=True)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    iva = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    descuento = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_emision_factura = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_detallefacturaproducto'
        unique_together = (('factura', 'producto'),)
        verbose_name = 'Detalle Factura Producto'
        verbose_name_plural = 'Detalles Factura Producto'

class AppkioskoPedidoProductoIngredientes(models.Model):
    pedido = models.ForeignKey(AppkioskoPedidos, on_delete=models.CASCADE, blank=True, null=True)
    producto = models.ForeignKey(AppkioskoProductos, on_delete=models.CASCADE, blank=True, null=True)
    ingrediente = models.ForeignKey(AppkioskoIngredientes, on_delete=models.CASCADE, blank=True, null=True)
    accion = models.CharField(max_length=20)
    precio_aplicado = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    cantidad = models.IntegerField(default=1)  # ✅ AGREGAR ESTE CAMPO
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_pedido_producto_ingredientes'
        # ✅ MANTENER CONSTRAINTA ÚNICA (sin cantidad)
        unique_together = ['pedido', 'producto', 'ingrediente', 'accion']

    def __str__(self):
        return f"{self.pedido.invoice_number} - {self.producto.nombre} - {self.ingrediente.nombre} ({self.accion})"