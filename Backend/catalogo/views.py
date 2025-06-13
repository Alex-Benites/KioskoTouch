from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
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
from .serializers import (
    ProductoSerializer, 
    CategoriaSerializer, 
    MenuSerializer,
    # Nuevo serializer
    TamanoSerializer
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