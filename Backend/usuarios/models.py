from django.db import models
from django.contrib.auth.models import User, Group

class AppkioskoClientes(models.Model):
    cedula = models.CharField(unique=True, max_length=10)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    email = models.CharField(unique=True, max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=10, blank=True, null=True)
    sexo = models.CharField(max_length=50, blank=True, null=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_clientes'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

class AppkioskoEmpleados(models.Model):
    cedula = models.CharField(unique=True, max_length=10)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    telefono = models.CharField(max_length=10, blank=True, null=True)
    sexo = models.CharField(max_length=50, blank=True, null=True)
    turno_trabajo = models.CharField(max_length=20, blank=True, null=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_empleados'
        verbose_name = 'Empleado'
        verbose_name_plural = 'Empleados'

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"
    
    @property
    def roles(self):
        """Obtener roles (grupos) del empleado"""
        if self.user:
            return self.user.groups.all()
        return Group.objects.none()
    
    @property
    def rol_principal(self):
        """Obtener el rol principal del empleado"""
        return self.roles.first()
    
    @property
    def nombres_roles(self):
        """Obtener nombres de roles como lista"""
        return [grupo.name for grupo in self.roles]
    
    def tiene_permiso(self, permiso_codigo):
        """Verificar si tiene un permiso específico"""
        if self.user:
            return self.user.has_perm(permiso_codigo)
        return False
    
    def agregar_rol(self, nombre_grupo):
        """Agregar rol al empleado"""
        if self.user:
            try:
                grupo = Group.objects.get(name=nombre_grupo)
                self.user.groups.add(grupo)
                return True
            except Group.DoesNotExist:
                return False
        return False
    
    def remover_rol(self, nombre_grupo):
        """Remover rol del empleado"""
        if self.user:
            try:
                grupo = Group.objects.get(name=nombre_grupo)
                self.user.groups.remove(grupo)
                return True
            except Group.DoesNotExist:
                return False
        return False
    
    def establecer_roles(self, nombres_grupos):
        """Establecer roles específicos (reemplaza todos los existentes)"""
        if self.user:
            grupos = Group.objects.filter(name__in=nombres_grupos)
            self.user.groups.set(grupos)
            return True
        return False