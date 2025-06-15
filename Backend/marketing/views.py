from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.conf import settings
import os
from urllib.parse import urlparse, unquote
from django.core.files.storage import default_storage

from .models import AppkioskoPublicidades, AppkioskoVideo, AppkioskoPromociones
from comun.models import AppkioskoImagen, AppkioskoEstados
from .serializers import (
    PublicidadListSerializer,
    PublicidadDetailSerializer,
    PublicidadCreateSerializer,
    PublicidadUpdateSerializer,
    EstadoSerializer,
    PromocionSerializer
)
import logging

logger = logging.getLogger(__name__)

class PublicidadListCreateView(generics.ListCreateAPIView):
    queryset = AppkioskoPublicidades.objects.all().order_by('-created_at')
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['created_at', 'fecha_inicio_publicidad', 'fecha_fin_publicidad']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrado personalizado con optimización de queries"""
        queryset = super().get_queryset()
        
        # ✅ OPTIMIZACIÓN CRÍTICA: Prefetch para evitar N+1 queries
        queryset = queryset.select_related('estado').prefetch_related('appkioskovideo_set')
        
        # Filtrar por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado_id=estado)
        
        # Filtrar por tipo de publicidad
        tipo_publicidad = self.request.query_params.get('tipo_publicidad', None)
        if tipo_publicidad:
            queryset = queryset.filter(tipo_publicidad=tipo_publicidad)
        
        # Filtrar por estado activo/inactivo
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            if activo.lower() == 'true':
                queryset = queryset.filter(estado__is_active=True)
            elif activo.lower() == 'false':
                queryset = queryset.filter(estado__is_inactive=True)
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PublicidadCreateSerializer
        return PublicidadListSerializer
    
    def list(self, request, *args, **kwargs):
        """Sobrescribir list para debugging"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # ✅ DEBUG: Verificar que las relaciones se estén precargando
        print(f"🔍 Total publicidades: {queryset.count()}")
        for pub in queryset[:3]:  # Solo las primeras 3 para debug
            print(f"🔍 Publicidad {pub.id}: {pub.nombre}")
            
            # Verificar videos
            videos = list(pub.appkioskovideo_set.all())
            print(f"   - Videos: {len(videos)}")
            if videos:
                print(f"   - Primer video: {videos[0].ruta}")
            
            # Verificar imágenes
            imagenes = AppkioskoImagen.objects.filter(
                categoria_imagen='publicidad',
                entidad_relacionada_id=pub.id
            )
            print(f"   - Imágenes: {imagenes.count()}")
            if imagenes.exists():
                print(f"   - Primera imagen: {imagenes.first().ruta}")
            
            # Verificar prefetch cache
            if hasattr(pub, '_prefetched_objects_cache'):
                print(f"   - Cache prefetch: {list(pub._prefetched_objects_cache.keys())}")
            else:
                print(f"   - ❌ No hay cache prefetch")
        
        # Continuar con la lógica normal
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        
        # ✅ DEBUG: Verificar datos serializados
        print(f"🔍 Datos serializados (primeros 2):")
        for i, item in enumerate(serializer.data[:2]):
            print(f"   Item {i+1}: {item.get('nombre')} - media_type: {item.get('media_type')} - media_url: {item.get('media_url')}")
        
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        logger.info("=== CREAR PUBLICIDAD ===")
        logger.info(f"Request data: {request.data}")
        logger.info(f"Request files: {request.FILES}")
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            publicidad = serializer.save()
            response_serializer = PublicidadDetailSerializer(publicidad)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Errores de validación: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PublicidadDetailView(generics.RetrieveUpdateDestroyAPIView):
    parser_classes = (MultiPartParser, FormParser)
    
    def get_queryset(self):
        """Optimización para vista de detalle"""
        return AppkioskoPublicidades.objects.select_related('estado').prefetch_related(
            'appkioskovideo_set'
        )
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PublicidadUpdateSerializer
        return PublicidadDetailSerializer
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar publicidad y sus archivos asociados"""
        try:
            publicidad = self.get_object()
            print(f"🗑️ Eliminando publicidad ID {publicidad.id}: {publicidad.nombre}")
            
            # Eliminar archivos físicos antes de eliminar de BD
            self._delete_media_files(publicidad)
            
            # Eliminar la publicidad (esto eliminará automáticamente las relaciones)
            response = super().destroy(request, *args, **kwargs)
            
            print(f"✅ Publicidad eliminada completamente")
            return response
            
        except Exception as e:
            print(f"❌ Error al eliminar publicidad: {e}")
            return Response(
                {'error': f'Error al eliminar la publicidad: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _delete_media_files(self, publicidad):
        """Eliminar archivos físicos de una publicidad"""
        try:
            print(f"🗑️ Eliminando archivos de media para publicidad ID {publicidad.id}")
            
            # Eliminar videos
            videos = AppkioskoVideo.objects.filter(publicidad=publicidad)
            for video in videos:
                self._delete_physical_file(video.ruta)
                print(f"🗑️ Video eliminado: {video.ruta}")
            
            # Eliminar imágenes
            imagenes = AppkioskoImagen.objects.filter(
                categoria_imagen='publicidad',
                entidad_relacionada_id=publicidad.id
            )
            for imagen in imagenes:
                self._delete_physical_file(imagen.ruta)
                print(f"🗑️ Imagen eliminada: {imagen.ruta}")
                
        except Exception as e:
            print(f"❌ Error al eliminar archivos de media: {e}")

    def _delete_physical_file(self, file_path):
        """Eliminar archivo físico del sistema de archivos"""
        try:
            if not file_path:
                return
            
            print(f"🔍 Intentando eliminar archivo: {file_path}")
            
            # Convertir URL a path relativo
            relative_path = None
            
            if file_path.startswith(('http://', 'https://')):
                # Si es URL completa: http://localhost:8000/media/publicidad/archivo.mp4
                from urllib.parse import urlparse
                parsed = urlparse(file_path)
                path_part = parsed.path  # /media/publicidad/archivo.mp4
                if path_part.startswith('/media/'):
                    relative_path = path_part[7:]  # publicidad/archivo.mp4
                else:
                    relative_path = path_part.lstrip('/')
                    
            elif file_path.startswith('/media/'):
                # Si empieza con /media/: /media/publicidad/archivo.mp4
                relative_path = file_path[7:]  # publicidad/archivo.mp4
                
            elif file_path.startswith('media/'):
                # Si empieza con media/: media/publicidad/archivo.mp4
                relative_path = file_path[6:]  # publicidad/archivo.mp4
                
            else:
                # Si ya es un path relativo: publicidad/archivo.mp4
                relative_path = file_path
            
            if not relative_path:
                print(f"❌ No se pudo determinar path relativo para: {file_path}")
                return
                
            # ✅ DECODIFICAR URL - Esta es la parte que faltaba!
            from urllib.parse import unquote
            relative_path = unquote(relative_path)
            print(f"📁 Path relativo decodificado: {relative_path}")
            
            # Construir el path completo físico
            full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
            print(f"📂 Path completo: {full_path}")
            
            # Verificar si el archivo existe y eliminarlo
            if os.path.exists(full_path):
                os.remove(full_path)
                print(f"✅ Archivo físico eliminado: {full_path}")
            else:
                print(f"⚠️ Archivo no encontrado: {full_path}")
                # Debug adicional: listar archivos en el directorio
                import glob
                directorio = os.path.dirname(full_path)
                if os.path.exists(directorio):
                    archivos_en_directorio = glob.glob(os.path.join(directorio, "*"))
                    print(f"🔍 Archivos en {directorio}:")
                    for archivo in archivos_en_directorio[:5]:  # Solo mostrar 5
                        print(f"   - {os.path.basename(archivo)}")
            
            # También intentar con default_storage como respaldo
            try:
                # Para default_storage, usar la ruta original codificada
                original_relative = file_path[7:] if file_path.startswith('/media/') else file_path
                if default_storage.exists(original_relative):
                    default_storage.delete(original_relative)
                    print(f"✅ Archivo eliminado via default_storage: {original_relative}")
            except Exception as storage_error:
                print(f"⚠️ Error con default_storage: {storage_error}")
                
        except Exception as e:
            print(f"❌ Error al eliminar archivo físico {file_path}: {e}")
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            self.perform_update(serializer)
            # Retornar con el serializer de detalle para incluir toda la info
            response_serializer = PublicidadDetailSerializer(instance)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EstadoListView(generics.ListAPIView):
    queryset = AppkioskoEstados.objects.all()
    serializer_class = EstadoSerializer

class PublicidadToggleEstadoView(generics.UpdateAPIView):
    serializer_class = PublicidadDetailSerializer
    
    def get_queryset(self):
        """Optimización para toggle estado"""
        return AppkioskoPublicidades.objects.select_related('estado')
    
    def patch(self, request, *args, **kwargs):
        publicidad = self.get_object()
        
        try:
            # Obtener estados activo e inactivo
            if publicidad.estado and publicidad.estado.is_active:
                # Cambiar a inactivo
                estado_inactivo = AppkioskoEstados.objects.filter(is_inactive=True).first()
                if estado_inactivo:
                    publicidad.estado = estado_inactivo
            else:
                # Cambiar a activo
                estado_activo = AppkioskoEstados.objects.filter(is_active=True).first()
                if estado_activo:
                    publicidad.estado = estado_activo
            
            publicidad.save()
            serializer = self.get_serializer(publicidad)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Error al cambiar el estado de la publicidad'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class PublicidadStatsView(generics.GenericAPIView):
    def get(self, request):
        # ✅ OPTIMIZACIÓN: Queries más eficientes para estadísticas
        total = AppkioskoPublicidades.objects.count()
        
        # Usar select_related para estado
        publicidades_con_estado = AppkioskoPublicidades.objects.select_related('estado')
        activas = publicidades_con_estado.filter(estado__is_active=True).count()
        inactivas = publicidades_con_estado.filter(estado__is_inactive=True).count()
        
        # Contar por tipo de media
        publicidades_con_video = AppkioskoPublicidades.objects.filter(
            appkioskovideo__isnull=False
        ).distinct().count()
        
        publicidades_con_imagen = AppkioskoPublicidades.objects.filter(
            id__in=AppkioskoImagen.objects.filter(
                categoria_imagen='publicidad'
            ).values_list('entidad_relacionada_id', flat=True)
        ).count()
        
        # Estadísticas por tipo de publicidad
        stats_tipo = {}
        tipos = AppkioskoPublicidades.objects.values_list('tipo_publicidad', flat=True).distinct()
        for tipo in tipos:
            if tipo:
                stats_tipo[tipo] = AppkioskoPublicidades.objects.filter(tipo_publicidad=tipo).count()
        
        return Response({
            'total': total,
            'activas': activas,
            'inactivas': inactivas,
            'con_video': publicidades_con_video,
            'con_imagen': publicidades_con_imagen,
            'por_tipo': stats_tipo
        })

# === LISTAR Y CREAR PROMOCIONES ===
class PromocionListCreateAPIView(generics.ListCreateAPIView):
    queryset = AppkioskoPromociones.objects.all().order_by('-created_at')
    serializer_class = PromocionSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        print(f"\n🚀 CREANDO PROMOCIÓN:")
        print(f"   Datos recibidos: {list(request.data.keys())}")

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            promocion = serializer.save()
            print(f"🎉 PROMOCIÓN CREADA EXITOSAMENTE: ID {promocion.id} - {promocion.nombre}")
            return Response({
                'mensaje': '🎉 Promoción creada exitosamente',
                'promocion': PromocionSerializer(promocion).data
            }, status=status.HTTP_201_CREATED)
        else:
            print(f"❌ ERRORES DE VALIDACIÓN:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
            return Response({
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

# === DETALLE, ACTUALIZAR Y ELIMINAR PROMOCIÓN ===
class PromocionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AppkioskoPromociones.objects.all()
    serializer_class = PromocionSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        print(f"\n🔄 ACTUALIZANDO PROMOCIÓN ID: {kwargs.get('pk')}")
        print(f"   Datos recibidos: {list(request.data.keys())}")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            promocion = serializer.save()
            print(f"✅ PROMOCIÓN ACTUALIZADA: ID {promocion.id} - {promocion.nombre}")
            return Response({
                'mensaje': '✅ Promoción actualizada exitosamente',
                'promocion': PromocionSerializer(promocion).data
            })
        else:
            print(f"❌ ERRORES DE VALIDACIÓN:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
            return Response({
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            promocion_id = kwargs.get('pk')
            print(f"\n🗑️ ELIMINACIÓN FÍSICA PROMOCIÓN ID: {promocion_id}")

            promocion = self.get_object()
            promocion_nombre = promocion.nombre
            print(f"   Promoción a eliminar: {promocion_nombre}")

            # Eliminar imagen física si existe
            try:
                imagen = AppkioskoImagen.objects.get(
                    categoria_imagen='promociones',
                    entidad_relacionada_id=promocion_id
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
                print(f"   ℹ️ No se encontró imagen asociada a la promoción")
            except Exception as e:
                print(f"   ⚠️ Error eliminando imagen: {str(e)}")

            # Eliminar la promoción
            promocion.delete()
            print(f"✅ PROMOCIÓN ELIMINADA COMPLETAMENTE: {promocion_nombre} (ID: {promocion_id})")
            return Response({
                'success': True,
                'mensaje': f'Promoción "{promocion_nombre}" eliminada completamente',
                'id': int(promocion_id)
            }, status=status.HTTP_200_OK)

        except AppkioskoPromociones.DoesNotExist:
            print(f"❌ Promoción ID {promocion_id} no encontrada")
            return Response({
                'success': False,
                'error': 'Promoción no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Error eliminando promoción: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al eliminar promoción: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# === OBTENER SOLO LA IMAGEN DE UNA PROMOCIÓN ===
@api_view(['GET'])
@permission_classes([AllowAny])
def get_promocion_imagen(request, promocion_id):
    """Obtiene solo la imagen de una promoción específica"""
    try:
        imagen = AppkioskoImagen.objects.get(
            categoria_imagen='promociones',
            entidad_relacionada_id=promocion_id
        )
        return Response({'imagen_url': imagen.ruta})
    except AppkioskoImagen.DoesNotExist:
        return Response({'imagen_url': None})
    except Exception as e:
        return Response({'error': str(e)}, status=400)

# ✅ SOLO AGREGAR esta nueva vista al final del archivo
@api_view(['GET'])
@permission_classes([AllowAny])
def get_tamanos_promociones(request):
    """Obtener todos los tamaños disponibles para promociones"""
    try:
        from catalogo.models import AppkioskoTamanos
        from catalogo.serializers import TamanoSerializer
        
        tamanos = AppkioskoTamanos.objects.filter(activo=True).order_by('orden', 'nombre')
        serializer = TamanoSerializer(tamanos, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=400)