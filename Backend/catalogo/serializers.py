from rest_framework import serializers
from .models import (
    AppkioskoProductos, 
    AppkioskoCategorias, 
    AppkioskoIngredientes, 
    AppkioskoProductosIngredientes
)
from comun.models import AppkioskoImagen, AppkioskoEstados
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import json
import os
import uuid

class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    estado_nombre = serializers.CharField(source='estado.descripcion', read_only=True)
    imagen_url = serializers.SerializerMethodField()
    ingredientes = serializers.CharField(write_only=True, required=False, allow_blank=True)
    ingredientes_detalle = serializers.SerializerMethodField()
    imagen = serializers.ImageField(write_only=True, required=False)
    
    class Meta:
        model = AppkioskoProductos
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 
            'categoria', 'categoria_nombre', 'estado', 'estado_nombre',
            'imagen_url', 'ingredientes', 'ingredientes_detalle', 'imagen',
            'created_at', 'updated_at'
        ]

    def get_imagen_url(self, obj):
        """Obtiene la URL de la imagen del producto"""
        try:
            imagen = AppkioskoImagen.objects.get(
                categoria_imagen='productos',
                entidad_relacionada_id=obj.id
            )
            return imagen.ruta
        except AppkioskoImagen.DoesNotExist:
            return None

    def get_ingredientes_detalle(self, obj):
        """Obtiene los ingredientes asociados al producto"""
        try:
            ingredientes_producto = AppkioskoProductosIngredientes.objects.filter(
                producto=obj
            ).select_related('ingrediente')
            
            resultado = []
            for pi in ingredientes_producto:
                # Obtener imagen del ingrediente
                try:
                    img_ingrediente = AppkioskoImagen.objects.get(
                        categoria_imagen='ingredientes',
                        entidad_relacionada_id=pi.ingrediente.id
                    )
                    img_url = img_ingrediente.ruta
                except AppkioskoImagen.DoesNotExist:
                    img_url = None
                
                resultado.append({
                    'id': pi.ingrediente.id,
                    'nombre': pi.ingrediente.nombre,
                    'descripcion': pi.ingrediente.descripcion,
                    'categoria_producto': pi.ingrediente.categoria_producto,
                    'es_base': pi.es_base,
                    'permite_extra': pi.permite_extra,
                    'imagen_url': img_url
                })
            
            return resultado
        except Exception:
            return []

    def validate_ingredientes(self, value):
        """Valida el JSON de ingredientes"""
        if not value:
            return []
        
        try:
            ingredientes_ids = json.loads(value)
            if not isinstance(ingredientes_ids, list):
                raise serializers.ValidationError("Los ingredientes deben ser una lista de IDs")
            
            # Validar que todos los IDs existan
            for ing_id in ingredientes_ids:
                if not isinstance(ing_id, int):
                    raise serializers.ValidationError(f"ID de ingrediente inválido: {ing_id}")
                
                if not AppkioskoIngredientes.objects.filter(id=ing_id).exists():
                    raise serializers.ValidationError(f"Ingrediente con ID {ing_id} no existe")
            
            return ingredientes_ids
            
        except json.JSONDecodeError:
            raise serializers.ValidationError("Formato JSON inválido para ingredientes")

    def create(self, validated_data):
        """Crear producto con ingredientes e imagen"""
        # Extraer datos especiales
        ingredientes_ids = validated_data.pop('ingredientes', [])
        imagen = validated_data.pop('imagen', None)
        
        # Crear el producto
        producto = AppkioskoProductos.objects.create(**validated_data)
        print(f"✅ Producto creado: {producto.nombre} (ID: {producto.id})")
        
        # Procesar ingredientes
        if ingredientes_ids:
            count_ingredientes = self._crear_ingredientes_producto(producto, ingredientes_ids)
            print(f"🥗 {count_ingredientes} ingredientes asociados")
        
        # Procesar imagen
        if imagen:
            imagen_url = self._crear_imagen_producto(producto, imagen)
            if imagen_url:
                print(f"📸 Imagen guardada: {imagen_url}")
        
        return producto

    def _crear_ingredientes_producto(self, producto, ingredientes_ids):
        """Crea las relaciones producto-ingrediente"""
        count = 0
        for ingrediente_id in ingredientes_ids:
            try:
                ingrediente = AppkioskoIngredientes.objects.get(id=ingrediente_id)
                
                # Evitar duplicados
                if not AppkioskoProductosIngredientes.objects.filter(
                    producto=producto, ingrediente=ingrediente
                ).exists():
                    AppkioskoProductosIngredientes.objects.create(
                        producto=producto,
                        ingrediente=ingrediente,
                        es_base=True,
                        permite_extra=False
                    )
                    print(f"   ✅ {ingrediente.nombre}")
                    count += 1
                else:
                    print(f"   ⚠️ {ingrediente.nombre} (ya existe)")
                    
            except AppkioskoIngredientes.DoesNotExist:
                print(f"   ❌ Ingrediente ID {ingrediente_id} no existe")
            except Exception as e:
                print(f"   ❌ Error con ingrediente {ingrediente_id}: {str(e)}")
        
        return count

    def _crear_imagen_producto(self, producto, imagen):
        """Crea y guarda la imagen del producto"""
        try:
            # Crear directorio
            productos_dir = os.path.join(settings.MEDIA_ROOT, 'productos')
            os.makedirs(productos_dir, exist_ok=True)
            
            # Generar nombre único
            extension = imagen.name.split('.')[-1] if '.' in imagen.name else 'jpg'
            nombre_archivo = f"producto_{producto.id}_{uuid.uuid4().hex[:8]}.{extension}"
            
            # Guardar archivo físico
            ruta_fisica = os.path.join(productos_dir, nombre_archivo)
            with open(ruta_fisica, 'wb+') as destination:
                for chunk in imagen.chunks():
                    destination.write(chunk)
            
            # Guardar en BD
            ruta_relativa = f"/media/productos/{nombre_archivo}"
            AppkioskoImagen.objects.create(
                ruta=ruta_relativa,
                categoria_imagen='productos',
                entidad_relacionada_id=producto.id
            )
            
            return ruta_relativa
            
        except Exception as e:
            print(f"❌ Error al guardar imagen: {str(e)}")
            return None

class CategoriaSerializer(serializers.ModelSerializer):
    imagen = serializers.ImageField(write_only=True, required=False)
    imagen_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AppkioskoCategorias
        fields = [
            'id', 'nombre', 'imagen', 'imagen_url', 'created_at', 'updated_at'
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
            
            print(f"📸 Imagen de categoría guardada: {relative_path}")

        return categoria

# ← AGREGAR SERIALIZER PARA INGREDIENTES
class IngredienteSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AppkioskoIngredientes
        fields = ['id', 'nombre', 'descripcion', 'categoria_producto', 'imagen_url']
    
    def get_imagen_url(self, obj):
        try:
            imagen = AppkioskoImagen.objects.get(
                categoria_imagen='ingredientes',
                entidad_relacionada_id=obj.id
            )
            return imagen.ruta
        except AppkioskoImagen.DoesNotExist:
            return None