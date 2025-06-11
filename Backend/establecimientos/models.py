from django.db import models
from comun.models import AppkioskoEstados,AppkioskoImagen
from django.contrib.auth.models import User
from usuarios.models import AppkioskoEmpleados
from django.db.models.signals import post_delete
from django.dispatch import receiver
import os

class AppkioskoEstablecimientos(models.Model):
    nombre = models.CharField(max_length=50)
    direccion = models.CharField(max_length=200)
    telefono = models.CharField(max_length=15, blank=True, null=True)
    tipo_establecimiento = models.CharField(max_length=50, blank=True, null=True)
    correo = models.CharField(max_length=100, blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    
    # NUEVO CAMPO DE IMAGEN:
    imagen = models.ForeignKey(
        AppkioskoImagen, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        verbose_name="Imagen del Establecimiento",
        help_text="Selecciona una imagen para el establecimiento"
    )

    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)
    provincia = models.CharField(
        max_length=50,
        verbose_name="Provincia",
        help_text="Provincia donde se encuentra el establecimiento"
    )
 
    ciudad = models.CharField(
        max_length=50,
        verbose_name="Ciudad",
        help_text="Ciudad donde se encuentra el establecimiento"
    )

    responsable_asignado = models.ForeignKey(
        AppkioskoEmpleados,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='establecimientos_responsable',
        verbose_name="Responsable Asignado",
        help_text="Empleado responsable del establecimiento"
    )

    cargo_asignado = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Cargo del Responsable",
        help_text="Cargo del empleado responsable (se llena automáticamente)"
    )

    class Meta:
        managed = True
        db_table = 'appkiosko_establecimientos'
        verbose_name = 'Establecimiento'
        verbose_name_plural = 'Establecimientos'

    def __str__(self):
        return f"{self.nombre} - {self.ciudad}, {self.provincia}"

    def save(self, *args, **kwargs):
        if self.responsable_asignado and self.responsable_asignado.user:
            rol_principal = self.responsable_asignado.user.groups.first()
            if rol_principal:
                self.cargo_asignado = rol_principal.name
            else:
                self.cargo_asignado = 'Sin rol asignado'

        super().save(*args, **kwargs)

class AppkioskoEstablecimientosusuarios(models.Model):
    establecimiento = models.ForeignKey(AppkioskoEstablecimientos, on_delete=models.CASCADE, blank=True, null=True)
    empleado = models.ForeignKey(AppkioskoEmpleados, on_delete=models.CASCADE, blank=True, null=True)
    fecha_inicio_trabajo = models.DateTimeField()
    fecha_fin_trabajo = models.DateTimeField(blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_establecimientosusuarios'
        unique_together = (('establecimiento', 'empleado', 'fecha_inicio_trabajo'),)
        verbose_name = 'Establecimiento Usuario'
        verbose_name_plural = 'Establecimientos Usuarios'

class AppkioskoPantallascocina(models.Model):
    nombre = models.CharField(max_length=50)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    token = models.CharField(max_length=255, blank=True, null=True)
    establecimiento = models.ForeignKey(AppkioskoEstablecimientos, on_delete=models.CASCADE, blank=True, null=True)
    kioskos_asociados = models.ManyToManyField(
        'AppkioskoKioskostouch', 
        blank=True, 
        related_name='pantallas_asociadas'
    )
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_pantallascocina'
        verbose_name = 'Pantalla de Cocina'
        verbose_name_plural = 'Pantallas de Cocina'

    def __str__(self):
        return self.nombre

class AppkioskoKioskostouch(models.Model):
    nombre = models.CharField(max_length=50)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
    token = models.CharField(max_length=255, blank=True, null=True)
    establecimiento = models.ForeignKey(AppkioskoEstablecimientos, on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_kioskostouch'
        verbose_name = 'Kiosko Touch'
        verbose_name_plural = 'Kioskos Touch'

    def __str__(self):
        return self.nombre

@receiver(post_delete, sender=AppkioskoEstablecimientos)
def eliminar_imagen_establecimiento(sender, instance, **kwargs):
    if instance.imagen:
        # Borra el archivo físico
        if instance.imagen.ruta:
            from django.conf import settings
            ruta_fisica = os.path.join(settings.MEDIA_ROOT, instance.imagen.ruta.lstrip('/media/'))
            if os.path.exists(ruta_fisica):
                os.remove(ruta_fisica)
        # Borra el objeto imagen
        instance.imagen.delete()