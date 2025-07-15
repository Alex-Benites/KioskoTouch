from django.db import models
from comun.models import AppkioskoEstados
from catalogo.models import AppkioskoProductos, AppkioskoMenus
from establecimientos.models import AppkioskoEstablecimientos, AppkioskoKioskostouch

class AppkioskoPromociones(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=100, blank=True, null=True)
    valor_descuento = models.IntegerField()
    fecha_inicio_promo = models.DateTimeField()
    fecha_fin_promo = models.DateTimeField(blank=True, null=True)
    tipo_promocion = models.CharField(max_length=50, blank=True, null=True)
    codigo_promocional = models.CharField(max_length=50, blank=True, null=True)
    limite_uso_usuario = models.IntegerField(blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    limite_uso_total = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_promociones'
        verbose_name = 'Promoción'
        verbose_name_plural = 'Promociones'

    def __str__(self):
        return self.nombre

class AppkioskoPromocionproductos(models.Model):
    producto = models.ForeignKey(AppkioskoProductos, on_delete=models.CASCADE, blank=True, null=True)
    promocion = models.ForeignKey(AppkioskoPromociones, on_delete=models.CASCADE, blank=True, null=True)
    tamano = models.ForeignKey(
        'catalogo.AppkioskoTamanos', 
        on_delete=models.CASCADE, 
        blank=True, 
        null=True,
        help_text="Tamaño específico del producto en esta promoción (opcional)"
    )
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_promocionproductos'
        unique_together = (('producto', 'promocion', 'tamano'),)
        verbose_name = 'Promoción Producto'
        verbose_name_plural = 'Promociones Productos'

class AppkioskoPromocionmenu(models.Model):
    menu = models.ForeignKey(AppkioskoMenus, on_delete=models.CASCADE, blank=True, null=True)
    promocion = models.ForeignKey(AppkioskoPromociones, on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_promocionmenu'
        unique_together = (('menu', 'promocion'),)
        verbose_name = 'Promoción Menú'
        verbose_name_plural = 'Promociones Menús'

class AppkioskoPublicidades(models.Model):
    # CHOICES para tipo de publicidad
    TIPO_BANNER = 'banner'
    TIPO_VIDEO = 'video'
    
    TIPOS_PUBLICIDAD = [
        (TIPO_BANNER, 'Banner'),
        (TIPO_VIDEO, 'Video'),
    ]
    
    # CHOICES para secciones del sistema
    SECCION_HOME = 'home'
    SECCION_MENU = 'menu'
    SECCION_CARRITO = 'carrito'
    SECCION_PAGO = 'pago'
    SECCION_TURNO = 'turno'
    SECCION_GLOBAL = 'global'
    
    SECCIONES_SISTEMA = [
        (SECCION_HOME, 'Página Principal'),
        (SECCION_MENU, 'Menú de Productos'),
        (SECCION_CARRITO, 'Carrito de Compras'),
        (SECCION_PAGO, 'Proceso de Pago'),
        (SECCION_TURNO, 'Sala de Espera/Turno'),
        (SECCION_GLOBAL, 'Todas las Secciones'),
    ]
    
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    tipo_publicidad = models.CharField(
        max_length=100, 
        choices=TIPOS_PUBLICIDAD,
        default=TIPO_BANNER,
        help_text="Tipo de publicidad a mostrar"
    )
    seccion = models.CharField(
        max_length=50,
        choices=SECCIONES_SISTEMA,
        default=SECCION_GLOBAL,
        help_text="Sección del sistema donde se mostrará la publicidad"
    )
    fecha_inicio_publicidad = models.DateTimeField(blank=True, null=True)
    fecha_fin_publicidad = models.DateTimeField(blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    promocion = models.ForeignKey(AppkioskoPromociones, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)
    tiempo_visualizacion = models.PositiveIntegerField(default=5, help_text="Tiempo de visualización en segundos")

    class Meta:
        managed = True
        db_table = 'appkiosko_publicidades'
        verbose_name = 'Publicidad'
        verbose_name_plural = 'Publicidades'

    def __str__(self):
        return self.nombre
    
    def get_tipo_publicidad_display_custom(self):
        """Método personalizado para obtener el display del tipo"""
        return dict(self.TIPOS_PUBLICIDAD).get(self.tipo_publicidad, self.tipo_publicidad)
    
    def get_seccion_display_custom(self):
        """Método personalizado para obtener el display de la sección"""
        return dict(self.SECCIONES_SISTEMA).get(self.seccion, self.seccion)

class AppkioskoPublicidadestablecimiento(models.Model):
    establecimiento = models.ForeignKey(AppkioskoEstablecimientos, on_delete=models.CASCADE, blank=True, null=True)
    publicidad = models.ForeignKey(AppkioskoPublicidades, on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_publicidadestablecimiento'
        unique_together = (('establecimiento', 'publicidad'),)
        verbose_name = 'Publicidad Establecimiento'
        verbose_name_plural = 'Publicidades Establecimiento'

class AppkioskoPublicidadkioskotouch(models.Model):
    kiosko_touch = models.ForeignKey(AppkioskoKioskostouch, on_delete=models.CASCADE, blank=True, null=True)
    publicidad = models.ForeignKey(AppkioskoPublicidades, on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_publicidadkioskotouch'
        unique_together = (('kiosko_touch', 'publicidad'),)
        verbose_name = 'Publicidad Kiosko'
        verbose_name_plural = 'Publicidades Kiosko'

class AppkioskoVideo(models.Model):
    nombre = models.CharField(max_length=100)
    ruta = models.CharField(max_length=500)
    duracion = models.IntegerField()
    publicidad = models.ForeignKey(AppkioskoPublicidades, on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_video'
        verbose_name = 'Video'
        verbose_name_plural = 'Videos'

    def __str__(self):
        return self.nombre