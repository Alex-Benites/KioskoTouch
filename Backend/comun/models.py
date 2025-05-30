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
    ruta = models.CharField(max_length=500)
    categoria_imagen = models.CharField(max_length=100, blank=True, null=True)
    entidad_relacionada_id = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_imagen'
        verbose_name = 'Imagen'
        verbose_name_plural = 'Imágenes'

    def __str__(self):
        return f"Imagen {self.id} - {self.categoria_imagen}"