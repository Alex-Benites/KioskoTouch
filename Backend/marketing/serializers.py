from rest_framework import serializers
from .models import AppkioskoPublicidades, AppkioskoVideo
from comun.models import AppkioskoImagen, AppkioskoEstados
import os
from django.conf import settings
from django.core.files.storage import default_storage

class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoEstados
        fields = ['id', 'nombre', 'is_active', 'is_inactive']

class ImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoImagen
        fields = ['id', 'ruta', 'categoria_imagen', 'entidad_relacionada_id']

class VideoSerializer(serializers.ModelSerializer):
    duracion_formateada = serializers.SerializerMethodField()
    
    class Meta:
        model = AppkioskoVideo
        fields = ['id', 'nombre', 'ruta', 'duracion', 'duracion_formateada', 'publicidad']
    
    def get_duracion_formateada(self, obj):
        """Retorna la duración en formato MM:SS"""
        if obj.duracion:
            minutos = obj.duracion // 60
            segundos = obj.duracion % 60
            return f"{minutos:02d}:{segundos:02d}"
        return "00:00"

class PublicidadListSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    media_type = serializers.SerializerMethodField()
    media_url = serializers.SerializerMethodField()
    duracion_video = serializers.SerializerMethodField()
    
    class Meta:
        model = AppkioskoPublicidades
        fields = [
            'id', 
            'nombre', 
            'descripcion', 
            'tipo_publicidad',
            'fecha_inicio_publicidad',
            'fecha_fin_publicidad', 
            'estado',
            'estado_nombre',
            'media_type',
            'media_url',
            'duracion_video',
            'created_at'
        ]
    
    def get_media_type(self, obj):
        # Verificar si tiene video
        if hasattr(obj, 'appkioskovideo_set') and obj.appkioskovideo_set.exists():
            return 'video'
        # Verificar si tiene imagen
        imagen = AppkioskoImagen.objects.filter(
            categoria_imagen='publicidad',
            entidad_relacionada_id=obj.id
        ).first()
        if imagen:
            return 'image'
        return None
    
    def get_media_url(self, obj):
        # Verificar si tiene video
        video = obj.appkioskovideo_set.first()
        if video:
            return video.ruta
        # Verificar si tiene imagen
        imagen = AppkioskoImagen.objects.filter(
            categoria_imagen='publicidad',
            entidad_relacionada_id=obj.id
        ).first()
        if imagen:
            return imagen.ruta
        return None
    
    def get_duracion_video(self, obj):
        video = obj.appkioskovideo_set.first()
        if video:
            return video.duracion
        return None

class PublicidadDetailSerializer(serializers.ModelSerializer):
    estado_info = EstadoSerializer(source='estado', read_only=True)
    videos = VideoSerializer(source='appkioskovideo_set', many=True, read_only=True)
    imagenes = serializers.SerializerMethodField()
    media_type = serializers.SerializerMethodField()
    
    class Meta:
        model = AppkioskoPublicidades
        fields = [
            'id',
            'nombre',
            'descripcion',
            'tipo_publicidad',
            'fecha_inicio_publicidad',
            'fecha_fin_publicidad',
            'estado',
            'estado_info',
            'videos',
            'imagenes',
            'media_type',
            'created_at',
            'updated_at'
        ]
    
    def get_imagenes(self, obj):
        imagenes = AppkioskoImagen.objects.filter(
            categoria_imagen='publicidad',
            entidad_relacionada_id=obj.id
        )
        return ImagenSerializer(imagenes, many=True).data
    
    def get_media_type(self, obj):
        if hasattr(obj, 'appkioskovideo_set') and obj.appkioskovideo_set.exists():
            return 'video'
        imagen = AppkioskoImagen.objects.filter(
            categoria_imagen='publicidad',
            entidad_relacionada_id=obj.id
        ).first()
        if imagen:
            return 'image'
        return None

