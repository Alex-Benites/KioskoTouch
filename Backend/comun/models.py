from django.db import models

class AppkioskoEstados(models.Model):
    nombre = models.CharField(max_length=100, default='Estado Desconocido')
    is_active = models.BooleanField(default=True)
    is_eliminated = models.BooleanField(default=False)
    is_inactive = models.BooleanField(default=False)
    is_order_preparing = models.BooleanField(default=False)
    is_order_finished = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_estados'
        verbose_name = 'Estado'
        verbose_name_plural = 'Estados'

    def __str__(self):
        return self.nombre

class AppkioskoTipopago(models.Model):
    nombre = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_tipopago'
        verbose_name = 'Tipo de Pago'
        verbose_name_plural = 'Tipos de Pago'

    def __str__(self):
        return self.nombre

class AppkioskoImagen(models.Model):
    CATEGORIA_CHOICES = [
        ('productos', 'Productos'),
        ('ingredientes', 'Ingredientes'),
        ('menu', 'Menú'),
        ('publicidad', 'Publicidad'),
        ('categorias', 'Categorías'),
        ('establecimientos', 'Establecimientos'),

    ]

    ruta = models.CharField(max_length=500)
    categoria_imagen = models.CharField(
        max_length=100,
        choices=CATEGORIA_CHOICES,
        blank=True,
        null=True
    )
    entidad_relacionada_id = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_imagen'
        verbose_name = 'Imagen'
        verbose_name_plural = 'Imágenes'

    def __str__(self):
        return f"Imagen {self.id} - {self.get_categoria_imagen_display()}"

# ✅ MODIFICAR: Versión simple del modelo IVA
class AppkioskoIva(models.Model):
    porcentaje_iva = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name="Porcentaje de IVA"
    )
    activo = models.BooleanField(
        default=True,
        verbose_name="Activo"
    )

    class Meta:
        managed = True
        db_table = 'appkiosko_iva'
        verbose_name = 'Configuración de IVA'
        verbose_name_plural = 'Configuraciones de IVA'

    def __str__(self):
        estado = "ACTIVO" if self.activo else "INACTIVO"
        return f"IVA {self.porcentaje_iva}% - {estado}"

    def save(self, *args, **kwargs):
        # Solo un IVA puede estar activo a la vez
        if self.activo:
            AppkioskoIva.objects.filter(activo=True).update(activo=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_porcentaje_actual(cls):
        """Obtener el porcentaje del IVA actual"""
        iva_actual = cls.objects.filter(activo=True).first()
        return iva_actual.porcentaje_iva if iva_actual else 15.00