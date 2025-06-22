from rest_framework import serializers
from .models import (
    AppkioskoProductos, 
    AppkioskoCategorias, 
    AppkioskoIngredientes, 
    AppkioskoProductosIngredientes,
    AppkioskoMenus, 
    AppkioskoMenuproductos,
    # Nuevos modelos
    AppkioskoTamanos,
    AppkioskoProductoTamanos
)
from comun.models import AppkioskoImagen, AppkioskoEstados
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import json
import os
import uuid
from django.db import connection

# Nuevo serializer para tamaños
class TamanoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoTamanos
        fields = ['id', 'nombre', 'codigo', 'orden', 'activo']

# Nuevo serializer para la relación producto-tamaño-precio
class ProductoTamanoSerializer(serializers.ModelSerializer):
    nombre_tamano = serializers.CharField(source='tamano.nombre', read_only=True)
    codigo_tamano = serializers.CharField(source='tamano.codigo', read_only=True)
    
    class Meta:
        model = AppkioskoProductoTamanos
        fields = ['id', 'tamano', 'nombre_tamano', 'codigo_tamano', 'precio', 'activo']

class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    estado_nombre = serializers.CharField(source='estado.descripcion', read_only=True)
    imagen_url = serializers.SerializerMethodField()
    activo = serializers.SerializerMethodField()

    ingredientes = serializers.CharField(write_only=True, required=False, allow_blank=True)
    ingredientes_detalle = serializers.SerializerMethodField()
    imagen = serializers.ImageField(write_only=True, required=False)
    
    # Nuevos campos para tamaños
    aplica_tamanos = serializers.BooleanField(default=False)
    precios_tamanos = serializers.JSONField(write_only=True, required=False)
    tamanos_detalle = serializers.SerializerMethodField()
    
    class Meta:
        model = AppkioskoProductos
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 
            'categoria', 'categoria_nombre', 'estado', 'estado_nombre','activo',
            'imagen_url', 'ingredientes', 'ingredientes_detalle', 'imagen',
            'aplica_tamanos', 'precios_tamanos', 'tamanos_detalle',  # Nuevos campos
            'created_at', 'updated_at'
        ]

    # ✅ AGREGAR ESTE MÉTODO
    def get_precio_base(self, obj):
        """
        Obtiene el precio base del producto.
        Si aplica tamaños, devuelve el precio del tamaño más pequeño.
        Si no, devuelve el precio normal.
        """
        if obj.aplica_tamanos:
            # Buscar el precio del tamaño más pequeño (menor orden)
            precio_tamano = AppkioskoProductoTamanos.objects.filter(
                producto=obj,
                activo=True
            ).select_related('tamano').order_by('tamano__orden').first()
            
            if precio_tamano:
                return float(precio_tamano.precio)
        
        return float(obj.precio)


    # ✅ MÉTODO PARA CALCULAR SI ESTÁ ACTIVO
    def get_activo(self, obj):
        """Determina si el producto está activo basándose en el estado"""
        try:
            # Si tienes relación directa con estados
            if hasattr(obj, 'estado') and obj.estado:
                return getattr(obj.estado, 'is_active', False) == 1
            
            # Fallback: considerar activo si estado es 4 (según tu tabla)
            return obj.estado == 4
            
        except Exception as e:
            print(f"Error calculando activo para producto {obj.id}: {e}")
            return False


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
                    'cantidad': pi.cantidad,
                    'imagen_url': img_url
                })
            
            return resultado
        except Exception:
            return []

    # Nuevo método para obtener los tamaños y precios del producto
    def get_tamanos_detalle(self, obj):
        """Obtiene los tamaños y precios asociados al producto"""
        if not obj.aplica_tamanos:
            return []
        
        tamanos = AppkioskoProductoTamanos.objects.filter(
            producto=obj, activo=True
        ).select_related('tamano')
        
        return ProductoTamanoSerializer(tamanos, many=True).data

    def create(self, validated_data):
        """Crear producto con ingredientes, imagen y tamaños"""
        # Extraer datos especiales
        # ✅ CAMBIO: Cambiar nombre de variable para ser más claro
        ingredientes_data = validated_data.pop('ingredientes', [])
        imagen = validated_data.pop('imagen', None)
        precios_tamanos = validated_data.pop('precios_tamanos', None)
        
        # ✅ CAMBIO: Procesar ingredientes_data si viene como string JSON
        if isinstance(ingredientes_data, str):
            try:
                ingredientes_data = json.loads(ingredientes_data)
                print(f"🔍 Ingredientes parseados desde JSON: {ingredientes_data}")
            except json.JSONDecodeError:
                print(f"❌ Error parseando JSON de ingredientes: {ingredientes_data}")
                ingredientes_data = []
        
        # Crear el producto
        producto = AppkioskoProductos.objects.create(**validated_data)
        print(f"✅ Producto creado: {producto.nombre} (ID: {producto.id})")
        
        # ✅ CAMBIO: Usar ingredientes_data en lugar de ingredientes_ids
        if ingredientes_data:
            count_ingredientes = self._crear_ingredientes_producto(producto, ingredientes_data)
            print(f"🥗 {count_ingredientes} ingredientes asociados")
        
        # Procesar imagen (código existente)
        if imagen:
            imagen_url = self._crear_imagen_producto(producto, imagen)
            if imagen_url:
                print(f"📸 Imagen guardada: {imagen_url}")
        
        # Nuevo: Procesar tamaños y precios
        if producto.aplica_tamanos and precios_tamanos:
            self._guardar_precios_tamanos(producto, json.loads(precios_tamanos) if isinstance(precios_tamanos, str) else precios_tamanos)
            print(f"📏 Precios por tamaño guardados")
        
        return producto

    def update(self, instance, validated_data):
        """Actualizar producto with ingredientes, imagen y tamaños"""
        print(f"🔄 Actualizando producto: {instance.nombre}")
        
        # 🔧 GUARDAR CATEGORÍA ORIGINAL ANTES DE ACTUALIZAR
        categoria_original = instance.categoria.nombre if instance.categoria else None
        
        # Extraer datos especiales ANTES de actualizar el producto
        # ✅ CAMBIO: Cambiar nombre de variable para ser más claro
        ingredientes_data = validated_data.pop('ingredientes', None)
        imagen = validated_data.pop('imagen', None)
        precios_tamanos = validated_data.pop('precios_tamanos', None)
        
        # ✅ CAMBIO: Procesar ingredientes_data si viene como string JSON
        if isinstance(ingredientes_data, str):
            try:
                ingredientes_data = json.loads(ingredientes_data)
                print(f"🔍 Ingredientes parseados desde JSON: {ingredientes_data}")
            except json.JSONDecodeError:
                print(f"❌ Error parseando JSON de ingredientes: {ingredientes_data}")
                ingredientes_data = None
        
        print(f"🥗 Ingredientes recibidos para actualizar: {ingredientes_data}")
        
        # Actualizar campos básicos del producto
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        print(f"✅ Campos básicos actualizados")
        
        # 🔧 DETECTAR CAMBIO DE CATEGORÍA COMPARANDO ANTES/DESPUÉS
        categoria_nueva = instance.categoria.nombre if instance.categoria else None
        cambio_categoria = (
            categoria_original != categoria_nueva and 
            categoria_original in ['hamburguesas', 'pizzas'] and 
            categoria_nueva in ['hamburguesas', 'pizzas']
        )
        
        if cambio_categoria:
            print(f"🔄 CAMBIO DE CATEGORÍA DETECTADO: {categoria_original} → {categoria_nueva}")
        
        # 🆕 ACTUALIZACIÓN INTELIGENTE DE INGREDIENTES
        # ✅ CAMBIO: Usar ingredientes_data en lugar de ingredientes_ids
        if ingredientes_data is not None:
            print(f"🥗 Actualizando ingredientes de forma inteligente...")
            self._actualizar_ingredientes_inteligente(instance, ingredientes_data, cambio_categoria)
        else:
            print(f"🥗 No se enviaron ingredientes para actualizar")
        
        # Actualizar imagen si se proporcionó
        if imagen:
            print(f"📸 Actualizando imagen...")
            self._actualizar_imagen(instance, imagen)
        
        # Nuevo: Actualizar precios por tamaño
        if precios_tamanos is not None:
            print(f"📏 Actualizando precios por tamaño...")
            self._guardar_precios_tamanos(
                instance, 
                json.loads(precios_tamanos) if isinstance(precios_tamanos, str) else precios_tamanos
            )
        
        print(f"✅ Producto {instance.nombre} actualizado completamente")
        return instance

    # Nuevo método para guardar los precios por tamaño
    def _guardar_precios_tamanos(self, producto, precios_dict):
        """Guarda los precios por tamaño del producto"""
        # Eliminar precios anteriores
        AppkioskoProductoTamanos.objects.filter(producto=producto).delete()
        
        # Crear registros para cada tamaño
        for tamano_nombre, precio in precios_dict.items():
            # Mapear nombres a códigos
            codigo_tamano = {
                'pequeño': 'P', 
                'mediano': 'M', 
                'grande': 'G'
            }.get(tamano_nombre.lower())
            
            if codigo_tamano and precio:
                try:
                    tamano = AppkioskoTamanos.objects.get(codigo=codigo_tamano)
                    AppkioskoProductoTamanos.objects.create(
                        producto=producto,
                        tamano=tamano,
                        precio=float(precio)
                    )
                    print(f"   ✅ Guardado precio {precio} para tamaño {tamano.nombre}")
                except (AppkioskoTamanos.DoesNotExist, ValueError) as e:
                    print(f"   ❌ Error guardando precio para {tamano_nombre}: {e}")
    
    # Mantener los métodos existentes sin cambios
    def _obtener_siguiente_id_disponible(self):
        """Busca el próximo ID disponible en toda la tabla"""
        ultimo_id = AppkioskoProductosIngredientes.objects.aggregate(
            max_id=models.Max('id')
        )['max_id'] or 0
        
        # Buscar huecos en la secuencia
        for i in range(1, ultimo_id + 2):
            if not AppkioskoProductosIngredientes.objects.filter(id=i).exists():
                return i
        
        return ultimo_id + 1

    def _crear_relacion_con_id_optimizado(self, producto, ingrediente):
        """Crea relación reutilizando IDs eliminados"""
        try:
            # Intentar usar un ID específico (requiere SQL crudo)
            next_id = self._obtener_siguiente_id_disponible()
            
            # Crear la relación
            relacion = AppkioskoProductosIngredientes.objects.create(
                producto=producto,
                ingrediente=ingrediente,
                es_base=True,
                permite_extra=False
            )
            
            return relacion
        except Exception as e:
            print(f"❌ Error creando con ID optimizado: {e}")
            return None


    def _inferir_categoria_anterior(self, ingredientes_actuales_ids):
        """Infiere la categoría anterior basándose en los ingredientes actuales"""
        if not ingredientes_actuales_ids:
            return None
        
        try:
            ingredientes = AppkioskoIngredientes.objects.filter(id__in=ingredientes_actuales_ids)
            categorias = ingredientes.values_list('categoria_producto', flat=True)
            
            # Contar ocurrencias de cada categoría
            conteo_categorias = {}
            for cat in categorias:
                conteo_categorias[cat] = conteo_categorias.get(cat, 0) + 1
            
            # Retornar la categoría más común
            if conteo_categorias:
                return max(conteo_categorias, key=conteo_categorias.get)
            
            return None
        except Exception:
            return None


    def _actualizar_ingredientes_inteligente(self, producto, nuevos_ingredientes_data, cambio_categoria=False):
        """
        ✅ MEJORADO: Actualizar ingredientes con es_base dinámico
        """
        print(f"🔄 Actualizando ingredientes para producto {producto.nombre}")
        print(f"   Nuevos datos: {nuevos_ingredientes_data}")
        print(f"   Cambio de categoría: {cambio_categoria}")  # ✅ NUEVO LOG
        
        # Obtener ingredientes actuales
        ingredientes_actuales = AppkioskoProductosIngredientes.objects.filter(producto=producto)
        print(f"   Ingredientes actuales: {ingredientes_actuales.count()}")
        
        # Crear mapas para comparación
        actuales_map = {rel.ingrediente_id: rel for rel in ingredientes_actuales}
        nuevos_map = {ing['id']: ing for ing in nuevos_ingredientes_data}
        
        # IDs actuales y nuevos
        ids_actuales = set(actuales_map.keys())
        ids_nuevos = set(nuevos_map.keys())
        
        print(f"   IDs actuales: {ids_actuales}")
        print(f"   IDs nuevos: {ids_nuevos}")
        
        # 1. Eliminar ingredientes que ya no están
        ids_a_eliminar = ids_actuales - ids_nuevos
        if ids_a_eliminar:
            eliminados = AppkioskoProductosIngredientes.objects.filter(
                producto=producto,
                ingrediente_id__in=ids_a_eliminar
            ).delete()
            print(f"   ❌ Eliminados: {eliminados[0]} ingredientes con IDs {ids_a_eliminar}")
        
        # 2. Actualizar ingredientes existentes
        ids_a_actualizar = ids_actuales & ids_nuevos
        for ingrediente_id in ids_a_actualizar:
            relacion_actual = actuales_map[ingrediente_id]
            datos_nuevos = nuevos_map[ingrediente_id]
            
            nueva_cantidad = datos_nuevos.get('cantidad', 1)
            nuevo_es_base = datos_nuevos.get('es_base', False)  # ✅ OBTENER es_base del frontend
            
            # Verificar si necesita actualización
            if (relacion_actual.cantidad != nueva_cantidad or 
                relacion_actual.es_base != nuevo_es_base):
                
                relacion_actual.cantidad = nueva_cantidad
                relacion_actual.es_base = nuevo_es_base  # ✅ ACTUALIZAR es_base
                relacion_actual.save()
                
                print(f"   🔄 Actualizado: {relacion_actual.ingrediente.nombre} - Cantidad: {nueva_cantidad} - es_base: {nuevo_es_base}")
        
        # 3. Agregar nuevos ingredientes
        ids_a_agregar = ids_nuevos - ids_actuales
        for ingrediente_id in ids_a_agregar:
            datos_ingrediente = nuevos_map[ingrediente_id]
            cantidad = datos_ingrediente.get('cantidad', 1)
            es_base = datos_ingrediente.get('es_base', False)  # ✅ OBTENER es_base del frontend
            
            try:
                ingrediente = AppkioskoIngredientes.objects.get(id=ingrediente_id)
                
                # ✅ CAMBIO PRINCIPAL: Usar es_base del frontend
                relacion = AppkioskoProductosIngredientes.objects.create(
                    producto=producto,
                    ingrediente=ingrediente,
                    es_base=es_base,      # ✅ USAR VALOR DEL FRONTEND
                    permite_extra=True,   # Permitir extras
                    cantidad=cantidad
                )
                
                print(f"   ✅ Agregado: {ingrediente.nombre} - Cantidad: {cantidad} - es_base: {es_base} - Relación: {relacion.id}")
                
            except AppkioskoIngredientes.DoesNotExist:
                print(f"   ❌ Ingrediente con ID {ingrediente_id} no encontrado")
                continue
        
        # Resumen final
        ingredientes_final = AppkioskoProductosIngredientes.objects.filter(producto=producto)
        count_base = ingredientes_final.filter(es_base=True).count()
        count_opcional = ingredientes_final.filter(es_base=False).count()
        
        print(f"📊 Resumen final:")
        print(f"   Total ingredientes: {ingredientes_final.count()}")
        print(f"   Ingredientes base: {count_base}")
        print(f"   Ingredientes opcionales: {count_opcional}")
        
        return ingredientes_final.count()
            

    def _detectar_cambio_categoria(self, producto, ingredientes_actuales_ids, nuevos_ingredientes_ids_set):
        """Detecta si hubo un cambio de categoría basándose en los ingredientes"""
        if not ingredientes_actuales_ids:
            return False
        
        try:
            # Obtener categorías de los ingredientes actuales
            ingredientes_actuales = AppkioskoIngredientes.objects.filter(id__in=ingredientes_actuales_ids)
            categorias_actuales = set(ingredientes_actuales.values_list('categoria_producto', flat=True))
            
            # Obtener categorías de los nuevos ingredientes
            ingredientes_nuevos = AppkioskoIngredientes.objects.filter(id__in=nuevos_ingredientes_ids_set)
            categorias_nuevas = set(ingredientes_nuevos.values_list('categoria_producto', flat=True))
            
            print(f"   🔍 Categorías actuales de ingredientes: {categorias_actuales}")
            print(f"   🔍 Categorías nuevas de ingredientes: {categorias_nuevas}")
            
            # ✅ NUEVO: Obtener categorías dinámicamente de la DB
            from .models import AppkioskoCategorias
            categorias_db = AppkioskoCategorias.objects.filter(activo=True).values_list('nombre', flat=True)
            categorias_principales = set()
            
            for categoria in categorias_db:
                categoria_lower = categoria.lower()
                categorias_principales.add(categoria_lower)
                # Agregar variaciones comunes (singular/plural)
                if categoria_lower.endswith('s'):
                    categorias_principales.add(categoria_lower[:-1])  # sin la 's'
                else:
                    categorias_principales.add(categoria_lower + 's')  # con 's'
            
            print(f"   📊 Categorías principales obtenidas de DB: {categorias_principales}")
            
            # Si las categorías son completamente diferentes Y ambas son principales, es un cambio
            if (categorias_actuales and categorias_nuevas and 
                not (categorias_actuales & categorias_nuevas) and
                any(cat.lower() in categorias_principales for cat in categorias_actuales) and
                any(cat.lower() in categorias_principales for cat in categorias_nuevas)):
                return True
                
            return False
            
        except Exception as e:
            print(f"   ❌ Error detectando cambio de categoría: {str(e)}")
            return False
            

    def _actualizar_imagen(self, instance, imagen):
        """Actualiza la imagen del producto"""
        try:
            # Eliminar imagen anterior
            imagen_anterior = AppkioskoImagen.objects.get(
                categoria_imagen='productos',
                entidad_relacionada_id=instance.id
            )
            # Eliminar archivo físico anterior
            if imagen_anterior.ruta:
                ruta_fisica = os.path.join(settings.MEDIA_ROOT, imagen_anterior.ruta.lstrip('/media/'))
                if os.path.exists(ruta_fisica):
                    os.remove(ruta_fisica)
                    print(f"   🗑️ Archivo físico anterior eliminado")
            imagen_anterior.delete()
            print(f"   🗑️ Registro de imagen anterior eliminado")
        except AppkioskoImagen.DoesNotExist:
            print(f"   📝 No había imagen anterior")
        
        # Crear nueva imagen
        imagen_url = self._crear_imagen_producto(instance, imagen)
        if imagen_url:
            print(f"   📸 Nueva imagen guardada: {imagen_url}")

    def _crear_ingredientes_producto(self, producto, ingredientes_data):
        """
        ✅ MEJORADO: Crear relaciones ingrediente-producto con es_base dinámico
        """
        print(f"🔧 Creando relaciones para producto {producto.nombre}")
        print(f"   Datos de ingredientes a procesar: {ingredientes_data}")
        
        relaciones_creadas = 0
        
        for ingrediente_data in ingredientes_data:
            ingrediente_id = ingrediente_data.get('id')
            cantidad = ingrediente_data.get('cantidad', 1)
            es_base = ingrediente_data.get('es_base', False)  # ✅ OBTENER es_base del frontend
            
            print(f"   Procesando ingrediente ID {ingrediente_id} con cantidad {cantidad} y es_base {es_base}")
            
            try:
                ingrediente = AppkioskoIngredientes.objects.get(id=ingrediente_id)
                
                # ✅ CAMBIO PRINCIPAL: Usar es_base del frontend
                relacion = AppkioskoProductosIngredientes.objects.create(
                    producto=producto,
                    ingrediente=ingrediente,
                    es_base=es_base,           # ✅ USAR VALOR DEL FRONTEND
                    permite_extra=True,        # Siempre permitir extras
                    cantidad=cantidad
                )
                
                relaciones_creadas += 1
                print(f"   ✅ {ingrediente.nombre} (ID: {ingrediente_id}) - Cantidad: {cantidad} - es_base: {es_base} - Relación creada: {relacion.id}")
                
            except AppkioskoIngredientes.DoesNotExist:
                print(f"   ❌ Ingrediente con ID {ingrediente_id} no encontrado")
                continue
        
        print(f"🎯 Total de relaciones creadas: {relaciones_creadas}")
        return relaciones_creadas


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
    imagen = serializers.ImageField(write_only=True, required=False)
    
    class Meta:
        model = AppkioskoIngredientes
        fields = [
            'id', 'nombre', 'descripcion', 'categoria_producto', 
            'precio_adicional', 'stock', 'stock_minimo', 
            'unidad_medida', 'estado', 'imagen', 'imagen_url',
            'created_at', 'updated_at'
        ]
    
    def get_imagen_url(self, obj):
        """✅ CORREGIDO: Buscar en AppkioskoImagen igual que productos"""
        try:
            imagen = AppkioskoImagen.objects.get(
                categoria_imagen='ingredientes',
                entidad_relacionada_id=obj.id
            )
            return imagen.ruta  # ← Igual que productos, retorna solo la ruta
        except AppkioskoImagen.DoesNotExist:
            # Fallback al campo directo si no existe en AppkioskoImagen
            if obj.imagen:
                return obj.imagen.url
            return None
    
    def create(self, validated_data):
        """Crear ingrediente y guardar imagen en AppkioskoImagen"""
        print("🔍 [SERIALIZER CREATE] Datos recibidos:", list(validated_data.keys()))
        
        imagen = validated_data.pop('imagen', None)
        
        if imagen:
            print("✅ [SERIALIZER CREATE] Imagen encontrada en validated_data")
            print("📸 [SERIALIZER CREATE] Tipo de imagen:", type(imagen))
        else:
            print("❌ [SERIALIZER CREATE] NO se encontró imagen en validated_data")
        
        # Crear el ingrediente
        ingrediente = super().create(validated_data)
        print(f"✅ Ingrediente creado: {ingrediente.nombre} (ID: {ingrediente.id})")
        
        # Guardar imagen en AppkioskoImagen igual que productos
        if imagen:
            imagen_url = self._crear_imagen_ingrediente(ingrediente, imagen)
            if imagen_url:
                print(f"📸 Imagen guardada: {imagen_url}")
        
        return ingrediente
    
    def update(self, instance, validated_data):
        """Actualizar ingrediente y su imagen"""
        print("🔍 [SERIALIZER UPDATE] Datos recibidos:", list(validated_data.keys()))
        
        imagen = validated_data.pop('imagen', None)
        
        if imagen:
            print("✅ [SERIALIZER UPDATE] Imagen encontrada en validated_data")
            print("📸 [SERIALIZER UPDATE] Tipo de imagen:", type(imagen))
        else:
            print("❌ [SERIALIZER UPDATE] NO se encontró imagen en validated_data")
        
        # Actualizar campos básicos
        instance = super().update(instance, validated_data)
        
        # Actualizar imagen si se proporcionó
        if imagen:
            self._actualizar_imagen_ingrediente(instance, imagen)
        
        return instance
    
    def _crear_imagen_ingrediente(self, ingrediente, imagen):
        """Crea y guarda la imagen del ingrediente en AppkioskoImagen"""
        try:
            # Crear directorio si no existe
            ingredientes_dir = os.path.join(settings.MEDIA_ROOT, 'ingredientes')
            os.makedirs(ingredientes_dir, exist_ok=True)
            
            # Generar nombre único
            extension = imagen.name.split('.')[-1] if '.' in imagen.name else 'png'
            nombre_archivo = f"ingrediente_{ingrediente.id}_{uuid.uuid4().hex[:8]}.{extension}"
            
            # Guardar archivo físico
            ruta_fisica = os.path.join(ingredientes_dir, nombre_archivo)
            with open(ruta_fisica, 'wb+') as destination:
                for chunk in imagen.chunks():
                    destination.write(chunk)
            
            # Guardar en AppkioskoImagen
            ruta_relativa = f"/media/ingredientes/{nombre_archivo}"
            AppkioskoImagen.objects.create(
                ruta=ruta_relativa,
                categoria_imagen='ingredientes',
                entidad_relacionada_id=ingrediente.id
            )
            
            return ruta_relativa
            
        except Exception as e:
            print(f"❌ Error al guardar imagen de ingrediente: {str(e)}")
            return None
    
    def _actualizar_imagen_ingrediente(self, instance, imagen):
        """Actualiza la imagen del ingrediente"""
        try:
            # Eliminar imagen anterior de AppkioskoImagen
            imagen_anterior = AppkioskoImagen.objects.get(
                categoria_imagen='ingredientes',
                entidad_relacionada_id=instance.id
            )
            if imagen_anterior.ruta:
                ruta_fisica = os.path.join(settings.MEDIA_ROOT, imagen_anterior.ruta.lstrip('/media/'))
                if os.path.exists(ruta_fisica):
                    os.remove(ruta_fisica)
            imagen_anterior.delete()
            print(f"   🗑️ Imagen anterior eliminada")
        except AppkioskoImagen.DoesNotExist:
            print(f"   📝 No había imagen anterior")
        
        # Crear nueva imagen
        imagen_url = self._crear_imagen_ingrediente(instance, imagen)
        if imagen_url:
            print(f"   📸 Nueva imagen guardada: {imagen_url}")