class PublicidadCreateSerializer(serializers.ModelSerializer):
    media_file = serializers.FileField(write_only=True, required=False)
    media_type = serializers.CharField(write_only=True, required=False)
    videoDuration = serializers.IntegerField(write_only=True, required=False)
    tiempo_intervalo_valor = serializers.IntegerField(write_only=True, required=False)
    tiempo_intervalo_unidad = serializers.CharField(write_only=True, required=False)
    
    # CLAVE: Definir estado como IntegerField para evitar auto-conversión a objeto
    estado = serializers.IntegerField()
    
    class Meta:
        model = AppkioskoPublicidades
        fields = [
            'nombre',
            'descripcion',
            'tipo_publicidad',
            'fecha_inicio_publicidad',
            'fecha_fin_publicidad',
            'estado',
            'media_file',
            'media_type',
            'videoDuration',
            'tiempo_intervalo_valor',
            'tiempo_intervalo_unidad'
        ]
    
    def validate_media_file(self, value):
        """Validar tamaño y tipo de archivo"""
        if value:
            # Validar tamaño (50MB máximo)
            max_size = 50 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError("El archivo no puede ser mayor a 50MB")
            
            # Validar tipo de archivo
            allowed_image_types = ['image/jpeg', 'image/png', 'image/gif']
            allowed_video_types = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi']
            
            if not (value.content_type in allowed_image_types or value.content_type in allowed_video_types):
                raise serializers.ValidationError("Tipo de archivo no soportado")
        
        return value
    
    def validate_estado(self, value):
        """Validar que el estado existe - AHORA DEBERÍA RECIBIR INT"""
        print(f"=== DEBUG ESTADO EN BACKEND (CORREGIDO) ===")
        print(f"Valor recibido: {value}")
        print(f"Tipo del valor: {type(value)}")
        print(f"Repr del valor: {repr(value)}")
        
        # Ahora debería llegar como int directamente
        if not isinstance(value, int):
            raise serializers.ValidationError("Estado debe ser un número entero")
        
        # Verificar que existe en la base de datos
        if not AppkioskoEstados.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Estado con ID {value} no existe")
        
        print(f"Estado {value} es válido ✓")
        return value
    
    def validate(self, attrs):
        """Validaciones personalizadas"""
        # Validar que las fechas sean coherentes
        fecha_inicio = attrs.get('fecha_inicio_publicidad')
        fecha_fin = attrs.get('fecha_fin_publicidad')
        
        if fecha_inicio and fecha_fin and fecha_inicio >= fecha_fin:
            raise serializers.ValidationError("La fecha de inicio debe ser anterior a la fecha de fin")
        
        return attrs
    
    def create(self, validated_data):
        # Extraer datos de media
        media_file = validated_data.pop('media_file', None)
        media_type = validated_data.pop('media_type', None)
        video_duration = validated_data.pop('videoDuration', None)
        tiempo_intervalo_valor = validated_data.pop('tiempo_intervalo_valor', None)
        tiempo_intervalo_unidad = validated_data.pop('tiempo_intervalo_unidad', None)
        
        # CONVERTIR ID del estado al objeto AppkioskoEstados
        estado_id = validated_data.get('estado')
        if estado_id:
            try:
                estado_obj = AppkioskoEstados.objects.get(id=estado_id)
                validated_data['estado'] = estado_obj
                print(f"Estado convertido: ID {estado_id} -> objeto {estado_obj}")
            except AppkioskoEstados.DoesNotExist:
                raise serializers.ValidationError(f"Estado con ID {estado_id} no existe")
        
        print(f"Estado final a crear: {validated_data.get('estado')} (tipo: {type(validated_data.get('estado'))})")
        
        # Crear la publicidad (ahora con el objeto estado)
        publicidad = AppkioskoPublicidades.objects.create(**validated_data)
        
        # Manejar el archivo de media
        if media_file and media_type:
            self._handle_media_file(
                publicidad, 
                media_file, 
                media_type, 
                video_duration, 
                tiempo_intervalo_valor, 
                tiempo_intervalo_unidad
            )
        
        return publicidad
    
    def _handle_media_file(self, publicidad, media_file, media_type, video_duration, tiempo_valor, tiempo_unidad):
        """Manejar la subida y guardado del archivo de media en media/publicidad"""
        # Crear directorio media/publicidad si no existe
        media_dir = os.path.join(settings.MEDIA_ROOT, 'publicidad')
        os.makedirs(media_dir, exist_ok=True)
        
        # Generar nombre único para el archivo
        file_extension = os.path.splitext(media_file.name)[1]
        filename = f"publicidad_{publicidad.id}_{media_file.name}"
        file_path = os.path.join('publicidad', filename)
        
        # Guardar archivo en media/publicidad
        saved_path = default_storage.save(file_path, media_file)
        full_url = default_storage.url(saved_path)
        
        if media_type == 'video':
            # Crear registro de video
            AppkioskoVideo.objects.create(
                nombre=media_file.name,
                ruta=full_url,
                duracion=video_duration or 0,
                publicidad=publicidad
            )
        elif media_type == 'image':
            # Crear registro de imagen
            AppkioskoImagen.objects.create(
                ruta=full_url,
                categoria_imagen='publicidad',
                entidad_relacionada_id=publicidad.id
            )

