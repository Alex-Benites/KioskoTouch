from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
import os
from urllib.parse import urlparse, unquote
from django.core.files.storage import default_storage
from django.utils import timezone
from datetime import timedelta
from .models import AppkioskoPromociones, AppkioskoPromocionproductos, AppkioskoPromocionmenu
from ventas.models import AppkioskoPedidos, AppkioskoDetallepedido
from django.db.models import Sum, Q
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
        
        # Filtrar por sección
        seccion = self.request.query_params.get('seccion', None)
        if seccion:
            # ✅ CORREGIDO: Incluir publicidades de la sección específica Y las globales
            queryset = queryset.filter(
                Q(seccion=seccion) | Q(seccion='global')
            )
        
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

@api_view(['GET'])
@permission_classes([AllowAny])
def get_publicidades_activas_publicas(request):
    """
    Endpoint público para obtener publicidades activas para el carrusel.
    Incluye TODAS las imágenes de cada publicidad.
    """
    try:
        print(f"🎬 Solicitud de publicidades activas públicas")
        
        # Filtro correcto usando is_active
        queryset = AppkioskoPublicidades.objects.filter(
            estado__is_active=True
        ).select_related('estado').prefetch_related('appkioskovideo_set')
        
        # Filtrar por tipo si se especifica
        tipo_publicidad = request.query_params.get('tipo_publicidad', None)
        if tipo_publicidad:
            queryset = queryset.filter(tipo_publicidad=tipo_publicidad)
            print(f"   📋 Filtrado por tipo: {tipo_publicidad}")
        
        # Filtrar por sección si se especifica
        seccion = request.query_params.get('seccion', None)
        if seccion:
            # ✅ CORREGIDO: Incluir publicidades de la sección específica Y las globales
            queryset = queryset.filter(
                Q(seccion=seccion) | Q(seccion='global')
            )
            print(f"   📋 Filtrado por sección: {seccion} (incluye globales)")
        
        # Filtrar por fechas vigentes
        from django.utils import timezone
        fecha_actual = timezone.now().date()
        queryset = queryset.filter(
            fecha_inicio_publicidad__lte=fecha_actual,
            fecha_fin_publicidad__gte=fecha_actual
        )
        
        queryset = queryset.order_by('-created_at')
        print(f"   📊 Publicidades encontradas: {queryset.count()}")
        
        # ✅ SERIALIZAR CON MÚLTIPLES IMÁGENES
        resultados = []
        for publicidad in queryset:
            # Obtener videos
            videos = list(publicidad.appkioskovideo_set.all())
            
            if videos:
                # Si tiene video, agregar como item único
                video = videos[0]
                resultados.append({
                    'id': publicidad.id,
                    'nombre': publicidad.nombre,
                    'descripcion': publicidad.descripcion,
                    'media_type': 'video',
                    'media_url': video.ruta,
                    'tiempo_visualizacion': publicidad.tiempo_visualizacion,
                    'duracion_video': video.duracion,
                    'tipo_publicidad': publicidad.tipo_publicidad,
                    'es_multiple': False  
                })
                print(f"   ✅ Video: {publicidad.nombre}")
            else:
                imagenes = AppkioskoImagen.objects.filter(
                    categoria_imagen='publicidad',
                    entidad_relacionada_id=publicidad.id
                ).order_by('id')  # Ordenar por ID para consistencia
                
                if imagenes.exists():
                    imagenes_list = list(imagenes)
                    
                    if len(imagenes_list) == 1:
                        # Una sola imagen - comportamiento normal
                        imagen = imagenes_list[0]
                        resultados.append({
                            'id': publicidad.id,
                            'nombre': publicidad.nombre,
                            'descripcion': publicidad.descripcion,
                            'media_type': 'image',
                            'media_url': imagen.ruta,
                            'tiempo_visualizacion': publicidad.tiempo_visualizacion,
                            'duracion_video': None,
                            'tipo_publicidad': publicidad.tipo_publicidad,
                            'es_multiple': False
                        })
                        print(f"   ✅ Imagen única: {publicidad.nombre}")
                    else:
                 
                        todas_las_imagenes = [img.ruta for img in imagenes_list]
                        resultados.append({
                            'id': publicidad.id,
                            'nombre': publicidad.nombre,
                            'descripcion': publicidad.descripcion,
                            'media_type': 'image_multiple', 
                            'media_url': imagenes_list[0].ruta,  # Primera imagen como principal
                            'media_urls': todas_las_imagenes,    
                            'tiempo_visualizacion': publicidad.tiempo_visualizacion,
                            'duracion_video': None,
                            'tipo_publicidad': publicidad.tipo_publicidad,
                            'es_multiple': True,
                            'total_imagenes': len(imagenes_list)
                        })
                        print(f"   ✅ Múltiples imágenes: {publicidad.nombre} ({len(imagenes_list)} imágenes)")
        
        print(f"   🎯 Items válidos para carrusel: {len(resultados)}")
        return Response(resultados, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error obteniendo publicidades activas: {e}")
        return Response({
            'error': 'Error al obtener publicidades activas',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def estadisticas_promociones(request):
    """Obtener estadísticas completas de promociones"""
    
    print("🔍 === ESTADÍSTICAS DE PROMOCIONES (VERSIÓN CORREGIDA) ===")
    fecha_limite = timezone.now() - timedelta(days=90)
    
    # 1. VENTAS POR PROMOCIÓN (usando el campo promocion en DetallePedido)
    ventas_promocion = []
    promociones = AppkioskoPromociones.objects.all().order_by('id')
    
    for promocion in promociones:
        print(f"\n🔍 Analizando promoción: {promocion.nombre} (ID: {promocion.id})")
        
        # CONTAR DIRECTAMENTE POR EL CAMPO PROMOCION EN DETALLE_PEDIDO
        detalles_con_promocion = AppkioskoDetallepedido.objects.filter(
            promocion=promocion,
            pedido__created_at__gte=fecha_limite
        ).select_related('pedido')
        
        # Contar pedidos únicos (un pedido puede tener múltiples detalles con la misma promoción)
        pedidos_unicos = detalles_con_promocion.values('pedido_id').distinct().count()
        
        # Sumar ingresos totales de esos pedidos
        ingresos_totales = detalles_con_promocion.aggregate(
            total=Sum('subtotal')
        )['total'] or 0
        
        # Verificar si tiene productos o menús asociados
        tiene_productos = AppkioskoPromocionproductos.objects.filter(promocion=promocion).exists()
        tiene_menus = AppkioskoPromocionmenu.objects.filter(promocion=promocion).exists()
        
        ventas_promocion.append({
            'promocion__nombre': promocion.nombre,
            'total_ventas': pedidos_unicos,
            'total_ingresos': float(ingresos_totales),
            'tiene_productos': tiene_productos,
            'tiene_menus': tiene_menus
        })
        
        print(f"   📈 Detalles con promoción: {detalles_con_promocion.count()}")
        print(f"   📈 Pedidos únicos: {pedidos_unicos}")
        print(f"   📈 Ingresos totales: ${ingresos_totales}")
    
    # 2. PROMOCIONES ACTIVAS/INACTIVAS POR ESTADO
    from comun.models import AppkioskoEstados
    
    try:
        estado_activo = AppkioskoEstados.objects.filter(is_active=True).first()
        estado_inactivo = AppkioskoEstados.objects.filter(is_inactive=True).first()
        
        promociones_activas = AppkioskoPromociones.objects.filter(
            estado=estado_activo
        ).count() if estado_activo else 0
        
        promociones_inactivas = AppkioskoPromociones.objects.filter(
            estado=estado_inactivo
        ).count() if estado_inactivo else 0
        
        print(f"\n🎯 Promociones por estado:")
        print(f"   - Activas: {promociones_activas}")
        print(f"   - Inactivas: {promociones_inactivas}")
        
    except Exception as e:
        print(f"⚠️ Error obteniendo estados: {e}")
        promociones_activas = promociones.count()
        promociones_inactivas = 0
    
    # 3. PROMOCIONES MÁS USADAS (usando campo promocion en DetallePedido)
    promociones_mas_usadas = []
    for promocion in promociones:
        # Contar pedidos únicos que usaron esta promoción
        veces_usada = AppkioskoDetallepedido.objects.filter(
            promocion=promocion,
            pedido__created_at__gte=fecha_limite
        ).values('pedido_id').distinct().count()
        
        promociones_mas_usadas.append({
            'promocion__nombre': promocion.nombre,
            'veces_usada': veces_usada
        })
    
    # Ordenar y tomar top 5
    promociones_mas_usadas = sorted(promociones_mas_usadas, key=lambda x: x['veces_usada'], reverse=True)[:5]
    
    # 4. ✅ KPIs CORREGIDOS
    # Total de pedidos en el sistema
    total_pedidos_sistema = AppkioskoPedidos.objects.count()
    
    # Pedidos en los últimos 3 meses
    total_pedidos_periodo = AppkioskoPedidos.objects.filter(
        created_at__gte=fecha_limite
    ).count()
    
    # PEDIDOS QUE USARON PROMOCIONES (por campo promocion en DetallePedido)
    pedidos_con_promocion = AppkioskoPedidos.objects.filter(
        created_at__gte=fecha_limite,
        detalles__promocion__isnull=False
    ).distinct().count()
    
    porcentaje_usuarios_promocion = (pedidos_con_promocion / total_pedidos_periodo * 100) if total_pedidos_periodo > 0 else 0
    
    # TOTAL DE DESCUENTOS APLICADOS (suma de descuento_promocion en DetallePedido)
    total_descuentos = AppkioskoDetallepedido.objects.filter(
        pedido__created_at__gte=fecha_limite,
        promocion__isnull=False
    ).aggregate(total=Sum('descuento_promocion'))['total'] or 0
    
    # 5. TABLA DE PEDIDOS POR MES (CORREGIDA)
    pedidos_por_mes = []
    fecha_inicio_6_meses = timezone.now() - timedelta(days=180)
    
    try:
        # Obtener todos los pedidos del período
        pedidos_periodo = AppkioskoPedidos.objects.filter(
            created_at__gte=fecha_inicio_6_meses
        ).order_by('created_at')
        
        # Agrupar manualmente por mes-año
        meses_data = {}
        
        for pedido in pedidos_periodo:
            # Crear clave mes-año
            fecha_pedido = pedido.created_at
            mes_key = f"{fecha_pedido.year}-{fecha_pedido.month:02d}"
            mes_nombre = f"{fecha_pedido.strftime('%B')} {fecha_pedido.year}"
            
            if mes_key not in meses_data:
                meses_data[mes_key] = {
                    'mes': mes_key,
                    'mes_nombre': mes_nombre,
                    'total_pedidos': 0,
                    'pedidos_con_promocion': 0,
                    'ingresos_totales': 0,
                    'descuentos_aplicados': 0
                }
            
            # Incrementar contadores
            meses_data[mes_key]['total_pedidos'] += 1
            meses_data[mes_key]['ingresos_totales'] += float(pedido.total or 0)
            
            #VERIFICAR SI EL PEDIDO TIENE PROMOCIONES (por DetallePedido)
            tiene_promocion = AppkioskoDetallepedido.objects.filter(
                pedido=pedido,
                promocion__isnull=False
            ).exists()
            
            if tiene_promocion:
                meses_data[mes_key]['pedidos_con_promocion'] += 1
                # Sumar descuentos de este pedido
                descuentos_pedido = AppkioskoDetallepedido.objects.filter(
                    pedido=pedido,
                    promocion__isnull=False
                ).aggregate(total=Sum('descuento_promocion'))['total'] or 0
                meses_data[mes_key]['descuentos_aplicados'] += float(descuentos_pedido)
        
        # Convertir a lista y calcular porcentajes
        for mes_key, datos in meses_data.items():
            porcentaje = (datos['pedidos_con_promocion'] / datos['total_pedidos'] * 100) if datos['total_pedidos'] > 0 else 0
            datos['porcentaje_promocion'] = round(porcentaje, 1)
            pedidos_por_mes.append(datos)
        
        # Ordenar por mes
        pedidos_por_mes.sort(key=lambda x: x['mes'])
        
        print(f"✅ Tabla mensual procesada: {len(pedidos_por_mes)} meses")
        
    except Exception as e:
        print(f"⚠️ Error procesando tabla mensual: {e}")
        # Datos de ejemplo si falla
        pedidos_por_mes = [
            {
                'mes': '2024-12',
                'mes_nombre': 'Diciembre 2024',
                'total_pedidos': 45,
                'pedidos_con_promocion': 12,
                'ingresos_totales': 1250.50,
                'descuentos_aplicados': 89.20,
                'porcentaje_promocion': 26.7
            }
        ]
    
    print(f"\n📈 RESUMEN FINAL:")
    print(f"   Total promociones: {len(ventas_promocion)}")
    print(f"   Promociones activas: {promociones_activas}")
    print(f"   Total pedidos sistema: {total_pedidos_sistema}")
    print(f"   Pedidos último periodo: {total_pedidos_periodo}")
    print(f"   Pedidos con promoción: {pedidos_con_promocion}")
    print(f"   Total descuentos: ${total_descuentos}")
    print(f"   Meses con datos: {len(pedidos_por_mes)}")

    return Response({
        'ventas_por_promocion': ventas_promocion,
        'promociones_activas': promociones_activas,
        'promociones_inactivas': promociones_inactivas,
        'promociones_mas_usadas': promociones_mas_usadas,
        'porcentaje_usuarios_promocion': round(porcentaje_usuarios_promocion, 1),
        'total_descuentos_aplicados': float(total_descuentos),
        'total_pedidos_sistema': total_pedidos_sistema,
        'total_pedidos_periodo': total_pedidos_periodo,
        'pedidos_por_mes': pedidos_por_mes
    })