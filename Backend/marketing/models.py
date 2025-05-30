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
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_promocionproductos'
        unique_together = (('producto', 'promocion'),)
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
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    tipo_publicidad = models.CharField(max_length=100, blank=True, null=True)
    fecha_inicio_publicidad = models.DateTimeField(blank=True, null=True)
    fecha_fin_publicidad = models.DateTimeField(blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    promocion = models.ForeignKey(AppkioskoPromociones, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_publicidades'
        verbose_name = 'Publicidad'
        verbose_name_plural = 'Publicidades'

    def __str__(self):
        return self.nombre

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