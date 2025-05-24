from django.db import models
from django.contrib.auth.models import User
# from apps.comun.models import AppkioskoEstados # Descomenta si estos modelos usan AppkioskoEstados

class AppkioskoClientes(models.Model):
    cedula = models.CharField(unique=True, max_length=10)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    email = models.CharField(unique=True, max_length=100, blank=True, null=True) # Considerar EmailField
    telefono = models.CharField(max_length=10, blank=True, null=True)
    sexo = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, blank=True, null=True) # on_delete ajustado

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_clientes'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

class AppkioskoEmpleados(models.Model):
    cedula = models.CharField(unique=True, max_length=10)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    telefono = models.CharField(max_length=10, blank=True, null=True)
    sexo = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, blank=True, null=True) # on_delete ajustado

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_empleados'
        verbose_name = 'Empleado'
        verbose_name_plural = 'Empleados'

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"