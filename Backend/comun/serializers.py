from rest_framework import serializers
from .models import AppkioskoEstados  # Ajusta el path si tu modelo está en otro módulo

class EstadosSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoEstados
        fields = '__all__'
