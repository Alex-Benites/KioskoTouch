# ✅ Backend/categoria/views.py - QUITAR referencias a campos que no existen
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from django.db import IntegrityError
from catalogo.models import AppkioskoCategorias, AppkioskoProductos, AppkioskoIngredientes
from comun.models import AppkioskoImagen
from .serializers import CategoriaAdminSerializer
import os
from django.conf import settings

class CategoriaListCreateAPIView(generics.ListCreateAPIView):
    """Vista para listar y crear categorías"""
    queryset = AppkioskoCategorias.objects.all().order_by('-created_at')
    serializer_class = CategoriaAdminSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        print(f"\n🆕 CREANDO CATEGORÍA:")
        print(f"   Datos recibidos: {list(request.data.keys())}")

        nombre = request.data.get('nombre', '').strip()
        if not nombre:
            return Response({
                'error': 'El nombre de la categoría es obligatorio'
            }, status=status.HTTP_400_BAD_REQUEST)

        if AppkioskoCategorias.objects.filter(nombre__iexact=nombre).exists():
            return Response({
                'error': f'Ya existe una categoría con el nombre "{nombre}"'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                categoria = serializer.save()
                
                print(f"✅ CATEGORÍA CREADA EXITOSAMENTE:")
                print(f"   ID: {categoria.id}")
                print(f"   Nombre: {categoria.nombre}")
                print("─" * 50)

                return Response({
                    'success': True,
                    'mensaje': f'Categoría "{categoria.nombre}" creada exitosamente',
                    'categoria': serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': 'Datos inválidos',
                    'detalles': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"❌ Error creando categoría: {str(e)}")
            return Response({
                'error': 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CategoriaDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para obtener, actualizar y eliminar categorías"""
    queryset = AppkioskoCategorias.objects.all()
    serializer_class = CategoriaAdminSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        try:
            categoria_id = kwargs.get('pk')
            print(f"\n🗑️ SOLICITUD DE ELIMINACIÓN CATEGORÍA ID: {categoria_id}")

            categoria = self.get_object()
            categoria_nombre = categoria.nombre

            # Verificar productos asociados
            productos_asociados = AppkioskoProductos.objects.filter(categoria=categoria).count()
            if productos_asociados > 0:
                return Response({
                    'success': False,
                    'error': f'No se puede eliminar la categoría "{categoria_nombre}" porque tiene {productos_asociados} productos asociados.',
                    'productos_asociados': productos_asociados,
                    'tipo_restriccion': 'productos'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Verificar ingredientes asociados
            ingredientes_asociados = AppkioskoIngredientes.objects.filter(
                categoria_producto__iexact=categoria_nombre
            ).count()
            if ingredientes_asociados > 0:
                return Response({
                    'success': False,
                    'error': f'No se puede eliminar la categoría "{categoria_nombre}" porque tiene {ingredientes_asociados} ingredientes asociados.',
                    'ingredientes_asociados': ingredientes_asociados,
                    'tipo_restriccion': 'ingredientes'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Eliminar imagen si existe
            try:
                imagen = AppkioskoImagen.objects.get(
                    categoria_imagen='categorias',
                    entidad_relacionada_id=categoria_id
                )
                if imagen.ruta:
                    ruta_completa = os.path.join(settings.MEDIA_ROOT, imagen.ruta.lstrip('/media/'))
                    if os.path.exists(ruta_completa):
                        os.remove(ruta_completa)
                imagen.delete()
            except AppkioskoImagen.DoesNotExist:
                pass

            # Eliminar la categoría
            categoria.delete()

            print(f"✅ CATEGORÍA ELIMINADA: {categoria_nombre}")
            return Response({
                'success': True,
                'mensaje': f'Categoría "{categoria_nombre}" eliminada exitosamente'
            })

        except Exception as e:
            print(f"❌ Error eliminando categoría: {str(e)}")
            return Response({
                'success': False,
                'error': 'Error al eliminar categoría'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ✅ QUITAR la función toggle_categoria_activo ya que no hay campo 'activo'