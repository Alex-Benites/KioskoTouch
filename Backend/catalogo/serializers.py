from rest_framework import serializers
from .models import AppkioskoProductos, AppkioskoCategorias
from comun.models import AppkioskoEstados # Asumiendo que AppkioskoEstados está en la app 'comun'
from marketing.models import AppkioskoPromociones # Asumiendo que AppkioskoPromociones está en la app 'marketing'

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoProductos
        fields = [
            'id', 
            'nombre',
            'descripcion',
            'precio',
            'categoria', # Se enviará/esperará el ID de la categoría
            'estado',    # Se enviará/esperará el ID del estado
            'promocion', # Se enviará/esperará el ID de la promoción
            'created_at',
            'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at', 'id') # Campos que no se deben modificar directamente al crear/actualizar