class PublicidadUpdateSerializer(serializers.ModelSerializer):
    estado_str = serializers.CharField(write_only=True, required=False)
    # Agregar campos de media
    media_file = serializers.FileField(write_only=True, required=False)
    media_type = serializers.CharField(write_only=True, required=False)
    videoDuration = serializers.IntegerField(write_only=True, required=False)
    tiempo_intervalo_valor = serializers.IntegerField(write_only=True, required=False)
    tiempo_intervalo_unidad = serializers.CharField(write_only=True, required=False)
    remove_media = serializers.BooleanField(write_only=True, required=False)
    
    class Meta:
        model = AppkioskoPublicidades
        fields = [
            'nombre',
            'descripcion',
            'tipo_publicidad',
            'fecha_inicio_publicidad',
            'fecha_fin_publicidad',
            'estado',
            'estado_str',
            'media_file',
            'media_type',
            'videoDuration',
            'tiempo_intervalo_valor',
            'tiempo_intervalo_unidad',
            'remove_media'
        ]
    
    def validate_media_file(self, value):
        """Validar tamaño y tipo de archivo (igual que en create)"""
        if value:
            max_size = 50 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError("El archivo no puede ser mayor a 50MB")
            
            allowed_image_types = ['image/jpeg', 'image/png', 'image/gif']
            allowed_video_types = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi']
            
            if not (value.content_type in allowed_image_types or value.content_type in allowed_video_types):
                raise serializers.ValidationError("Tipo de archivo no soportado")
        
        return value
    
    def update(self, instance, validated_data):
        # Extraer datos de media
        media_file = validated_data.pop('media_file', None)
        media_type = validated_data.pop('media_type', None)
        video_duration = validated_data.pop('videoDuration', None)
        tiempo_intervalo_valor = validated_data.pop('tiempo_intervalo_valor', None)
        tiempo_intervalo_unidad = validated_data.pop('tiempo_intervalo_unidad', None)
        remove_media = validated_data.pop('remove_media', False)
        
        # Manejar estado si viene como string
        estado_str = validated_data.pop('estado_str', None)
        if estado_str:
            if estado_str.lower() == 'activo':
                estado = AppkioskoEstados.objects.filter(nombre='Activado').first()
            elif estado_str.lower() == 'inactivo':
                estado = AppkioskoEstados.objects.filter(nombre='Desactivado').first()
            else:
                estado = AppkioskoEstados.objects.filter(nombre__icontains=estado_str).first()
            
            if estado:
                validated_data['estado'] = estado
        
        # Actualizar campos básicos
        instance = super().update(instance, validated_data)
        
        # Manejar eliminación de media
        if remove_media:
            self._remove_existing_media(instance)
        
        # Manejar nuevo archivo de media
        if media_file and media_type:
            # Eliminar media existente antes de agregar el nuevo
            self._remove_existing_media(instance)
            # Agregar nuevo media
            self._handle_media_file(
                instance, 
                media_file, 
                media_type, 
                video_duration, 
                tiempo_intervalo_valor, 
                tiempo_intervalo_unidad
            )
        
        return instance
    
    def _remove_existing_media(self, publicidad):
        """Eliminar archivos de media existentes"""
        try:
            # Eliminar videos
            videos = AppkioskoVideo.objects.filter(publicidad=publicidad)
            for video in videos:
                video.delete()
            
            # Eliminar imágenes
            imagenes = AppkioskoImagen.objects.filter(
                categoria_imagen='publicidad',
                entidad_relacionada_id=publicidad.id
            )
            for imagen in imagenes:
                imagen.delete()
        except Exception as e:
            print(f"Error al eliminar media existente: {e}")
    
    def _handle_media_file(self, publicidad, media_file, media_type, video_duration, tiempo_valor, tiempo_unidad):
        """Manejar la subida y guardado del archivo de media (mismo que en create)"""
        # Crear directorio media/publicidad si no existe
        media_dir = os.path.join(settings.MEDIA_ROOT, 'publicidad')
        os.makedirs(media_dir, exist_ok=True)
        
        # Generar nombre único para el archivo
        file_extension = os.path.splitext(media_file.name)[1]
        filename = f"publicidad_{publicidad.id}_{media_file.name}"
        file_path = os.path.join('publicidad', filename)
        
        # Guardar archivo en media/publicidad
        saved_path = default_storage.save(file_path, media_file)
        full_url = default_storage.url(saved_path)
        
        if media_type == 'video':
            # Crear registro de video
            AppkioskoVideo.objects.create(
                nombre=media_file.name,
                ruta=full_url,
                duracion=video_duration or 0,
                publicidad=publicidad
            )
        elif media_type == 'image':
            # Crear registro de imagen
            AppkioskoImagen.objects.create(
                ruta=full_url,
                categoria_imagen='publicidad',
                entidad_relacionada_id=publicidad.id
            )