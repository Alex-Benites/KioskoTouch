# ✅ Backend/categoria/serializers.py - VERSIÓN SIMPLIFICADA
from rest_framework import serializers
from catalogo.models import AppkioskoCategorias, AppkioskoProductos, AppkioskoIngredientes
from comun.models import AppkioskoImagen
import os
from django.conf import settings
import uuid

class CategoriaAdminSerializer(serializers.ModelSerializer):
    """Serializer específico para administración de categorías"""
    imagen = serializers.ImageField(write_only=True, required=False)
    imagen_url = serializers.SerializerMethodField(read_only=True)
    productos_count = serializers.SerializerMethodField(read_only=True)
    ingredientes_count = serializers.SerializerMethodField(read_only=True)
    puede_eliminar = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AppkioskoCategorias
        fields = [
            'id', 'nombre',  # ✅ SOLO campos que existen en el modelo
            'imagen', 'imagen_url', 
            'productos_count', 'ingredientes_count', 'puede_eliminar',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'imagen_url', 
                           'productos_count', 'ingredientes_count', 'puede_eliminar')

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

    def get_productos_count(self, obj):
        """Cuenta productos asociados a esta categoría"""
        return AppkioskoProductos.objects.filter(categoria=obj).count()

    def get_ingredientes_count(self, obj):
        """Cuenta ingredientes asociados a esta categoría"""
        return AppkioskoIngredientes.objects.filter(
            categoria_producto__iexact=obj.nombre
        ).count()

    def get_puede_eliminar(self, obj):
        """Determina si la categoría puede ser eliminada"""
        productos_count = self.get_productos_count(obj)
        ingredientes_count = self.get_ingredientes_count(obj)
        return productos_count == 0 and ingredientes_count == 0

    def validate_nombre(self, value):
        """Validar que el nombre sea único"""
        instance = getattr(self, 'instance', None)
        
        if instance is None or instance.nombre.lower() != value.lower():
            if AppkioskoCategorias.objects.filter(nombre__iexact=value).exists():
                raise serializers.ValidationError(
                    f'Ya existe una categoría con el nombre "{value}"'
                )
        return value

    def create(self, validated_data):
        imagen = validated_data.pop('imagen', None)
        categoria = AppkioskoCategorias.objects.create(**validated_data)
        
        print(f"✅ Categoría creada: ID={categoria.id}, Nombre={categoria.nombre}")
        
        if imagen:
            self._crear_imagen_categoria(categoria, imagen)
            
        return categoria

    def update(self, instance, validated_data):
        imagen = validated_data.pop('imagen', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if imagen:
            self._actualizar_imagen_categoria(instance, imagen)
            
        return instance

    def _crear_imagen_categoria(self, categoria, imagen):
        """Crea y guarda la imagen de la categoría"""
        try:
            categorias_dir = os.path.join(settings.MEDIA_ROOT, 'categorias')
            os.makedirs(categorias_dir, exist_ok=True)
            
            extension = imagen.name.split('.')[-1] if '.' in imagen.name else 'jpg'
            nombre_archivo = f"categoria_{categoria.id}_{uuid.uuid4().hex[:8]}.{extension}"
            
            ruta_fisica = os.path.join(categorias_dir, nombre_archivo)
            with open(ruta_fisica, 'wb+') as destination:
                for chunk in imagen.chunks():
                    destination.write(chunk)
            
            ruta_relativa = f"/media/categorias/{nombre_archivo}"
            AppkioskoImagen.objects.create(
                ruta=ruta_relativa,
                categoria_imagen='categorias',
                entidad_relacionada_id=categoria.id
            )
            
            print(f"📸 Imagen de categoría guardada: {ruta_relativa}")
            return ruta_relativa
            
        except Exception as e:
            print(f"❌ Error al guardar imagen de categoría: {str(e)}")
            return None

    def _actualizar_imagen_categoria(self, instance, imagen):
        """Actualiza la imagen de la categoría"""
        try:
            imagen_anterior = AppkioskoImagen.objects.get(
                categoria_imagen='categorias',
                entidad_relacionada_id=instance.id
            )
            if imagen_anterior.ruta:
                ruta_fisica = os.path.join(settings.MEDIA_ROOT, imagen_anterior.ruta.lstrip('/media/'))
                if os.path.exists(ruta_fisica):
                    os.remove(ruta_fisica)
            imagen_anterior.delete()
        except AppkioskoImagen.DoesNotExist:
            pass
        
        self._crear_imagen_categoria(instance, imagen)