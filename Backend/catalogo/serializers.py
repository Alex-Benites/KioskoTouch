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


    def _actualizar_ingredientes_inteligente(self, producto, nuevos_ingredientes_data, forzar_cambio_categoria=False):
        """Actualiza ingredientes reutilizando IDs de relaciones eliminadas"""
        print(f"🧠 Actualizacion inteligente de ingredientes para {producto.nombre}")
        print(f"   Nuevos ingredientes solicitados: {nuevos_ingredientes_data}")
        
        # ✅ CAMBIO 1: Procesar datos de ingredientes con cantidades
        if nuevos_ingredientes_data and isinstance(nuevos_ingredientes_data[0], dict):
            # Formato nuevo: [{'id': 1, 'cantidad': 2}, {'id': 2, 'cantidad': 1}]
            nuevos_ingredientes_ids = [item['id'] for item in nuevos_ingredientes_data]
            cantidad_por_ingrediente = {item['id']: item.get('cantidad', 1) for item in nuevos_ingredientes_data}
        else:
            # Formato antiguo: [1, 2, 3]
            nuevos_ingredientes_ids = nuevos_ingredientes_data
            cantidad_por_ingrediente = {id: 1 for id in nuevos_ingredientes_ids}
        
        print(f"   Cantidades por ingrediente: {cantidad_por_ingrediente}")
        
        # 🔧 ORDENAR relaciones por ID para reutilizar desde el más bajo
        relaciones_actuales = list(AppkioskoProductosIngredientes.objects.filter(producto=producto).order_by('id'))
        ingredientes_actuales_ids = set([rel.ingrediente_id for rel in relaciones_actuales])
        nuevos_ingredientes_ids_set = set(nuevos_ingredientes_ids)
        
        print(f"   Ingredientes actuales: {ingredientes_actuales_ids}")
        print(f"   Ingredientes nuevos: {nuevos_ingredientes_ids_set}")
        print(f"   🔍 IDs de relaciones disponibles: {[rel.id for rel in relaciones_actuales]}")
        
        # 🆕 USAR EL PARÁMETRO DE CAMBIO DE CATEGORÍA
        if forzar_cambio_categoria:
            print(f"   🔄 CAMBIO DE CATEGORÍA FORZADO - Eliminando todos los ingredientes anteriores")
            # Si cambió la categoría, eliminar TODOS los ingredientes anteriores
            if relaciones_actuales:
                eliminados = AppkioskoProductosIngredientes.objects.filter(producto=producto).delete()
                print(f"   🗑️ Eliminados todos los ingredientes anteriores: {eliminados[0]} relaciones")
                relaciones_actuales = []
                ingredientes_actuales_ids = set()
        
        # 📊 DIAGNÓSTICO: Encontrar IDs faltantes GLOBALMENTE
        ids_faltantes_globales = []
        if relaciones_actuales:
            ids_actuales = [rel.id for rel in relaciones_actuales]
            min_id = min(ids_actuales)
            max_id = max(ids_actuales)
            
            for i in range(min_id, max_id + 1):
                if i not in ids_actuales:
                    ids_faltantes_globales.append(i)
            
            if ids_faltantes_globales:
                print(f"   📈 IDs faltantes en el rango {min_id}-{max_id}: {ids_faltantes_globales}")
            else:
                print(f"   ✅ Sin huecos en el rango {min_id}-{max_id}")
        
        # 🔍 Determinar qué hacer
        ingredientes_mantener = ingredientes_actuales_ids & nuevos_ingredientes_ids_set
        ingredientes_eliminar = ingredientes_actuales_ids - nuevos_ingredientes_ids_set
        ingredientes_agregar = nuevos_ingredientes_ids_set - ingredientes_actuales_ids
        
        print(f"   📋 Mantener: {ingredientes_mantener}")
        print(f"   🗑️ Eliminar: {ingredientes_eliminar}")  
        print(f"   ➕ Agregar: {ingredientes_agregar}")
        
        # ✅ CAMBIO 2: Actualizar cantidades de ingredientes que se mantienen
        for ingrediente_id in ingredientes_mantener:
            nueva_cantidad = cantidad_por_ingrediente.get(ingrediente_id, 1)
            relacion = next((rel for rel in relaciones_actuales if rel.ingrediente_id == ingrediente_id), None)
            if relacion and relacion.cantidad != nueva_cantidad:
                relacion.cantidad = nueva_cantidad
                relacion.save()
                print(f"   🔄 Actualizada cantidad de {relacion.ingrediente.nombre}: {relacion.cantidad} → {nueva_cantidad}")
        
        # 🔄 REUTILIZAR RELACIONES EXISTENTES (solo si NO cambió la categoría)
        if not forzar_cambio_categoria and ingredientes_eliminar and ingredientes_agregar:
            relaciones_eliminables = [rel for rel in relaciones_actuales if rel.ingrediente_id in ingredientes_eliminar]
            relaciones_eliminables.sort(key=lambda x: x.id)
            
            ingredientes_a_agregar_list = list(ingredientes_agregar)
            
            print(f"   🔍 Relaciones a reutilizar (ordenadas): {[f'ID:{rel.id}' for rel in relaciones_eliminables]}")
            
            # Reutilizar tantas relaciones como sea posible
            reutilizaciones = min(len(relaciones_eliminables), len(ingredientes_a_agregar_list))
            
            for i in range(reutilizaciones):
                relacion_antigua = relaciones_eliminables[i]
                nuevo_ingrediente_id = ingredientes_a_agregar_list[i]
                
                try:
                    nuevo_ingrediente = AppkioskoIngredientes.objects.get(id=nuevo_ingrediente_id)
                    
                    ingrediente_id_original = relacion_antigua.ingrediente_id
                    nombre_original = relacion_antigua.ingrediente.nombre
                    
                    # ✅ CAMBIO 3: Usar la cantidad correcta al reutilizar
                    nueva_cantidad = cantidad_por_ingrediente.get(nuevo_ingrediente_id, 1)
                    relacion_antigua.ingrediente = nuevo_ingrediente
                    relacion_antigua.cantidad = nueva_cantidad
                    relacion_antigua.save()

                    print(f"   🔄 Reutilizado ID {relacion_antigua.id}: {nombre_original} → {nuevo_ingrediente.nombre} (cantidad: {nueva_cantidad})")
                    
                    ingredientes_eliminar.remove(ingrediente_id_original)
                    ingredientes_agregar.remove(nuevo_ingrediente_id)
                    
                except AppkioskoIngredientes.DoesNotExist:
                    print(f"   ❌ Ingrediente ID {nuevo_ingrediente_id} no existe")
                except Exception as e:
                    print(f"   ❌ Error reutilizando relación: {str(e)}")
        
        # 🗑️ Eliminar relaciones restantes (solo si NO cambió la categoría)
        if not forzar_cambio_categoria and ingredientes_eliminar:
            eliminados = AppkioskoProductosIngredientes.objects.filter(
                producto=producto,
                ingrediente_id__in=ingredientes_eliminar
            ).delete()
            print(f"   🗑️ Eliminados: {eliminados[0]} relaciones")
        
        # 🆕 CREAR NUEVAS RELACIONES
        count_agregados = 0
        if forzar_cambio_categoria:
            # Si cambió categoría, crear TODOS los ingredientes como nuevos
            ingredientes_a_crear = nuevos_ingredientes_ids_set
            print(f"   🆕 Creando TODOS los ingredientes debido a cambio de categoría")
        else:
            # Si no cambió categoría, solo crear los faltantes
            ingredientes_a_crear = ingredientes_agregar
        
        # 🔧 OBTENER NOMBRE CORRECTO DE LA TABLA
        table_name = AppkioskoProductosIngredientes._meta.db_table
        
        # 🔧 CREAR RELACIONES
        for ingrediente_id in ingredientes_a_crear:
            try:
                ingrediente = AppkioskoIngredientes.objects.get(id=ingrediente_id)
                # ✅ CAMBIO 4: Usar la cantidad correcta al crear
                cantidad = cantidad_por_ingrediente.get(ingrediente_id, 1)
                
                # Si hay IDs faltantes y NO cambió categoría, usar el primero disponible
                if not forzar_cambio_categoria and ids_faltantes_globales:
                    id_a_usar = ids_faltantes_globales.pop(0)  # Tomar el más bajo
                    
                    # 🔧 CREAR CON ID ESPECÍFICO usando nombre correcto de tabla
                    with connection.cursor() as cursor:
                        cursor.execute(f"""
                            INSERT INTO {table_name} 
                            (id, producto_id, ingrediente_id, es_base, permite_extra, cantidad) 
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, [id_a_usar, producto.id, ingrediente.id, True, True, cantidad])  # ✅ USAR CANTIDAD CORRECTA
                    
                    print(f"   🔧 Rellenó hueco ID {id_a_usar}: {ingrediente.nombre} (cantidad: {cantidad})")
                    count_agregados += 1
                else:
                    # Crear normalmente
                    relacion = AppkioskoProductosIngredientes.objects.create(
                        producto=producto,
                        ingrediente=ingrediente,
                        es_base=True,
                        permite_extra=True,
                        cantidad=cantidad  # ✅ USAR CANTIDAD CORRECTA
                    )
                    print(f"   ➕ Nueva relación: {ingrediente.nombre} (ID relación: {relacion.id}, cantidad: {cantidad})")
                    count_agregados += 1
                    
            except AppkioskoIngredientes.DoesNotExist:
                print(f"   ❌ Ingrediente ID {ingrediente_id} no existe")
            except Exception as e:
                print(f"   ❌ Error creando relación: {str(e)}")
        
        # 📊 Resumen
        print(f"   ✅ Mantenidos: {len(ingredientes_mantener)} ingredientes")
        print(f"   🔄 Reutilizados: {reutilizaciones if 'reutilizaciones' in locals() else 0} IDs de relación")
        print(f"   🗑️ Eliminados: {len(ingredientes_eliminar)} ingredientes") 
        print(f"   ➕ Nuevos: {count_agregados} ingredientes")
        print(f"   🎯 Total final: {len(nuevos_ingredientes_ids)} ingredientes")

        

    def _detectar_cambio_categoria(self, producto, ingredientes_actuales_ids, nuevos_ingredientes_ids_set):
        """Detecta si hubo un cambio de categoría basándose en los ingredientes"""
        if not ingredientes_actuales_ids:
            return False  # No hay ingredientes anteriores, no es cambio de categoría
        
        try:
            # Obtener categorías de los ingredientes actuales
            ingredientes_actuales = AppkioskoIngredientes.objects.filter(id__in=ingredientes_actuales_ids)
            categorias_actuales = set(ingredientes_actuales.values_list('categoria_producto', flat=True))
            
            # Obtener categorías de los nuevos ingredientes
            ingredientes_nuevos = AppkioskoIngredientes.objects.filter(id__in=nuevos_ingredientes_ids_set)
            categorias_nuevas = set(ingredientes_nuevos.values_list('categoria_producto', flat=True))
            
            print(f"   🔍 Categorías actuales de ingredientes: {categorias_actuales}")
            print(f"   🔍 Categorías nuevas de ingredientes: {categorias_nuevas}")
            
            # Si las categorías son completamente diferentes, es un cambio
            if categorias_actuales and categorias_nuevas and not (categorias_actuales & categorias_nuevas):
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
        """Crea las relaciones producto-ingrediente con cantidades"""
        print(f"🔧 Creando relaciones para producto {producto.nombre}")
        print(f"   Datos de ingredientes a procesar: {ingredientes_data}")
        
        count = 0
        for ingrediente_data in ingredientes_data:
            try:
                # ✅ CAMBIAR: Manejar tanto formato nuevo como antiguo
                if isinstance(ingrediente_data, dict):
                    # Formato nuevo: {'id': 1, 'cantidad': 2}
                    ingrediente_id = ingrediente_data['id']
                    cantidad = ingrediente_data.get('cantidad', 1)
                else:
                    # Formato antiguo: solo ID
                    ingrediente_id = ingrediente_data
                    cantidad = 1
                
                print(f"   Procesando ingrediente ID {ingrediente_id} con cantidad {cantidad}")
                
                ingrediente = AppkioskoIngredientes.objects.get(id=ingrediente_id)
                
                # ✅ CAMBIAR: Usar la cantidad recibida
                relacion = AppkioskoProductosIngredientes.objects.create(
                    producto=producto,
                    ingrediente=ingrediente,
                    es_base=True,
                    permite_extra=False,
                    cantidad=cantidad  # ✅ USAR LA CANTIDAD RECIBIDA
                )
                print(f"   ✅ {ingrediente.nombre} (ID: {ingrediente.id}) - Cantidad: {cantidad} - Relación creada: {relacion.id}")
                count += 1
                        
            except AppkioskoIngredientes.DoesNotExist:
                print(f"   ❌ Ingrediente ID {ingrediente_id} no existe")
            except Exception as e:
                print(f"   ❌ Error con ingrediente {ingrediente_id}: {str(e)}")
        
        print(f"🎯 Total de relaciones creadas: {count}")
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
        fields = [
            'id', 'nombre', 'descripcion', 'categoria_producto', 
            'precio_adicional', 'stock', 'stock_minimo', 
            'unidad_medida', 'estado', 'imagen', 'imagen_url',
            'created_at', 'updated_at'
        ]
        
    def get_imagen_url(self, obj):
        if obj.imagen:
            return obj.imagen.url
        return None
        
    def create(self, validated_data):
        print("🔍 [SERIALIZER CREATE] Datos recibidos:", list(validated_data.keys()))
        if 'imagen' in validated_data:
            print("✅ [SERIALIZER CREATE] Imagen encontrada en validated_data")
            print("📸 [SERIALIZER CREATE] Tipo de imagen:", type(validated_data['imagen']))
        else:
            print("❌ [SERIALIZER CREATE] NO se encontró imagen en validated_data")
            
        return super().create(validated_data)
        
    def update(self, instance, validated_data):
        print("🔍 [SERIALIZER UPDATE] Datos recibidos:", list(validated_data.keys()))
        if 'imagen' in validated_data:
            print("✅ [SERIALIZER UPDATE] Imagen encontrada en validated_data")
            print("📸 [SERIALIZER UPDATE] Tipo de imagen:", type(validated_data['imagen']))
        else:
            print("❌ [SERIALIZER UPDATE] NO se encontró imagen en validated_data")
            
        return super().update(instance, validated_data)

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



