from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import (
    AppkioskoProductos,
    AppkioskoCategorias,
    AppkioskoIngredientes,
    AppkioskoProductosIngredientes,
    AppkioskoMenus,
    AppkioskoMenuproductos,
    # Nuevos modelos
    AppkioskoTamanos,
    AppkioskoProductoTamanos,

)
from .serializers import (
    ProductoSerializer,
    CategoriaSerializer,
    MenuSerializer,
    # Nuevo serializer
    TamanoSerializer,
    IngredienteSerializer
)
from comun.models import AppkioskoEstados, AppkioskoImagen
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import json
import os
import uuid
from django.conf import settings

class ProductoListCreateAPIView(generics.ListCreateAPIView):
    """Vista para listar y crear productos con ingredientes"""
    queryset = AppkioskoProductos.objects.select_related('categoria', 'estado').all()  # ← OPTIMIZACIÓN
    serializer_class = ProductoSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]  # ← AGREGAR PERMISOS

    def create(self, request, *args, **kwargs):
        """Crear producto - toda la lógica está en el serializer"""
        print(f"\n🚀 CREANDO PRODUCTO:")
        print(f"   Datos recibidos: {list(request.data.keys())}")

        # El serializer maneja toda la lógica
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            producto = serializer.save()

            # Contar ingredientes para respuesta
            ingredientes_count = AppkioskoProductosIngredientes.objects.filter(
                producto=producto
            ).count()

            print(f"🎉 PRODUCTO CREADO EXITOSAMENTE:")
            print(f"   ID: {producto.id}")
            print(f"   Nombre: {producto.nombre}")
            print(f"   Ingredientes: {ingredientes_count}")
            print("─" * 50)

            return Response({
                'mensaje': '🎉 Producto creado exitosamente',
                'producto': serializer.data,
                'ingredientes_asociados': ingredientes_count
            }, status=status.HTTP_201_CREATED)
        else:
            print(f"❌ ERRORES DE VALIDACIÓN:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
            print("─" * 50)

            return Response({
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

class CategoriaListView(generics.ListAPIView):
    """Vista para listar categorías"""
    queryset = AppkioskoCategorias.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]  # ← AGREGAR PERMISOS

@api_view(['GET'])
@permission_classes([AllowAny])  # ← AGREGAR PERMISOS
def get_producto_imagen(request, producto_id):
    """Obtiene solo la imagen de un producto específico"""
    try:
        imagen = AppkioskoImagen.objects.get(
            categoria_imagen='productos',
            entidad_relacionada_id=producto_id
        )
        return Response({'imagen_url': imagen.ruta})
    except AppkioskoImagen.DoesNotExist:
        return Response({'imagen_url': None})
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_menu_imagen(request, menu_id):
    """Obtiene solo la imagen de un menú específico"""
    try:
        imagen = AppkioskoImagen.objects.get(
            categoria_imagen='menus',
            entidad_relacionada_id=menu_id
        )
        return Response({'imagen_url': imagen.ruta})
    except AppkioskoImagen.DoesNotExist:
        return Response({'imagen_url': None})
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_ingredientes_por_categoria(request, categoria):
    """Obtiene ingredientes filtrados por categoría de producto"""
    try:
        print(f"🥗 Buscando ingredientes para categoría: {categoria}")

        # Solo ingredientes de la categoría específica (sin 'general' ya que no existe)
        ingredientes = AppkioskoIngredientes.objects.filter(
            categoria_producto=categoria  # ← QUITAR 'general' ya que solo tienes pizzas y hamburguesas
        ).order_by('nombre')

        print(f"   Encontrados: {ingredientes.count()} ingredientes")

        # Serializar los ingredientes con sus imágenes
        resultado = []
        for ingrediente in ingredientes:
            # Buscar imagen del ingrediente
            try:
                imagen = AppkioskoImagen.objects.get(
                    categoria_imagen='ingredientes',
                    entidad_relacionada_id=ingrediente.id
                )
                imagen_url = imagen.ruta
            except AppkioskoImagen.DoesNotExist:
                imagen_url = None

            resultado.append({
                'id': ingrediente.id,
                'nombre': ingrediente.nombre,
                'descripcion': ingrediente.descripcion,
                'categoria_producto': ingrediente.categoria_producto,
                'imagen_url': imagen_url
            })

        return Response(resultado)

    except Exception as e:
        print(f"❌ Error en get_ingredientes_por_categoria: {str(e)}")
        return Response({'error': str(e)}, status=400)

# ← AGREGAR NUEVAS VISTAS ÚTILES

@api_view(['GET'])
@permission_classes([AllowAny])
def get_producto_con_ingredientes(request, producto_id):
    """Obtiene un producto específico con todos sus ingredientes"""
    try:
        producto = AppkioskoProductos.objects.select_related('categoria', 'estado').get(id=producto_id)
        serializer = ProductoSerializer(producto)
        return Response(serializer.data)

    except AppkioskoProductos.DoesNotExist:
        return Response({'error': 'Producto no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_productos_con_ingredientes(request):
    """Lista todos los productos con conteo de ingredientes"""
    try:
        productos = AppkioskoProductos.objects.select_related('categoria', 'estado').all()

        resultado = []
        for producto in productos:
            # Contar ingredientes
            ingredientes_count = AppkioskoProductosIngredientes.objects.filter(
                producto=producto
            ).count()

            # Obtener imagen
            try:
                imagen = AppkioskoImagen.objects.get(
                    categoria_imagen='productos',
                    entidad_relacionada_id=producto.id
                )
                imagen_url = imagen.ruta
            except AppkioskoImagen.DoesNotExist:
                imagen_url = None

            resultado.append({
                'id': producto.id,
                'nombre': producto.nombre,
                'descripcion': producto.descripcion,
                'precio': float(producto.precio),
                'categoria_nombre': producto.categoria.nombre if producto.categoria else None,
                'estado_nombre': producto.estado.descripcion if producto.estado else None,
                'imagen_url': imagen_url,
                'ingredientes_count': ingredientes_count,
                'created_at': producto.created_at
            })

        return Response(resultado)

    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_estados(request):
    """Obtiene todos los estados disponibles para productos"""
    try:
        estados = AppkioskoEstados.objects.all()
        resultado = []
        for estado in estados:
            resultado.append({
                'id': estado.id,
                'descripcion': estado.descripcion
            })
        return Response(resultado)
    except Exception as e:
        return Response({'error': str(e)}, status=400)



class ProductoDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para obtener, actualizar y eliminar un producto específico"""
    queryset = AppkioskoProductos.objects.select_related('categoria', 'estado').all()
    serializer_class = ProductoSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        """Actualizar producto - maneja imagen e ingredientes"""
        print(f"\n🔄 ACTUALIZANDO PRODUCTO ID: {kwargs.get('pk')}")
        print(f"   Datos recibidos: {list(request.data.keys())}")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)

        if serializer.is_valid():
            producto = serializer.save()

            print(f"✅ PRODUCTO ACTUALIZADO:")
            print(f"   ID: {producto.id}")
            print(f"   Nombre: {producto.nombre}")
            print("─" * 50)

            return Response({
                'mensaje': '✅ Producto actualizado exitosamente',
                'producto': serializer.data
            })
        else:
            print(f"❌ ERRORES DE VALIDACIÓN:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
            print("─" * 50)

            return Response({
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

    # 🆕 AGREGAR MÉTODO DE ELIMINACIÓN FÍSICA
    def destroy(self, request, *args, **kwargs):
        """Eliminación física - borrar completamente de la base de datos"""
        try:
            producto_id = kwargs.get('pk')
            print(f"\n🗑️ ELIMINACIÓN FÍSICA PRODUCTO ID: {producto_id}")

            # Obtener el producto
            producto = self.get_object()
            producto_nombre = producto.nombre
            print(f"   Producto a eliminar: {producto_nombre}")

            # 🔗 ELIMINAR RELACIONES CON INGREDIENTES PRIMERO
            relaciones_ingredientes = AppkioskoProductosIngredientes.objects.filter(producto=producto)
            count_relaciones = relaciones_ingredientes.count()

            if count_relaciones > 0:
                relaciones_ingredientes.delete()
                print(f"   🗑️ Eliminadas {count_relaciones} relaciones de ingredientes")

            # 🖼️ ELIMINAR IMAGEN FÍSICA si existe
            try:
                imagen = AppkioskoImagen.objects.get(
                    categoria_imagen='productos',
                    entidad_relacionada_id=producto_id
                )

                # Eliminar archivo físico del sistema
                if imagen.ruta:
                    # Construir la ruta completa del archivo
                    ruta_completa = os.path.join(settings.MEDIA_ROOT, imagen.ruta.lstrip('/media/'))

                    if os.path.exists(ruta_completa):
                        os.remove(ruta_completa)
                        print(f"   🖼️ Archivo de imagen eliminado: {ruta_completa}")
                    else:
                        print(f"   ⚠️ Archivo de imagen no encontrado: {ruta_completa}")

                # Eliminar registro de imagen de la DB
                imagen.delete()
                print(f"   🗑️ Registro de imagen eliminado de la DB")

            except AppkioskoImagen.DoesNotExist:
                print(f"   ℹ️ No se encontró imagen asociada al producto")
            except Exception as e:
                print(f"   ⚠️ Error eliminando imagen: {str(e)}")

            # 🗑️ ELIMINAR EL PRODUCTO DE LA BASE DE DATOS
            producto.delete()

            print(f"✅ PRODUCTO ELIMINADO COMPLETAMENTE:")
            print(f"   Nombre: {producto_nombre}")
            print(f"   ID: {producto_id}")
            print(f"   Relaciones eliminadas: {count_relaciones}")
            print("─" * 50)

            # 📊 RESPUESTA EXITOSA
            return Response({
                'success': True,
                'mensaje': f'Producto "{producto_nombre}" eliminado completamente',
                'id': int(producto_id),
                'tipo_eliminacion': 'fisica',
                'relaciones_eliminadas': count_relaciones
            }, status=status.HTTP_200_OK)

        except AppkioskoProductos.DoesNotExist:
            print(f"❌ Producto ID {producto_id} no encontrado")
            return Response({
                'success': False,
                'error': 'Producto no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            print(f"❌ Error eliminando producto: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al eliminar producto: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MenuListCreateAPIView(generics.ListCreateAPIView):
    """Vista para listar y crear menús con productos"""
    queryset = AppkioskoMenus.objects.select_related('estado').all()
    serializer_class = MenuSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        print(f"\n🚀 CREANDO MENÚ:")
        print(f"   Datos recibidos: {list(request.data.keys())}")

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            menu = serializer.save()
            productos_count = AppkioskoMenuproductos.objects.filter(menu=menu).count()
            print(f"🎉 MENÚ CREADO EXITOSAMENTE:")
            print(f"   ID: {menu.id}")
            print(f"   Nombre: {menu.nombre}")
            print(f"   Productos asociados: {productos_count}")
            print("─" * 50)
            return Response({
                'mensaje': '🎉 Menú creado exitosamente',
                'menu': serializer.data,
                'productos_asociados': productos_count
            }, status=status.HTTP_201_CREATED)
        else:
            print(f"❌ ERRORES DE VALIDACIÓN:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
            print("─" * 50)
            return Response({
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

class MenuDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para obtener, actualizar y eliminar un menú específico"""
    queryset = AppkioskoMenus.objects.select_related('estado').all()
    serializer_class = MenuSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        print(f"\n🔄 ACTUALIZANDO MENÚ ID: {kwargs.get('pk')}")
        print(f"   Datos recibidos: {list(request.data.keys())}")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)

        if serializer.is_valid():
            menu = serializer.save()
            print(f"✅ MENÚ ACTUALIZADO:")
            print(f"   ID: {menu.id}")
            print(f"   Nombre: {menu.nombre}")
            print("─" * 50)
            return Response({
                'mensaje': '✅ Menú actualizado exitosamente',
                'menu': serializer.data
            })
        else:
            print(f"❌ ERRORES DE VALIDACIÓN:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
            print("─" * 50)
            return Response({
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """Eliminación física del menú y sus relaciones"""
        try:
            menu_id = kwargs.get('pk')
            print(f"\n🗑️ ELIMINACIÓN FÍSICA MENÚ ID: {menu_id}")

            menu = self.get_object()
            menu_nombre = menu.nombre
            print(f"   Menú a eliminar: {menu_nombre}")

            # Eliminar relaciones con productos
            relaciones_productos = AppkioskoMenuproductos.objects.filter(menu=menu)
            count_relaciones = relaciones_productos.count()
            if count_relaciones > 0:
                relaciones_productos.delete()
                print(f"   🗑️ Eliminadas {count_relaciones} relaciones de productos")

            # Eliminar imagen física si existe
            try:
                imagen = AppkioskoImagen.objects.get(
                    categoria_imagen='menus',
                    entidad_relacionada_id=menu_id
                )
                if imagen.ruta:
                    ruta_completa = os.path.join(settings.MEDIA_ROOT, imagen.ruta.lstrip('/media/'))
                    if os.path.exists(ruta_completa):
                        os.remove(ruta_completa)
                        print(f"   🖼️ Archivo de imagen eliminado: {ruta_completa}")
                    else:
                        print(f"   ⚠️ Archivo de imagen no encontrado: {ruta_completa}")
                imagen.delete()
                print(f"   🗑️ Registro de imagen eliminado de la DB")
            except AppkioskoImagen.DoesNotExist:
                print(f"   ℹ️ No se encontró imagen asociada al menú")
            except Exception as e:
                print(f"   ⚠️ Error eliminando imagen: {str(e)}")

            # Eliminar el menú
            menu.delete()
            print(f"✅ MENÚ ELIMINADO COMPLETAMENTE:")
            print(f"   Nombre: {menu_nombre}")
            print(f"   ID: {menu_id}")
            print(f"   Relaciones eliminadas: {count_relaciones}")
            print("─" * 50)
            return Response({
                'success': True,
                'mensaje': f'Menú "{menu_nombre}" eliminado completamente',
                'id': int(menu_id),
                'tipo_eliminacion': 'fisica',
                'relaciones_eliminadas': count_relaciones
            }, status=status.HTTP_200_OK)

        except AppkioskoMenus.DoesNotExist:
            print(f"❌ Menú ID {menu_id} no encontrado")
            return Response({
                'success': False,
                'error': 'Menú no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Error eliminando menú: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al eliminar menú: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Agregar esta nueva vista para listar tamaños
@api_view(['GET'])
@permission_classes([AllowAny])
def get_tamanos(request):
    """Obtener todos los tamaños disponibles"""
    try:
        tamanos = AppkioskoTamanos.objects.filter(activo=True).order_by('orden', 'nombre')
        serializer = TamanoSerializer(tamanos, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

# ✅ AGREGAR ESTAS NUEVAS VISTAS AL FINAL DEL ARCHIVO views.py

class IngredienteListCreateAPIView(generics.ListCreateAPIView):
    """Vista para listar y crear ingredientes"""
    queryset = AppkioskoIngredientes.objects.all()
    serializer_class = IngredienteSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        """Filtrar por categoría si se especifica"""
        queryset = super().get_queryset()
        categoria = self.request.query_params.get('categoria', None)
        if categoria:
            queryset = queryset.filter(categoria_producto=categoria)
        return queryset.order_by('nombre')

    def create(self, request, *args, **kwargs):
        """Crear ingrediente con imagen"""
        print(f"\n🚀 CREANDO INGREDIENTE:")
        print(f"   Datos recibidos: {list(request.data.keys())}")

        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            ingrediente = serializer.save()

            print(f"🎉 INGREDIENTE CREADO EXITOSAMENTE:")
            print(f"   ID: {ingrediente.id}")
            print(f"   Nombre: {ingrediente.nombre}")
            print(f"   Categoría: {ingrediente.categoria_producto}")
            print("─" * 50)

            return Response({
                'mensaje': '🎉 Ingrediente creado exitosamente',
                'ingrediente': serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            print(f"❌ ERRORES DE VALIDACIÓN:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
            print("─" * 50)

            return Response({
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

class IngredienteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para obtener, actualizar y eliminar un ingrediente específico"""
    queryset = AppkioskoIngredientes.objects.all()
    serializer_class = IngredienteSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        """Actualizar ingrediente"""
        print(f"\n🔄 ACTUALIZANDO INGREDIENTE ID: {kwargs.get('pk')}")
        print(f"   Datos recibidos: {list(request.data.keys())}")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)

        if serializer.is_valid():
            ingrediente = serializer.save()

            print(f"✅ INGREDIENTE ACTUALIZADO:")
            print(f"   ID: {ingrediente.id}")
            print(f"   Nombre: {ingrediente.nombre}")
            print("─" * 50)

            return Response({
                'mensaje': '✅ Ingrediente actualizado exitosamente',
                'ingrediente': serializer.data
            })
        else:
            print(f"❌ ERRORES DE VALIDACIÓN:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
            print("─" * 50)

            return Response({
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """Eliminación física del ingrediente"""
        try:
            ingrediente_id = kwargs.get('pk')
            print(f"\n🗑️ ELIMINACIÓN FÍSICA INGREDIENTE ID: {ingrediente_id}")

            ingrediente = self.get_object()
            ingrediente_nombre = ingrediente.nombre
            print(f"   Ingrediente a eliminar: {ingrediente_nombre}")

            # Verificar si está siendo usado en productos
            productos_usando = AppkioskoProductosIngredientes.objects.filter(
                ingrediente=ingrediente
            ).count()

            if productos_usando > 0:
                print(f"   ⚠️ El ingrediente está siendo usado en {productos_usando} productos")
                return Response({
                    'success': False,
                    'error': f'No se puede eliminar el ingrediente "{ingrediente_nombre}" porque está siendo usado en {productos_usando} productos.',
                    'productos_afectados': productos_usando
                }, status=status.HTTP_400_BAD_REQUEST)

            # Eliminar imagen física si existe
            try:
                imagen = AppkioskoImagen.objects.get(
                    categoria_imagen='ingredientes',
                    entidad_relacionada_id=ingrediente_id
                )

                if imagen.ruta:
                    ruta_completa = os.path.join(settings.MEDIA_ROOT, imagen.ruta.lstrip('/media/'))
                    if os.path.exists(ruta_completa):
                        os.remove(ruta_completa)
                        print(f"   🖼️ Archivo de imagen eliminado: {ruta_completa}")

                imagen.delete()
                print(f"   🗑️ Registro de imagen eliminado de la DB")

            except AppkioskoImagen.DoesNotExist:
                print(f"   ℹ️ No se encontró imagen asociada al ingrediente")
            except Exception as e:
                print(f"   ⚠️ Error eliminando imagen: {str(e)}")

            # Eliminar el ingrediente
            ingrediente.delete()

            print(f"✅ INGREDIENTE ELIMINADO COMPLETAMENTE:")
            print(f"   Nombre: {ingrediente_nombre}")
            print(f"   ID: {ingrediente_id}")
            print("─" * 50)

            return Response({
                'success': True,
                'mensaje': f'Ingrediente "{ingrediente_nombre}" eliminado completamente',
                'id': int(ingrediente_id),
                'tipo_eliminacion': 'fisica'
            }, status=status.HTTP_200_OK)

        except AppkioskoIngredientes.DoesNotExist:
            print(f"❌ Ingrediente ID {ingrediente_id} no encontrado")
            return Response({
                'success': False,
                'error': 'Ingrediente no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            print(f"❌ Error eliminando ingrediente: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al eliminar ingrediente: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ✅ AGREGAR ESTA VISTA FALTANTE
class IngredientesPorCategoriaView(generics.ListAPIView):
    """Vista para obtener ingredientes filtrados por categoría"""
    serializer_class = IngredienteSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        categoria = self.kwargs.get('categoria')
        print(f'🔍 [VIEW] Buscando ingredientes para categoría: {categoria}')

        # Filtrar ingredientes por categoría
        queryset = AppkioskoIngredientes.objects.filter(
            categoria_producto=categoria
        ).order_by('-created_at')

        print(f'✅ [VIEW] Ingredientes encontrados: {queryset.count()}')
        return queryset

    def list(self, request, *args, **kwargs):
        try:
            categoria = self.kwargs.get('categoria')
            print(f'📋 [VIEW] Solicitando ingredientes para: {categoria}')

            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
 
            response_data = {
                'ingredientes': serializer.data,
                'total': len(serializer.data),
                'categoria': categoria
            }

            print(f'📤 [VIEW] Enviando {len(serializer.data)} ingredientes')
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            print(f'❌ [VIEW] Error al obtener ingredientes por categoría: {str(e)}')
            return Response(
                {'error': f'Error al obtener ingredientes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([AllowAny])
def obtener_ingredientes_por_producto(request, producto_id):
    """Obtiene todos los ingredientes disponibles y marca cuáles tiene el producto"""
    try:
        # Verificar que el producto existe
        try:
            producto = AppkioskoProductos.objects.get(id=producto_id)
        except AppkioskoProductos.DoesNotExist:
            return Response({
                'error': 'Producto no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        print(f"🍔 Producto encontrado: {producto.nombre} (ID: {producto.id})")

        # Verificar si viene información de tamaño en los parámetros
        tamano_codigo = request.GET.get('tamano_codigo', None)
        print(f"📏 Tamaño solicitado: {tamano_codigo}")

        # ✅ CORREGIR: Manejo seguro de categoría del producto
        categoria_producto = None
        if hasattr(producto, 'categoria') and producto.categoria:
            try:
                categoria_producto = producto.categoria.nombre.lower()
                print(f"📂 Categoría del producto: '{categoria_producto}'")
            except AttributeError as e:
                print(f"⚠️ Error accediendo a categoría del producto: {e}")
                categoria_producto = None
        
        if not categoria_producto:
            print(f"⚠️ Producto sin categoría asignada")
            # Para productos sin categoría, verificar si tiene ingredientes asignados directamente
            ingredientes_directos = AppkioskoProductosIngredientes.objects.filter(
                producto_id=producto_id
            )
            
            if ingredientes_directos.exists():
                print("✅ Producto sin categoría pero con ingredientes asignados directamente")
                # Continuar con la lógica para obtener esos ingredientes específicos
                pass
            else:
                print("❌ Producto sin categoría y sin ingredientes asignados")
                return Response({
                    'producto': {
                        'id': producto.id,
                        'nombre': str(producto.nombre) if producto.nombre else "",
                        'categoria': "",
                        'aplica_tamanos': getattr(producto, 'aplica_tamanos', False),
                        'tamano_solicitado': tamano_codigo
                    },
                    'ingredientes': [],
                    'total_ingredientes': 0,
                    'ingredientes_producto': 0,
                    'mensaje': 'Este producto no tiene opciones de personalización disponibles'
                })

        # Obtener mapeo dinámico de categorías activas
        categoria_normalizada = categoria_producto
        if categoria_producto:
            try:
                # Obtener todas las categorías activas de la DB
                categorias_activas = AppkioskoCategorias.objects.filter(activo=True).values_list('nombre', flat=True)
                categorias_activas_lower = {cat.lower() for cat in categorias_activas}
                
                print(f"📊 Categorías activas en DB: {categorias_activas_lower}")
                
                # Si la categoría del producto no está en las activas, buscar similar
                if categoria_producto not in categorias_activas_lower:
                    print(f"⚠️ Categoría '{categoria_producto}' no encontrada en categorías activas")
                    
                    # Buscar categoría similar
                    for cat_activa in categorias_activas_lower:
                        cat_producto_clean = categoria_producto.rstrip('s')
                        cat_activa_clean = cat_activa.rstrip('s')
                        
                        if (cat_producto_clean == cat_activa_clean or
                            categoria_producto in cat_activa or 
                            cat_activa in categoria_producto):
                            categoria_normalizada = cat_activa
                            print(f"🔄 Categoría similar encontrada: '{categoria_producto}' → '{categoria_normalizada}'")
                            break
                else:
                    categoria_normalizada = categoria_producto
                    
            except Exception as e:
                print(f"⚠️ Error procesando categorías: {e}")
                categoria_normalizada = categoria_producto

        # Usar categoría normalizada para la búsqueda
        categoria_busqueda = categoria_normalizada

        # Obtener ingredientes del producto desde la tabla de relaciones
        ingredientes_producto_info = {}
        try:
            relaciones = AppkioskoProductosIngredientes.objects.filter(producto_id=producto_id)
            
            for relacion in relaciones:
                ingredientes_producto_info[relacion.ingrediente_id] = {
                    'seleccionado': True,
                    'cantidad': getattr(relacion, 'cantidad', 1),
                    'es_base': getattr(relacion, 'es_base', False),
                    'permite_extra': getattr(relacion, 'permite_extra', False)
                }
            
            ingredientes_producto_ids = set(ingredientes_producto_info.keys())
            print(f"🔍 IDs de ingredientes del producto: {ingredientes_producto_ids}")
        except Exception as e:
            print(f"⚠️ Error obteniendo relaciones producto-ingredientes: {e}")
            ingredientes_producto_info = {}
            ingredientes_producto_ids = set()

        # ✅ LÓGICA ESTRICTA: Solo mostrar ingredientes si se encuentran específicamente
        ingredientes_categoria = AppkioskoIngredientes.objects.none()

        if categoria_busqueda:
            try:
                # Para productos con tamaños, ser más estricto en la búsqueda
                if getattr(producto, 'aplica_tamanos', False) and tamano_codigo:
                    print(f"🎯 Búsqueda EXACTA para producto con tamaños: '{categoria_busqueda}'")
                    ingredientes_categoria = AppkioskoIngredientes.objects.filter(
                        categoria_producto__iexact=categoria_busqueda
                    )
                    print(f"🔎 Ingredientes encontrados con búsqueda exacta: {ingredientes_categoria.count()}")
                    
                    # Si no encuentra, buscar con variaciones dinámicas
                    if not ingredientes_categoria.exists():
                        variaciones_categoria = set()
                        variaciones_categoria.add(categoria_busqueda)
                        
                        # Agregar variaciones plural/singular
                        if categoria_busqueda.endswith('s'):
                            variaciones_categoria.add(categoria_busqueda[:-1])
                        else:
                            variaciones_categoria.add(categoria_busqueda + 's')
                        
                        # Buscar en todas las variaciones
                        for variacion in variaciones_categoria:
                            ingredientes_categoria = AppkioskoIngredientes.objects.filter(
                                categoria_producto__iexact=variacion
                            )
                            if ingredientes_categoria.exists():
                                print(f"🔎 Ingredientes encontrados con variación '{variacion}': {ingredientes_categoria.count()}")
                                break
                else:
                    print(f"🔄 Búsqueda para producto sin tamaños")
                    # Intentar búsqueda exacta
                    ingredientes_categoria = AppkioskoIngredientes.objects.filter(
                        categoria_producto__iexact=categoria_busqueda
                    )
                    print(f"🔎 Búsqueda exacta '{categoria_busqueda}': {ingredientes_categoria.count()} encontrados")

                    # Si no encuentra, probar con 's' al final
                    if not ingredientes_categoria.exists():
                        categoria_plural = categoria_busqueda + 's'
                        ingredientes_categoria = AppkioskoIngredientes.objects.filter(
                            categoria_producto__iexact=categoria_plural
                        )
                        print(f"🔎 Búsqueda plural '{categoria_plural}': {ingredientes_categoria.count()} encontrados")
            except Exception as e:
                print(f"⚠️ Error en búsqueda de ingredientes: {e}")
                ingredientes_categoria = AppkioskoIngredientes.objects.none()

        # ✅ LÓGICA ESTRICTA: Solo usar ingredientes asignados directamente como fallback
        if not ingredientes_categoria.exists():
            print(f"❌ No se encontraron ingredientes para la categoría '{categoria_busqueda}'")
            print("📋 Verificando si el producto tiene ingredientes asignados directamente...")
            
            # Verificar si el producto tiene ingredientes asignados directamente
            ingredientes_directos = AppkioskoProductosIngredientes.objects.filter(
                producto_id=producto_id
            )
            
            if ingredientes_directos.exists():
                print("✅ Producto tiene ingredientes asignados directamente")
                # Obtener solo los ingredientes específicamente asignados al producto
                ingredientes_ids = ingredientes_directos.values_list('ingrediente_id', flat=True)
                ingredientes_categoria = AppkioskoIngredientes.objects.filter(
                    id__in=ingredientes_ids
                ).order_by('nombre')
                
                print(f"🎯 Mostrando {ingredientes_categoria.count()} ingredientes específicos del producto")
            else:
                print("❌ Producto sin ingredientes - mostrando lista vacía")
                return Response({
                    'producto': {
                        'id': producto.id,
                        'nombre': str(producto.nombre) if producto.nombre else "",
                        'categoria': categoria_producto or "",
                        'aplica_tamanos': getattr(producto, 'aplica_tamanos', False),
                        'tamano_solicitado': tamano_codigo
                    },
                    'ingredientes': [],
                    'total_ingredientes': 0,
                    'ingredientes_producto': 0,
                    'mensaje': 'Este producto no tiene ingredientes personalizables'
                })
        else:
            # Ordenar ingredientes encontrados por categoría
            ingredientes_categoria = ingredientes_categoria.order_by('nombre')

        print(f"🥗 Total ingredientes a mostrar: {ingredientes_categoria.count()}")

        # Preparar respuesta usando AppkioskoImagen
        ingredientes_disponibles = []

        for ingrediente in ingredientes_categoria:
            try:
                info_producto = ingredientes_producto_info.get(ingrediente.id, {
                    'seleccionado': False,
                    'cantidad': 0,
                    'es_base': False,
                    'permite_extra': False
                })

                # Buscar imagen en AppkioskoImagen
                imagen_url = None
                try:
                    imagen = AppkioskoImagen.objects.get(
                        categoria_imagen='ingredientes',
                        entidad_relacionada_id=ingrediente.id
                    )
                    imagen_url = imagen.ruta
                    print(f"🖼️ Imagen encontrada para {ingrediente.nombre}: {imagen_url}")
                except AppkioskoImagen.DoesNotExist:
                    print(f"📷 No se encontró imagen para ingrediente {ingrediente.nombre} (ID: {ingrediente.id})")
                    imagen_url = None
                except Exception as e:
                    print(f"⚠️ Error buscando imagen para ingrediente {ingrediente.id}: {e}")
                    imagen_url = None

                # Manejo seguro de campos
                nombre_safe = str(ingrediente.nombre) if ingrediente.nombre else f"Ingrediente {ingrediente.id}"
                descripcion_safe = str(ingrediente.descripcion) if hasattr(ingrediente, 'descripcion') and ingrediente.descripcion else ""
                precio_safe = float(ingrediente.precio_adicional) if hasattr(ingrediente, 'precio_adicional') and ingrediente.precio_adicional else 0.0
                categoria_safe = str(ingrediente.categoria_producto) if hasattr(ingrediente, 'categoria_producto') and ingrediente.categoria_producto else ""

                print(f"🧅 ID:{ingrediente.id} - {nombre_safe} - Seleccionado: {'✅' if info_producto['seleccionado'] else '❌'} - Cantidad: {info_producto['cantidad']} - Imagen: {imagen_url}")

                ingredientes_disponibles.append({
                    'id': ingrediente.id,
                    'nombre': nombre_safe,
                    'descripcion': descripcion_safe,
                    'precio': precio_safe,
                    'categoria': categoria_safe,
                    'imagen_url': imagen_url,
                    'seleccionado': info_producto['seleccionado'],
                    'es_original': info_producto['seleccionado'],
                    'cantidad': info_producto['cantidad']
                })

            except Exception as ingredient_error:
                print(f"❌ Error procesando ingrediente {getattr(ingrediente, 'id', 'desconocido')}: {str(ingredient_error)}")
                continue

        # Resumen final
        seleccionados_count = sum(1 for ing in ingredientes_disponibles if ing.get('seleccionado', False))
        print(f"🎉 RESUMEN FINAL:")
        print(f"   • Producto tiene tamaños: {'✅' if getattr(producto, 'aplica_tamanos', False) else '❌'}")
        print(f"   • Tamaño solicitado: {tamano_codigo or 'N/A'}")
        print(f"   • Categoría usada para búsqueda: {categoria_busqueda}")
        print(f"   • Ingredientes disponibles: {len(ingredientes_disponibles)}")
        print(f"   • Ingredientes seleccionados: {seleccionados_count}")

        return Response({
            'producto': {
                'id': producto.id,
                'nombre': str(producto.nombre) if producto.nombre else "",
                'categoria': categoria_producto or "",
                'aplica_tamanos': getattr(producto, 'aplica_tamanos', False),
                'tamano_solicitado': tamano_codigo
            },
            'ingredientes': ingredientes_disponibles,
            'total_ingredientes': len(ingredientes_disponibles),
            'ingredientes_producto': len(ingredientes_producto_ids),
            'mensaje': 'Ingredientes cargados correctamente' if ingredientes_disponibles else 'No hay ingredientes personalizables para este producto'
        })

    except Exception as e:
        print(f"❌ ERROR GENERAL: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