class MenuProductoDetalleSerializer(serializers.ModelSerializer):
    """Detalle de productos dentro de un menú"""
    nombre = serializers.CharField(source='producto.nombre', read_only=True)
    descripcion = serializers.CharField(source='producto.descripcion', read_only=True)
    precio = serializers.DecimalField(source='producto.precio', max_digits=10, decimal_places=2, read_only=True)
    imagen_url = serializers.SerializerMethodField()
    # ✅ SOLO AGREGAR estos campos
    tamano_nombre = serializers.CharField(source='tamano.nombre', read_only=True, allow_null=True)
    tamano_codigo = serializers.CharField(source='tamano.codigo', read_only=True, allow_null=True)

    class Meta:
        model = AppkioskoMenuproductos
        fields = [
            'id', 'producto', 'nombre', 'descripcion', 'precio', 'cantidad', 'imagen_url',
            'tamano_nombre', 'tamano_codigo'  # ✅ SOLO AGREGAR estos
        ]
    
    def get_imagen_url(self, obj):
        try:
            imagen = AppkioskoImagen.objects.get(
                categoria_imagen='productos',
                entidad_relacionada_id=obj.producto.id
            )
            return imagen.ruta
        except AppkioskoImagen.DoesNotExist:
            return None

class MenuSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.CharField(source='estado.descripcion', read_only=True)
    activo = serializers.SerializerMethodField()

    productos_detalle = serializers.SerializerMethodField()
    imagen_url = serializers.SerializerMethodField()
    imagen = serializers.ImageField(write_only=True, required=False)
    productos = serializers.ListField(write_only=True, required=False) 

    class Meta:
        model = AppkioskoMenus
        fields = [
            'id', 'nombre', 'descripcion', 'precio',
            'tipo_menu', 'estado', 'estado_nombre','activo',
            'productos', 'productos_detalle', 'imagen', 'imagen_url',
            'created_at', 'updated_at'
        ]


    # ✅ MÉTODO PARA CALCULAR SI EL MENÚ ESTÁ ACTIVO
    def get_activo(self, obj):
        """Determina si el menú está activo basándose en el estado"""
        try:
            if hasattr(obj, 'estado') and obj.estado:
                return getattr(obj.estado, 'is_active', False) == 1
            return obj.estado == 4
        except Exception as e:
            print(f"Error calculando activo para menú {obj.id}: {e}")
            return False


    def get_imagen_url(self, obj):
        try:
            imagen = AppkioskoImagen.objects.get(
                categoria_imagen='menus',
                entidad_relacionada_id=obj.id
            )
            return imagen.ruta
        except AppkioskoImagen.DoesNotExist:
            return None

    def get_productos_detalle(self, obj):
        productos_rel = AppkioskoMenuproductos.objects.filter(menu=obj).select_related('producto', 'tamano') 
        return MenuProductoDetalleSerializer(productos_rel, many=True).data

    def to_internal_value(self, data):
        # Reconstruir productos si vienen como productos[0][producto], productos[0][cantidad], productos[0][tamano], etc.
        productos = []
        i = 0
        while True:
            key_producto = f'productos[{i}][producto]'
            key_cantidad = f'productos[{i}][cantidad]'
            key_tamano = f'productos[{i}][tamano]'  # ✅ Ya está bien
            
            if key_producto in data and key_cantidad in data:
                prod_id = data.get(key_producto)
                cantidad = data.get(key_cantidad)
                tamano_id = data.get(key_tamano)  # ✅ Ya está bien
                
                # Si por alguna razón son listas, toma el primer valor
                if isinstance(prod_id, list):
                    prod_id = prod_id[0]
                if isinstance(cantidad, list):
                    cantidad = cantidad[0]
                if isinstance(tamano_id, list):
                    tamano_id = tamano_id[0]
                
                if prod_id is not None and cantidad is not None:
                    producto_data = {'producto': prod_id, 'cantidad': cantidad}
                    # ✅ CORREGIR: Verificar que tamano_id no sea string vacío
                    if tamano_id and tamano_id != '' and tamano_id != 'null':
                        producto_data['tamano'] = tamano_id
                        print(f"DEBUG: Producto {prod_id} con tamaño {tamano_id}")  # ✅ AGREGAR debug
                    else:
                        print(f"DEBUG: Producto {prod_id} sin tamaño")  # ✅ AGREGAR debug
                    productos.append(producto_data)
                i += 1
            else:
                break
        
        print(f"DEBUG productos procesados: {productos}")  # ✅ AGREGAR debug
        
        # Reemplazar en data para que el resto del serializer funcione igual
        mutable_data = data.copy()
        mutable_data['productos'] = productos
        return super().to_internal_value(mutable_data)

    def validate_productos(self, value):
        print("DEBUG productos recibidos en validate_productos:", value)
        # Si value es una lista con una sola lista interna, aplánala
        if isinstance(value, list) and len(value) == 1 and isinstance(value[0], list):
            value = value[0]
        if not value or not isinstance(value, list):
            raise serializers.ValidationError("Debes seleccionar al menos un producto para el menú.")
        for prod in value:
            if not isinstance(prod, dict):
                raise serializers.ValidationError("Formato de producto inválido.")
            if not prod.get('producto') or int(prod.get('cantidad', 0)) < 1:
                raise serializers.ValidationError("Cada producto debe tener un ID válido y cantidad mayor a 0.")
        return value

    def create(self, validated_data):
        productos_data = validated_data.pop('productos', [])
        imagen = validated_data.pop('imagen', None)
        menu = AppkioskoMenus.objects.create(**validated_data)

        for prod in productos_data:
            producto_id = int(prod.get('producto'))
            cantidad = int(prod.get('cantidad', 1))
            tamano_id = prod.get('tamano')  # ✅ AGREGAR esta línea
            
            producto = AppkioskoProductos.objects.get(id=producto_id)
            
            # ✅ MODIFICAR esta línea para incluir tamaño
            menu_producto_data = {
                'menu': menu,
                'producto': producto,
                'cantidad': cantidad
            }
            
            # ✅ AGREGAR tamaño si existe
            if tamano_id:
                tamano = AppkioskoTamanos.objects.get(id=tamano_id)
                menu_producto_data['tamano'] = tamano
                print(f"DEBUG: Guardando producto {producto.nombre} con tamaño {tamano.nombre}")
            else:
                print(f"DEBUG: Guardando producto {producto.nombre} sin tamaño")
            
            AppkioskoMenuproductos.objects.create(**menu_producto_data)

        if imagen:
            self._crear_imagen_menu(menu, imagen)

        return menu

    def update(self, instance, validated_data):
        productos_data = validated_data.pop('productos', None)
        imagen = validated_data.pop('imagen', None)

        # Actualiza los campos de la instancia existente
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Actualizar productos asociados si se envían
        if productos_data is not None:
            AppkioskoMenuproductos.objects.filter(menu=instance).delete()
            for prod in productos_data:
                producto_id = prod.get('producto')
                cantidad = prod.get('cantidad', 1)
                tamano_id = prod.get('tamano')  # ✅ AGREGAR esta línea
                
                producto = AppkioskoProductos.objects.get(id=producto_id)
                
                # ✅ MODIFICAR para incluir tamaño
                menu_producto_data = {
                    'menu': instance,
                    'producto': producto,
                    'cantidad': cantidad
                }
                
                # ✅ AGREGAR tamaño si existe
                if tamano_id:
                    tamano = AppkioskoTamanos.objects.get(id=tamano_id)
                    menu_producto_data['tamano'] = tamano
                    print(f"DEBUG UPDATE: Guardando producto {producto.nombre} con tamaño {tamano.nombre}")
                else:
                    print(f"DEBUG UPDATE: Guardando producto {producto.nombre} sin tamaño")
                
                AppkioskoMenuproductos.objects.create(**menu_producto_data)

        # Actualizar imagen si se envía
        if imagen:
            self._actualizar_imagen_menu(instance, imagen)

        return instance

    def _crear_imagen_menu(self, menu, imagen):
        """Crea y guarda la imagen del menú"""
        try:
            menus_dir = os.path.join(settings.MEDIA_ROOT, 'menus')
            os.makedirs(menus_dir, exist_ok=True)
            extension = imagen.name.split('.')[-1] if '.' in imagen.name else 'jpg'
            nombre_archivo = f"menu_{menu.id}_{uuid.uuid4().hex[:8]}.{extension}"
            ruta_fisica = os.path.join(menus_dir, nombre_archivo)
            with open(ruta_fisica, 'wb+') as destination:
                for chunk in imagen.chunks():
                    destination.write(chunk)
            ruta_relativa = f"/media/menus/{nombre_archivo}"
            AppkioskoImagen.objects.create(
                ruta=ruta_relativa,
                categoria_imagen='menus',
                entidad_relacionada_id=menu.id
            )
            return ruta_relativa
        except Exception as e:
            print(f"❌ Error al guardar imagen de menú: {str(e)}")
            return None

    def _actualizar_imagen_menu(self, instance, imagen):
        """Actualiza la imagen del menú"""
        try:
            imagen_anterior = AppkioskoImagen.objects.get(
                categoria_imagen='menus',
                entidad_relacionada_id=instance.id
            )
            if imagen_anterior.ruta:
                ruta_fisica = os.path.join(settings.MEDIA_ROOT, imagen_anterior.ruta.lstrip('/media/'))
                if os.path.exists(ruta_fisica):
                    os.remove(ruta_fisica)
            imagen_anterior.delete()
        except AppkioskoImagen.DoesNotExist:
            pass
        self._crear_imagen_menu(instance, imagen)



