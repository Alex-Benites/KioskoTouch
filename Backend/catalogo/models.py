from django.db import models
# from apps.comun.models import AppkioskoEstados # Descomenta si se usa
# from apps.marketing.models import AppkioskoPromociones # Descomenta si se usa

class AppkioskoCategorias(models.Model):
    nombre = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True , blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        #managed = False 
        db_table = 'appkiosko_categorias'
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'

    def __str__(self):
        return self.nombre

class AppkioskoProductos(models.Model):
    
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.ForeignKey(AppkioskoCategorias, on_delete=models.SET_NULL, blank=True, null=True) # Proteger categoría
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    imagenProductoUrl = models.URLField(max_length=500, blank=True, null=True) 
    promocion = models.ForeignKey('marketing.AppkioskoPromociones', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True,blank=True, null=True)

    class Meta:
        #managed = False # Manteniendo tu indicación
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
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    productos = models.ManyToManyField(
        AppkioskoProductos,
        through='AppkioskoMenuproductos',
        related_name='menus_asociados' # Evitar conflicto con 'menus' si AppkioskoProductos tiene una FK a Menus
    )

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_menus'
        verbose_name = 'Menú'
        verbose_name_plural = 'Menús'

    def __str__(self):
        return self.nombre

class AppkioskoMenuproductos(models.Model):
    # producto = models.OneToOneField(AppkioskoProductos, models.DO_NOTHING, primary_key=True) # ANTERIOR
    # menu = models.ForeignKey(AppkioskoMenus, models.DO_NOTHING) # ANTERIOR
    producto = models.ForeignKey(AppkioskoProductos, on_delete=models.CASCADE) # CORREGIDO
    menu = models.ForeignKey(AppkioskoMenus, on_delete=models.CASCADE) # CORREGIDO
    cantidad = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_menuproductos'
        unique_together = (('producto', 'menu'),)
        verbose_name = 'Producto de Menú'
        verbose_name_plural = 'Productos de Menú'

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre} en {self.menu.nombre}"