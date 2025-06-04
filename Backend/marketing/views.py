from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, Prefetch
from .models import AppkioskoPublicidades, AppkioskoVideo
from comun.models import AppkioskoImagen, AppkioskoEstados
from .serializers import (
    PublicidadListSerializer,
    PublicidadDetailSerializer,
    PublicidadCreateSerializer,
    PublicidadUpdateSerializer,
    EstadoSerializer
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
        instance = self.get_object()
        
        # Eliminar archivos de media asociados
        try:
            # Eliminar videos
            videos = AppkioskoVideo.objects.filter(publicidad=instance)
            for video in videos:
                video.delete()
            
            # Eliminar imágenes
            imagenes = AppkioskoImagen.objects.filter(
                categoria_imagen='publicidad',
                entidad_relacionada_id=instance.id
            )
            for imagen in imagenes:
                imagen.delete()
            
        except Exception as e:
            print(f"Error al eliminar archivos de media: {e}")
        
        # Eliminar la publicidad
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
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