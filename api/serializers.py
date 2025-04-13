from rest_framework import serializers
from main.models import AuthUser #aqui depende donde este mi modelo de la base de datos

class AuthUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthUser
        fields = '__all__'  # Esto incluirá todos los campos del modelo

