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

    #Nuevo campo
    precio_ingredientes_extra = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) 

    class Meta:
        managed = True 
        db_table = 'appkiosko_detallefacturaproducto'
         # unique_together = (('factura', 'producto'),)  # COMENTAR para permitir múltiples items
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
    pedido = models.ForeignKey(AppkioskoPedidos, on_delete=models.CASCADE)
    producto = models.ForeignKey('catalogo.AppkioskoProductos', on_delete=models.PROTECT)
    cantidad = models.IntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) 
    precio_ingredientes_extra = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # CORREGIR: eliminar campo duplicado
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True 
        db_table = 'appkiosko_pedidosproductos'
        # NO unique_together porque pueden haber múltiples registros del mismo producto con personalizaciones diferentes
        verbose_name = 'Producto de Pedido'
        verbose_name_plural = 'Productos de Pedido'

    @property
    def precio_total_item(self):
        """Precio final del item = (precio_unitario + ingredientes_extra) * cantidad"""
        return (self.precio_unitario + self.precio_ingredientes_extra) * self.cantidad

    @property
    def es_personalizable(self):
        """Solo productos con ingredientes son personalizables"""
        return self.producto.tiene_ingredientes

    def __str__(self):
        if self.cantidad == 1:
            return f"{self.producto.nombre} - ${self.precio_total_item}"
        else:
            return f"{self.cantidad}x {self.producto.nombre} - ${self.precio_total_item}"

class AppkioskoPedidoproductoingredientes(models.Model):
    """Personalización de ingredientes por producto en cada pedido"""
    pedido_producto = models.ForeignKey(AppkioskoPedidosproductos, on_delete=models.CASCADE, related_name='personalizaciones')
    ingrediente = models.ForeignKey('catalogo.AppkioskoIngredientes', on_delete=models.CASCADE)
    accion = models.CharField(max_length=10, choices=[
        ('quitar', 'Quitar'),      # Remover ingrediente base (gratis)
        ('añadir', 'Añadir'),      # Agregar ingrediente extra (con costo)
    ])
    cantidad = models.IntegerField(default=1)  # Cantidad de este ingrediente 
    precio_unitario_ingrediente = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)  
    precio_total_ingrediente = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)  # cantidad * precio_unitario
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True 
        db_table = 'appkiosko_pedido_producto_ingredientes'
        unique_together = (('pedido_producto', 'ingrediente'),)
        verbose_name = 'Personalización de Ingrediente'
        verbose_name_plural = 'Personalizaciones de Ingredientes'

    def save(self, *args, **kwargs):
        """Calcular precio total automáticamente"""
        if self.accion == 'añadir':
            # Guardar precio unitario en el momento de la compra (para histórico)
            if not self.precio_unitario_ingrediente:
                self.precio_unitario_ingrediente = self.ingrediente.precio_adicional
            # Calcular precio total
            self.precio_total_ingrediente = self.cantidad * self.precio_unitario_ingrediente
        else:
            # Si es quitar, no hay costo
            self.precio_unitario_ingrediente = 0.00
            self.precio_total_ingrediente = 0.00
        
        super().save(*args, **kwargs)

    def __str__(self):
        if self.accion == 'quitar':
            return f"Sin {self.ingrediente.nombre}"
        else:
            if self.cantidad == 1:
                return f"+ {self.ingrediente.nombre} (${self.precio_total_ingrediente})"
            else:
                return f"+ {self.cantidad}x {self.ingrediente.nombre} (${self.precio_total_ingrediente})"