@staticmethod
def _obtener_categorias_activas():
    """Obtiene las categorías activas de la DB con cache"""
    from django.core.cache import cache
    from .models import AppkioskoCategorias
    
    # Intentar obtener del cache
    categorias = cache.get('categorias_activas')
    if categorias is None:
        # Si no está en cache, obtener de DB
        categorias_db = AppkioskoCategorias.objects.filter(activo=True).values_list('nombre', flat=True)
        categorias = set()
        
        for categoria in categorias_db:
            categoria_lower = categoria.lower()
            categorias.add(categoria_lower)
            # Agregar variaciones
            if categoria_lower.endswith('s'):
                categorias.add(categoria_lower[:-1])
            else:
                categorias.add(categoria_lower + 's')
        
        # Guardar en cache por 1 hora
        cache.set('categorias_activas', categorias, 3600)
        print(f"📊 Categorías cargadas de DB: {categorias}")
    else:
        print(f"📊 Categorías obtenidas del cache: {categorias}")
    
    return categorias

def _detectar_cambio_categoria(self, producto, ingredientes_actuales_ids, nuevos_ingredientes_ids_set):
    """Detecta si hubo un cambio de categoría basándose en los ingredientes"""
    if not ingredientes_actuales_ids:
        return False
    
    try:
        # ... código anterior ...
        
        # ✅ USAR: Método helper para obtener categorías
        categorias_principales = self._obtener_categorias_activas()
        
        # ... resto del código ...
    except Exception as e:
        print(f"   ❌ Error detectando cambio de categoría: {str(e)}")
        return False

        

