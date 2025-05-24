from django.db import models
# from apps.comun.models import AppkioskoEstados
# from apps.usuarios.models import AppkioskoEmpleados

class AppkioskoEstablecimientos(models.Model):
    nombre = models.CharField(max_length=50)
    direccion = models.CharField(max_length=200)
    telefono = models.CharField(max_length=15, blank=True, null=True)
    tipo_establecimiento = models.CharField(max_length=50, blank=True, null=True)
    correo = models.CharField(max_length=100, blank=True, null=True) # Considerar EmailField
    image_url = models.CharField(db_column='image_URL', max_length=500, blank=True, null=True) # Considerar URLField
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    empleados_asignados = models.ManyToManyField(
        'usuarios.AppkioskoEmpleados',
        through='AppkioskoEstablecimientosusuarios',
        related_name='establecimientos_donde_trabaja' # Nombre de relación único
    )


    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_establecimientos'
        verbose_name = 'Establecimiento'
        verbose_name_plural = 'Establecimientos'

    def __str__(self):
        return self.nombre

class AppkioskoEstablecimientosusuarios(models.Model):
    # establecimiento = models.OneToOneField(AppkioskoEstablecimientos, models.DO_NOTHING, primary_key=True) # ANTERIOR
    # empleado = models.ForeignKey('usuarios.AppkioskoEmpleados', models.DO_NOTHING) # ANTERIOR
    establecimiento = models.ForeignKey(AppkioskoEstablecimientos, on_delete=models.CASCADE) # CORREGIDO
    empleado = models.ForeignKey('usuarios.AppkioskoEmpleados', on_delete=models.CASCADE) # CORREGIDO
    fecha_iniciotrabajo = models.DateTimeField(db_column='fecha_inicioTrabajo')
    fecha_fintrabajo = models.DateTimeField(db_column='fecha_finTrabajo', blank=True, null=True)
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_establecimientosusuarios'
        unique_together = (('establecimiento', 'empleado', 'fecha_iniciotrabajo'),) # Para permitir recontrataciones
        verbose_name = 'Empleado por Establecimiento'
        verbose_name_plural = 'Empleados por Establecimiento'

class AppkioskoPantallascocina(models.Model):
    nombre = models.CharField(max_length=50)
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    token = models.CharField(max_length=255, blank=True, null=True) # Considerar unique=True
    establecimiento = models.ForeignKey(AppkioskoEstablecimientos, on_delete=models.CASCADE, blank=True, null=True, related_name="pantallas_cocina") # Ajustar on_delete
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_pantallascocina'
        verbose_name = 'Pantalla de Cocina'
        verbose_name_plural = 'Pantallas de Cocina'

    def __str__(self):
        return f"{self.nombre} ({self.establecimiento.nombre if self.establecimiento else 'Sin establecimiento'})"

class AppkioskoKioskostouch(models.Model):
    nombre = models.CharField(max_length=50)
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    token = models.CharField(max_length=255, blank=True, null=True) # Considerar unique=True
    establecimiento = models.ForeignKey(AppkioskoEstablecimientos, on_delete=models.CASCADE, db_column='establecimiento_ID', blank=True, null=True, related_name="kioskos_touch") # Ajustar on_delete
    pantallascocina = models.ForeignKey(AppkioskoPantallascocina, on_delete=models.SET_NULL, db_column='pantallasCocina_ID', blank=True, null=True) # Ajustar on_delete
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_kioskostouch'
        verbose_name = 'Kiosko Touch'
        verbose_name_plural = 'Kioskos Touch'

    def __str__(self):
        return f"{self.nombre} ({self.establecimiento.nombre if self.establecimiento else 'Sin establecimiento'})"