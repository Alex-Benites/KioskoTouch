from django.db import models
# from apps.comun.models import AppkioskoEstados # Descomenta si se usa
# from apps.marketing.models import AppkioskoPromociones # Descomenta si se usa

class AppkioskoCategorias(models.Model):
    nombre = models.CharField(max_length=50)
    ImagenCategoriaURL = models.URLField(max_length=500, blank=True, null=True)
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
    nombre = models.CharField(max_length=100)
    precio_adicional = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    imagen_ingredienteUrl = models.URLField(max_length=500, blank=True, null=True)
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True) 
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_ingredientes'
        verbose_name = 'Ingrediente'
        verbose_name_plural = 'Ingredientes'

    def __str__(self):
        return self.nombre
    
class AppkioskoProductos(models.Model):
    
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.ForeignKey(AppkioskoCategorias, on_delete=models.SET_NULL, blank=True, null=True)
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True)
    imagenProductoUrl = models.URLField(max_length=500, blank=True, null=True) 
    promocion = models.ForeignKey('marketing.AppkioskoPromociones', on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    ingredientes = models.ManyToManyField(
        AppkioskoIngredientes,
        through='AppkioskoProductoingredientes', 
        related_name='productos',
        blank=True, 
    )

    class Meta:
        managed = True 
        db_table = 'appkiosko_productos'
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'

    def __str__(self):
        return self.nombre

    @property
    def tiene_ingredientes(self):
        """Verifica si el producto tiene ingredientes configurados"""
        return self.ingredientes.exists()

    def get_ingredientes_base(self):
        """Ingredientes incluidos en el precio base (removibles gratis)"""
        return self.appkioskoproductoingredientes_set.filter(es_base=True)

    def get_ingredientes_adicionales(self):
        """Ingredientes que se pueden añadir (con costo extra)"""
        return self.appkioskoproductoingredientes_set.filter(es_base=False)

class AppkioskoMenus(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    tipo_menu = models.CharField(max_length=50, blank=True, null=True)
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)
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
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_menuproductos'
        unique_together = (('producto', 'menu'),)
        verbose_name = 'Producto de Menú'
        verbose_name_plural = 'Productos de Menú'

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre} en {self.menu.nombre}"
    
class AppkioskoProductoingredientes(models.Model):
    """Configuración de ingredientes por producto"""
    producto = models.ForeignKey(AppkioskoProductos, on_delete=models.CASCADE)
    ingrediente = models.ForeignKey(AppkioskoIngredientes, on_delete=models.CASCADE)
    es_base = models.BooleanField(default=True)  # AÑADIR - True = incluido en precio, False = adicional con costo
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_productos_ingredientes'
        unique_together = (('producto', 'ingrediente'),)
        verbose_name = 'Ingrediente del Producto'
        verbose_name_plural = 'Ingredientes del Producto'

    def get_precio_adicional(self):
        """Devuelve el precio del ingrediente si NO es base"""
        if self.es_base:
            return 0.00  # Ingredientes base no tienen costo adicional
        return self.ingrediente.precio_adicional  # Precio fijo del ingrediente

    def __str__(self):
        if self.es_base:
            return f"{self.producto.nombre} - {self.ingrediente.nombre} (Base)"
        else:
            return f"{self.producto.nombre} - {self.ingrediente.nombre} (Adicional +${self.ingrediente.precio_adicional})"
    
    