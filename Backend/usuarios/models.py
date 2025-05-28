from django.db import models
from django.contrib.auth.models import User, Group, Permission
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

    TURNOS_CHOICES = [
        ('mañana', 'Mañana'),
        ('tarde', 'Tarde'),
        ('noche', 'Noche'),
    ]
    
    SEXO_CHOICES = [
        ('Masculino', 'Masculino'),
        ('Femenino', 'Femenino'),
    ]
    
    cedula = models.CharField(unique=True, max_length=10)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    fecha_nacimiento = models.DateField(blank=True, null=True)  
    telefono = models.CharField(max_length=10, blank=True, null=True)
    sexo = models.CharField(max_length=50, choices=SEXO_CHOICES, blank=True, null=True)
    turno_trabajo = models.CharField(max_length=20, choices=TURNOS_CHOICES, blank=True, null=True)  
    created_at = models.DateTimeField(auto_now_add=True) 
    updated_at = models.DateTimeField(auto_now=True)     
    user = models.OneToOneField(User, on_delete=models.SET_NULL, blank=True, null=True)

    class Meta:
        managed = True # Manteniendo tu indicación
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
    def establecimiento_actual(self):
        """Obtener el establecimiento actual del empleado"""
        # TODO: Implementar cuando se tenga el modelo de la tabla intermedia
        pass

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
    
    