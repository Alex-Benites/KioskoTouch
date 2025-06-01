from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from .models import (
    AppkioskoProductos, 
    AppkioskoCategorias, 
    AppkioskoIngredientes, 
    AppkioskoProductosIngredientes  
)
from .serializers import ProductoSerializer, CategoriaSerializer
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

@api_view(['DELETE'])
@permission_classes([AllowAny])  # En producción cambiar por IsAuthenticated
def eliminar_producto(request, producto_id):
    """Elimina un producto y sus relaciones"""
    try:
        producto = AppkioskoProductos.objects.get(id=producto_id)
        
        # Eliminar imagen asociada
        try:
            imagen = AppkioskoImagen.objects.get(
                categoria_imagen='productos',
                entidad_relacionada_id=producto_id
            )
            # Eliminar archivo físico
            if imagen.ruta and os.path.exists(imagen.ruta):
                os.remove(imagen.ruta)
            imagen.delete()
        except AppkioskoImagen.DoesNotExist:
            pass
        
        # Eliminar relaciones con ingredientes (se hace automáticamente por CASCADE)
        nombre_producto = producto.nombre
        producto.delete()
        
        return Response({
            'mensaje': f'Producto "{nombre_producto}" eliminado exitosamente'
        })
        
    except AppkioskoProductos.DoesNotExist:
        return Response({'error': 'Producto no encontrado'}, status=404)
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
