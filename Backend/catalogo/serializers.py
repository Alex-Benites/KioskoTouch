from rest_framework import serializers
from .models import AppkioskoProductos, AppkioskoCategorias
from comun.models import AppkioskoImagen
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
            'imagen',               # solo para carga
            'created_at',
            'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        request = self.context.get('request')
        imagen = validated_data.pop('imagen', None)  # elimina 'imagen' antes de crear

        # Crear el producto primero
        producto = AppkioskoProductos.objects.create(**validated_data)

        # Si hay imagen, guardarla en AppkioskoImagen
        if imagen:
            filename = f'productos/{imagen.name}'
            path = default_storage.save(filename, ContentFile(imagen.read()))
            # Guardar solo la ruta relativa con /media/
            relative_path = f'{settings.MEDIA_URL}{path}'
            
            # Crear registro en AppkioskoImagen
            AppkioskoImagen.objects.create(
                ruta=relative_path,
                categoria_imagen='productos',
                entidad_relacionada_id=producto.id
            )

        return producto

class CategoriaSerializer(serializers.ModelSerializer):
    imagen = serializers.ImageField(write_only=True, required=False)
    imagen_url = serializers.SerializerMethodField(read_only=True)  # Nuevo campo para obtener la imagen

    class Meta:
        model = AppkioskoCategorias
        fields = [
            'id',
            'nombre',
            'imagen',      # solo para carga
            'imagen_url',  # para obtener la URL de la imagen
            'created_at',
            'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'imagen_url')

    def get_imagen_url(self, obj):
        """Obtiene la URL de la imagen desde AppkioskoImagen"""
        try:
            imagen = AppkioskoImagen.objects.get(
                categoria_imagen='categorias',
                entidad_relacionada_id=obj.id
            )
            return imagen.ruta
        except AppkioskoImagen.DoesNotExist:
            return None

    def create(self, validated_data):
        request = self.context.get('request')
        imagen = validated_data.pop('imagen', None)

        # Crear la categoría primero
        categoria = AppkioskoCategorias.objects.create(**validated_data)
        print(f"✅ Categoría creada: ID={categoria.id}, Nombre={categoria.nombre}")

        # Si hay imagen, guardarla en AppkioskoImagen
        if imagen:
            filename = f'categorias/{imagen.name}'
            path = default_storage.save(filename, ContentFile(imagen.read()))
            relative_path = f'{settings.MEDIA_URL}{path}'
            
            # Crear registro en AppkioskoImagen
            imagen_obj = AppkioskoImagen.objects.create(
                ruta=relative_path,
                categoria_imagen='categorias',
                entidad_relacionada_id=categoria.id
            )
            
            print(f"🖼️  IMAGEN CATEGORÍA GUARDADA:")
            print(f"   - Categoría: {categoria.nombre}")
            print(f"   - Ruta: {relative_path}")
            print(f"   - ID Imagen: {imagen_obj.id}")
            print("─" * 50)

        return categoria