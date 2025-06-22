from rest_framework import serializers
from .models import AppkioskoEstados, AppkioskoIva  # ✅ AGREGAR AppkioskoIva

class EstadosSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoEstados
        fields = '__all__'

# ✅ NUEVO: Serializer para IVA
class AppkioskoIvaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoIva
        fields = ['id', 'porcentaje_iva', 'activo']

    def validate_porcentaje_iva(self, value):
        """Validar que el porcentaje sea válido"""
        if value < 0:
            raise serializers.ValidationError("El porcentaje de IVA no puede ser negativo")
        if value > 99.99:
            raise serializers.ValidationError("El porcentaje de IVA no puede ser mayor a 99.99%")
        return value
