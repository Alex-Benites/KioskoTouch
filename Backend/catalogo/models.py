from django.db import models
from comun.models import AppkioskoEstados

class AppkioskoCategorias(models.Model):
    nombre = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_categorias'
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'

    def __str__(self):
        return self.nombre

class AppkioskoIngredientes(models.Model):
    CATEGORIA_INGREDIENTE_CHOICES = [
        ('hamburguesas', 'Hamburguesas'),
        ('pizzas', 'Pizzas'),
        ('ensaladas', 'Ensaladas'),
        ('pollo', 'Pollo'),
        ('postres', 'Postres'),
        ('bebidas', 'Bebidas'),
        ('general', 'General'),  # Para ingredientes que van en varios productos
    ]
    
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    categoria_producto = models.CharField(
        max_length=20,
        choices=CATEGORIA_INGREDIENTE_CHOICES,
        default='general'
    )
    precio_adicional = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    # ✅ AGREGAR CAMPO DE STOCK
    stock = models.IntegerField(
        default=0,
        help_text="Cantidad disponible en inventario"
    )
    # ✅ AGREGAR CAMPOS ADICIONALES DE STOCK (OPCIONALES)
    stock_minimo = models.IntegerField(
        default=5,
        help_text="Cantidad mínima de alerta de stock"
    )
    unidad_medida = models.CharField(
        max_length=20,
        default='unidades',
        help_text="Ej: unidades, gramos, litros, etc."
    )

    imagen = models.ImageField(
        upload_to='ingredientes/', 
        null=True, 
        blank=True,
        help_text="Imagen del ingrediente"
    )
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_ingredientes'
        verbose_name = 'Ingrediente'
        verbose_name_plural = 'Ingredientes'

    def __str__(self):
        return f"{self.nombre} ({self.get_categoria_producto_display()})"

    # ✅ AGREGAR MÉTODOS ÚTILES PARA STOCK
    @property
    def esta_agotado(self):
        """Retorna True si el ingrediente está agotado"""
        return self.stock <= 0

    @property
    def necesita_reposicion(self):
        """Retorna True si el stock está por debajo del mínimo"""
        return self.stock <= self.stock_minimo

    @property
    def estado_stock(self):
        """Retorna el estado del stock como string"""
        if self.esta_agotado:
            return "AGOTADO"
        elif self.necesita_reposicion:
            return "BAJO STOCK"
        else:
            return "DISPONIBLE"

class AppkioskoTamanos(models.Model):
    nombre = models.CharField(max_length=50)  # 'Pequeño', 'Mediano', 'Grande'
    codigo = models.CharField(max_length=10)  # 'P', 'M', 'G'
    orden = models.IntegerField(default=0)    # Para ordenar los tamaños
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_tamanos'
        verbose_name = 'Tamaño'
        verbose_name_plural = 'Tamaños'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre

class AppkioskoProductos(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.ForeignKey(AppkioskoCategorias, on_delete=models.SET_NULL, blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)
    # Nuevo campo para indicar si el producto tiene diferentes tamaños
    aplica_tamanos = models.BooleanField(default=False)

    ingredientes = models.ManyToManyField(
        AppkioskoIngredientes, 
        through='AppkioskoProductosIngredientes',
        blank=True,
        related_name='productos'
    )
    
    # Nueva relación con tamaños
    tamanos = models.ManyToManyField(
        AppkioskoTamanos,
        through='AppkioskoProductoTamanos',
        blank=True,
        related_name='productos'
    )

    class Meta:
        managed = True
        db_table = 'appkiosko_productos'
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'

    def __str__(self):
        return self.nombre

class AppkioskoMenus(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    tipo_menu = models.CharField(max_length=50, blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_menus'
        verbose_name = 'Menú'
        verbose_name_plural = 'Menús'

    def __str__(self):
        return self.nombre

class AppkioskoMenuproductos(models.Model):
    producto = models.ForeignKey(AppkioskoProductos, on_delete=models.CASCADE, blank=True, null=True)
    menu = models.ForeignKey(AppkioskoMenus, on_delete=models.CASCADE, blank=True, null=True)
    cantidad = models.IntegerField()
    tamano = models.ForeignKey(
        AppkioskoTamanos, 
        on_delete=models.CASCADE, 
        blank=True, 
        null=True,
        help_text="Tamaño específico del producto en este menú (opcional)"
    )
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        # ✅ AGREGAR esta línea para especificar el nombre correcto de la tabla
        db_table = 'appkiosko_menuproductos'
        verbose_name = 'Producto del Menú'
        verbose_name_plural = 'Productos del Menú'

    def __str__(self):
        tamano_str = f" ({self.tamano.nombre})" if self.tamano else ""
        return f"{self.cantidad} x {self.producto.nombre}{tamano_str}"

class AppkioskoProductosIngredientes(models.Model):
    producto = models.ForeignKey(AppkioskoProductos, on_delete=models.CASCADE, blank=True, null=True)
    ingrediente = models.ForeignKey(AppkioskoIngredientes, on_delete=models.CASCADE, blank=True, null=True)
    es_base = models.BooleanField(default=True)
    permite_extra = models.BooleanField(default=False)
    # ✅ AGREGAR NUEVA COLUMNA DE CANTIDAD
    cantidad = models.IntegerField(
        default=1,
        help_text="Cantidad de este ingrediente en el producto (ej: doble carne = 2)"
    )
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_productos_ingredientes'
        unique_together = (('producto', 'ingrediente'),)
        verbose_name = 'Ingrediente del Producto'
        verbose_name_plural = 'Ingredientes del Producto'

    def __str__(self):
        tipo = "Base" if self.es_base else "Adicional"
        cantidad_str = f"{self.cantidad}x " if self.cantidad > 1 else ""
        return f"{self.producto.nombre} - {cantidad_str}{self.ingrediente.nombre} ({tipo})"

# Nuevo modelo para relacionar productos con tamaños y precios
class AppkioskoProductoTamanos(models.Model):
    producto = models.ForeignKey(AppkioskoProductos, on_delete=models.CASCADE)
    tamano = models.ForeignKey(AppkioskoTamanos, on_delete=models.CASCADE)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_producto_tamanos'
        unique_together = (('producto', 'tamano'),)
        verbose_name = 'Precio por Tamaño'
        verbose_name_plural = 'Precios por Tamaño'

    def __str__(self):
        return f"{self.producto.nombre} - {self.tamano.nombre}: ${self.precio}"


