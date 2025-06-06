from django.db import models
from comun.models import AppkioskoEstados
from django.contrib.auth.models import User
from usuarios.models import AppkioskoEmpleados

class AppkioskoEstablecimientos(models.Model):
    nombre = models.CharField(max_length=50)
    direccion = models.CharField(max_length=200)
    telefono = models.CharField(max_length=15, blank=True, null=True)
    tipo_establecimiento = models.CharField(max_length=50, blank=True, null=True)
    correo = models.CharField(max_length=100, blank=True, null=True)
    estado = models.ForeignKey(AppkioskoEstados, on_delete=models.SET_NULL, blank=True, null=True)
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
    pantallas_cocina = models.ForeignKey(AppkioskoPantallascocina, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_kioskostouch'
        verbose_name = 'Kiosko Touch'
        verbose_name_plural = 'Kioskos Touch'

    def __str__(self):
        return self.nombre