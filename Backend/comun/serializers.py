from rest_framework import serializers
from .models import AppkioskoEstados, AppkioskoIva  # ✅ AGREGAR AppkioskoIva

class EstadosSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoEstados
        fields = '__all__'

# ✅ EXPANDIDO: Serializer completo para configuración empresarial
class AppkioskoIvaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoIva
        fields = [
            'id',
            # Configuración tributaria
            'porcentaje_iva',
            'activo',
            # Datos empresariales
            'ruc',
            'razon_social',
            'nombre_comercial',
            # Ubicación
            'direccion',
            'ciudad',
            'provincia',
            'codigo_postal',
            # Contacto
            'telefono',
            'email',
            # Metadatos
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_porcentaje_iva(self, value):
        """Validar que el porcentaje sea válido"""
        if value < 0:
            raise serializers.ValidationError("El porcentaje de IVA no puede ser negativo")
        if value > 99.99:
            raise serializers.ValidationError("El porcentaje de IVA no puede ser mayor a 99.99%")
        return value

    def validate_ruc(self, value):
        """Validar formato del RUC ecuatoriano"""
        if value and len(value) != 13:
            raise serializers.ValidationError("El RUC debe tener exactamente 13 dígitos")
        if value and not value.isdigit():
            raise serializers.ValidationError("El RUC debe contener solo números")
        return value

    def validate_email(self, value):
        """Validar formato del email"""
        if value and '@' not in value:
            raise serializers.ValidationError("El email debe tener un formato válido")
        return value

    def validate(self, data):
        """Validaciones generales"""
        # Si se está marcando como activo, verificar que hay datos mínimos
        if data.get('activo', False):
            if not data.get('porcentaje_iva'):
                raise serializers.ValidationError({
                    'porcentaje_iva': 'El porcentaje de IVA es obligatorio para activar la configuración'
                })
        
        return data

# ✅ NUEVO: Serializer simplificado solo para obtener datos de facturación
class ConfiguracionEmpresaSerializer(serializers.ModelSerializer):
    """Serializer específico para datos de facturación"""
    
    class Meta:
        model = AppkioskoIva
        fields = [
            'ruc',
            'razon_social', 
            'nombre_comercial',
            'direccion',
            'ciudad',
            'provincia',
            'telefono',
            'email',
            'porcentaje_iva'
        ]

# ✅ NUEVO: Serializer solo para IVA (compatible con frontend actual)
class IvaSimpleSerializer(serializers.ModelSerializer):
    """Serializer para mantener compatibilidad con el frontend actual"""
    
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