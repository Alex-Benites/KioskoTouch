from rest_framework import serializers
from .models import AppkioskoProductos, AppkioskoCategorias
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings



class ProductoSerializer(serializers.ModelSerializer):
    imagen = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = AppkioskoProductos
        fields = [
            'id',
            'nombre',
            'descripcion',
            'precio',
            'categoria',
            'estado',
            'promocion',
            'imagen',               # solo para carga
            'imagenProductoUrl',    # campo que sí está en el modelo
            'created_at',
            'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        request = self.context.get('request')
        imagen = validated_data.pop('imagen', None)  # elimina 'imagen' antes de crear

        if imagen and request:
            filename = f'productos/{imagen.name}'
            path = default_storage.save(filename, ContentFile(imagen.read()))
            image_url = request.build_absolute_uri(settings.MEDIA_URL + path)
            validated_data['imagenProductoUrl'] = image_url

        return AppkioskoProductos.objects.create(**validated_data)


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoCategorias
        fields = '__all__' 

