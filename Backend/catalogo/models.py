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


class AppkioskoProductos(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.ForeignKey(AppkioskoCategorias, on_delete=models.SET_NULL, blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

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
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_menuproductos'
        unique_together = (('producto', 'menu'),)
        verbose_name = 'Producto de Menú'
        verbose_name_plural = 'Productos de Menú'

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre} en {self.menu.nombre}"

class AppkioskoProductosIngredientes(models.Model):
    producto = models.ForeignKey(AppkioskoProductos, on_delete=models.CASCADE, blank=True, null=True)
    ingrediente = models.ForeignKey(AppkioskoIngredientes, on_delete=models.CASCADE, blank=True, null=True)
    es_base = models.BooleanField(default=True)
    permite_extra = models.BooleanField(default=False)
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
        return f"{self.producto.nombre} - {self.ingrediente.nombre} ({tipo})"


