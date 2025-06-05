import uuid
from rest_framework import serializers
from .models import AppkioskoPublicidades, AppkioskoVideo
from comun.models import AppkioskoImagen, AppkioskoEstados
import os
from django.conf import settings
from django.core.files.storage import default_storage
from .models import AppkioskoPromociones, AppkioskoPromocionproductos, AppkioskoPromocionmenu
from catalogo.models import AppkioskoProductos, AppkioskoMenus
from catalogo.serializers import ProductoSerializer, MenuSerializer

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
            'tiempo_visualizacion',
            'media_type',
            'media_url',
            'duracion_video',
            'created_at'
        ]
    
    def get_media_type(self, obj):
        try:
            print(f"🔍 get_media_type para publicidad ID {obj.id}")
            
            # ✅ CORREGIDO: Verificar videos precargados correctamente
            if hasattr(obj, '_prefetched_objects_cache') and 'appkioskovideo_set' in obj._prefetched_objects_cache:
                videos_list = list(obj._prefetched_objects_cache['appkioskovideo_set'])
                print(f"   - Videos en cache: {len(videos_list)}")
                if videos_list:
                    print(f"   - ✅ TIPO: video (desde cache)")
                    return 'video'
            else:
                # Fallback - query directa
                videos_count = obj.appkioskovideo_set.count()
                print(f"   - Videos (query directa): {videos_count}")
                if videos_count > 0:
                    print(f"   - ✅ TIPO: video (desde query)")
                    return 'video'
            
            # Verificar imágenes
            imagen = AppkioskoImagen.objects.filter(
                categoria_imagen='publicidad',
                entidad_relacionada_id=obj.id
            ).first()
            if imagen:
                print(f"   - ✅ TIPO: image")
                return 'image'
                
            print(f"   - ⚠️ TIPO: None (sin media)")
                
        except Exception as e:
            print(f"❌ Error en get_media_type: {e}")
            # Debug: imprimir atributos disponibles
            print(f"🔍 Atributos de obj: {[attr for attr in dir(obj) if not attr.startswith('_')]}")
            if hasattr(obj, '_prefetched_objects_cache'):
                print(f"🔍 Cache prefetch: {list(obj._prefetched_objects_cache.keys())}")
        
        return None
    
    def get_media_url(self, obj):
        try:
            print(f"🔍 get_media_url para publicidad ID {obj.id}")
            
            # ✅ CORREGIDO: Verificar videos precargados
            if hasattr(obj, '_prefetched_objects_cache') and 'appkioskovideo_set' in obj._prefetched_objects_cache:
                videos_list = list(obj._prefetched_objects_cache['appkioskovideo_set'])
                if videos_list:
                    video = videos_list[0]
                    print(f"   - ✅ Video URL (cache): {video.ruta}")
                    return video.ruta
            else:
                # Fallback - query directa
                video = obj.appkioskovideo_set.first()
                if video:
                    print(f"   - ✅ Video URL (query): {video.ruta}")
                    return video.ruta
            
            # Buscar imagen
            imagen = AppkioskoImagen.objects.filter(
                categoria_imagen='publicidad',
                entidad_relacionada_id=obj.id
            ).first()
            if imagen:
                print(f"   - ✅ Imagen URL: {imagen.ruta}")
                return imagen.ruta
                
        except Exception as e:
            print(f"❌ Error en get_media_url: {e}")
        
        print(f"   - ⚠️ No se encontró media para publicidad ID: {obj.id}")
        return None
    
    def get_duracion_video(self, obj):
        try:
            # ✅ CORREGIDO: Verificar videos precargados
            if hasattr(obj, '_prefetched_objects_cache') and 'appkioskovideo_set' in obj._prefetched_objects_cache:
                videos_list = list(obj._prefetched_objects_cache['appkioskovideo_set'])
                if videos_list:
                    duracion = videos_list[0].duracion
                    print(f"   - ✅ Duración video (cache): {duracion}")
                    return duracion
            else:
                # Fallback
                video = obj.appkioskovideo_set.first()
                if video:
                    print(f"   - ✅ Duración video (query): {video.duracion}")
                    return video.duracion
        except Exception as e:
            print(f"❌ Error en get_duracion_video: {e}")
        
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
            'tiempo_visualizacion',
            'videos',
            'imagenes',
            'media_type',
            'created_at',
            'updated_at'
        ]
    
    def get_imagenes(self, obj):
        try:
            imagenes = AppkioskoImagen.objects.filter(
                categoria_imagen='publicidad',
                entidad_relacionada_id=obj.id
            )
            return ImagenSerializer(imagenes, many=True).data
        except Exception as e:
            print(f"Error en get_imagenes: {e}")
            return []
    
    def get_media_type(self, obj):
        try:
            # Videos precargados
            if hasattr(obj, '_prefetched_objects_cache') and 'appkioskovideo_set' in obj._prefetched_objects_cache:
                videos_list = list(obj._prefetched_objects_cache['appkioskovideo_set'])
                if videos_list:
                    return 'video'
            # Fallback
            elif obj.appkioskovideo_set.exists():
                return 'video'
            
            # Verificar imágenes
            imagen = AppkioskoImagen.objects.filter(
                categoria_imagen='publicidad',
                entidad_relacionada_id=obj.id
            ).first()
            if imagen:
                return 'image'
        except Exception as e:
            print(f"Error en get_media_type: {e}")
        
        return None

class PublicidadCreateSerializer(serializers.ModelSerializer):
    media_file = serializers.FileField(write_only=True, required=False)
    media_type = serializers.CharField(write_only=True, required=False)
    videoDuration = serializers.IntegerField(write_only=True, required=False)
    tiempo_visualizacion = serializers.IntegerField(required=False)
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
            'tiempo_visualizacion',
            'media_file',
            'media_type',
            'videoDuration'
        ]
    
    def validate_media_file(self, value):
        if value:
            max_size = 50 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError("El archivo no puede ser mayor a 50MB")
            
            allowed_image_types = ['image/jpeg', 'image/png', 'image/gif']
            allowed_video_types = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi']
            
            if not (value.content_type in allowed_image_types or value.content_type in allowed_video_types):
                raise serializers.ValidationError("Tipo de archivo no soportado")
        
        return value
    
    def validate_estado(self, value):
        if not isinstance(value, int):
            raise serializers.ValidationError("Estado debe ser un número entero")
        
        if not AppkioskoEstados.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Estado con ID {value} no existe")
        
        return value
    
    def validate(self, attrs):
        fecha_inicio = attrs.get('fecha_inicio_publicidad')
        fecha_fin = attrs.get('fecha_fin_publicidad')
        
        if fecha_inicio and fecha_fin and fecha_inicio >= fecha_fin:
            raise serializers.ValidationError("La fecha de inicio debe ser anterior a la fecha de fin")
        
        return attrs
    
    def create(self, validated_data):
        media_file = validated_data.pop('media_file', None)
        media_type = validated_data.pop('media_type', None)
        video_duration = validated_data.pop('videoDuration', None)
        tiempo_visualizacion = validated_data.get('tiempo_visualizacion', 5)
        
        print(f"✅ Creando publicidad con tiempo_visualizacion: {tiempo_visualizacion}")
        
        estado_id = validated_data.get('estado')
        if estado_id:
            try:
                estado_obj = AppkioskoEstados.objects.get(id=estado_id)
                validated_data['estado'] = estado_obj
            except AppkioskoEstados.DoesNotExist:
                raise serializers.ValidationError(f"Estado con ID {estado_id} no existe")
        
        publicidad = AppkioskoPublicidades.objects.create(**validated_data)
        print(f"✅ Publicidad creada ID {publicidad.id} con tiempo_visualizacion: {publicidad.tiempo_visualizacion}")
        
        if media_file and media_type:
            self._handle_media_file(publicidad, media_file, media_type, video_duration)
        
        return publicidad
    
    def _handle_media_file(self, publicidad, media_file, media_type, video_duration):
        media_dir = os.path.join(settings.MEDIA_ROOT, 'publicidad')
        os.makedirs(media_dir, exist_ok=True)
        
        filename = f"publicidad_{publicidad.id}_{media_file.name}"
        file_path = os.path.join('publicidad', filename)
        saved_path = default_storage.save(file_path, media_file)
        full_url = default_storage.url(saved_path)
        
        print(f"✅ Archivo guardado en: {full_url}")
        
        if media_type == 'video':
            video = AppkioskoVideo.objects.create(
                nombre=media_file.name,
                ruta=full_url,
                duracion=video_duration or 0,
                publicidad=publicidad
            )
            print(f"✅ Video creado ID {video.id}: {video.ruta}")
        elif media_type == 'image':
            imagen = AppkioskoImagen.objects.create(
                ruta=full_url,
                categoria_imagen='publicidad',
                entidad_relacionada_id=publicidad.id
            )
            print(f"✅ Imagen creada ID {imagen.id}: {imagen.ruta}")

class PublicidadUpdateSerializer(serializers.ModelSerializer):
    estado_str = serializers.CharField(write_only=True, required=False)
    media_file = serializers.FileField(write_only=True, required=False)
    media_type = serializers.CharField(write_only=True, required=False)
    videoDuration = serializers.IntegerField(write_only=True, required=False)
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
            'tiempo_visualizacion',
            'media_file',
            'media_type',
            'videoDuration',
            'remove_media'
        ]
    
    def validate_media_file(self, value):
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
        media_file = validated_data.pop('media_file', None)
        media_type = validated_data.pop('media_type', None)
        video_duration = validated_data.pop('videoDuration', None)
        remove_media = validated_data.pop('remove_media', False)
        
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
        
        instance = super().update(instance, validated_data)
        
        if remove_media:
            self._remove_existing_media(instance)
        
        if media_file and media_type:
            self._remove_existing_media(instance)
            self._handle_media_file(instance, media_file, media_type, video_duration)
        
        return instance
    
    def _remove_existing_media(self, publicidad):
        try:
            videos = AppkioskoVideo.objects.filter(publicidad=publicidad)
            for video in videos:
                video.delete()
            
            imagenes = AppkioskoImagen.objects.filter(
                categoria_imagen='publicidad',
                entidad_relacionada_id=publicidad.id
            )
            for imagen in imagenes:
                imagen.delete()
        except Exception as e:
            print(f"Error al eliminar media existente: {e}")
    
    def _handle_media_file(self, publicidad, media_file, media_type, video_duration):
        media_dir = os.path.join(settings.MEDIA_ROOT, 'publicidad')
        os.makedirs(media_dir, exist_ok=True)
        
        filename = f"publicidad_{publicidad.id}_{media_file.name}"
        file_path = os.path.join('publicidad', filename)
        saved_path = default_storage.save(file_path, media_file)
        full_url = default_storage.url(saved_path)
        
        if media_type == 'video':
            AppkioskoVideo.objects.create(
                nombre=media_file.name,
                ruta=full_url,
                duracion=video_duration or 0,
                publicidad=publicidad
            )
        elif media_type == 'image':
            AppkioskoImagen.objects.create(
                ruta=full_url,
                categoria_imagen='publicidad',
                entidad_relacionada_id=publicidad.id
            )

class PromocionProductoDetalleSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    class Meta:
        model = AppkioskoPromocionproductos
        fields = ['id', 'producto']

class PromocionMenuDetalleSerializer(serializers.ModelSerializer):
    menu = MenuSerializer(read_only=True)
    class Meta:
        model = AppkioskoPromocionmenu
        fields = ['id', 'menu']

class PromocionSerializer(serializers.ModelSerializer):
    productos = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    menus = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    productos_detalle = serializers.SerializerMethodField(read_only=True)
    menus_detalle = serializers.SerializerMethodField(read_only=True)
    imagen = serializers.ImageField(write_only=True, required=False)
    imagen_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AppkioskoPromociones
        fields = [
            'id', 'nombre', 'descripcion', 'valor_descuento',
            'fecha_inicio_promo', 'fecha_fin_promo', 'tipo_promocion',
            'codigo_promocional', 'limite_uso_usuario', 'estado', 'limite_uso_total',
            'created_at', 'updated_at',
            'productos', 'menus', 'productos_detalle', 'menus_detalle',
            'imagen', 'imagen_url'
        ]

    def get_imagen_url(self, obj):
        try:
            imagen = AppkioskoImagen.objects.get(
                categoria_imagen='promociones',
                entidad_relacionada_id=obj.id
            )
            return imagen.ruta
        except AppkioskoImagen.DoesNotExist:
            return None

    def get_productos_detalle(self, obj):
        rels = AppkioskoPromocionproductos.objects.filter(promocion=obj)
        return PromocionProductoDetalleSerializer(rels, many=True).data

    def get_menus_detalle(self, obj):
        rels = AppkioskoPromocionmenu.objects.filter(promocion=obj)
        return PromocionMenuDetalleSerializer(rels, many=True).data

    def validate_productos(self, value):
        # Filtrar valores vacíos o especiales
        value = [v for v in value if str(v).isdigit()]
        # No duplicados
        if len(value) != len(set(value)):
            raise serializers.ValidationError("No puedes agregar el mismo producto más de una vez.")
        # Validar existencia
        for prod_id in value:
            if not AppkioskoProductos.objects.filter(id=prod_id).exists():
                raise serializers.ValidationError(f"Producto con ID {prod_id} no existe.")
        return value

    def validate_menus(self, value):
        value = [v for v in value if str(v).isdigit()]
        if len(value) != len(set(value)):
            raise serializers.ValidationError("No puedes agregar el mismo menú más de una vez.")
        for menu_id in value:
            if not AppkioskoMenus.objects.filter(id=menu_id).exists():
                raise serializers.ValidationError(f"Menú con ID {menu_id} no existe.")
        return value

    def create(self, validated_data):
        productos = validated_data.pop('productos', [])
        menus = validated_data.pop('menus', [])
        imagen = validated_data.pop('imagen', None)
        promocion = AppkioskoPromociones.objects.create(**validated_data)
        # Asociar productos
        for prod_id in productos:
            AppkioskoPromocionproductos.objects.create(promocion=promocion, producto_id=prod_id)
        # Asociar menús
        for menu_id in menus:
            AppkioskoPromocionmenu.objects.create(promocion=promocion, menu_id=menu_id)
        # Guardar imagen si se envía
        if imagen:
            self._crear_imagen_promocion(promocion, imagen)
        return promocion

    def update(self, instance, validated_data):
        productos = self.initial_data.getlist('productos') if 'productos' in self.initial_data else None
        menus = self.initial_data.getlist('menus') if 'menus' in self.initial_data else None
        imagen = validated_data.pop('imagen', None)

        # Limpia y convierte solo los valores válidos a int
        def limpiar_ids(lista):
            if not lista or (len(lista) == 1 and lista[0] in ['', '__empty__']):
                return []
            return [int(x) for x in lista if str(x).isdigit()]

        productos = limpiar_ids(productos)
        menus = limpiar_ids(menus)

        # Elimina todas las relaciones y crea solo las nuevas (aunque sean vacías)
        if productos is not None:
            AppkioskoPromocionproductos.objects.filter(promocion=instance).delete()
            for prod_id in productos:
                AppkioskoPromocionproductos.objects.create(promocion=instance, producto_id=prod_id)

        if menus is not None:
            AppkioskoPromocionmenu.objects.filter(promocion=instance).delete()
            for menu_id in menus:
                AppkioskoPromocionmenu.objects.create(promocion=instance, menu_id=menu_id)

        # Validar que al menos uno tenga datos (después de filtrar)
        if (productos is None or len(productos) == 0) and (menus is None or len(menus) == 0):
            raise serializers.ValidationError("Debes seleccionar al menos un producto o menú.")

        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if imagen:
            self._actualizar_imagen_promocion(instance, imagen)
        return instance

    def _crear_imagen_promocion(self, promocion, imagen):
        """Crea y guarda la imagen de la promoción"""
        try:
            promociones_dir = os.path.join(settings.MEDIA_ROOT, 'promociones')
            os.makedirs(promociones_dir, exist_ok=True)
            extension = imagen.name.split('.')[-1] if '.' in imagen.name else 'jpg'
            nombre_archivo = f"promocion_{promocion.id}_{uuid.uuid4().hex[:8]}.{extension}"
            ruta_fisica = os.path.join(promociones_dir, nombre_archivo)
            with open(ruta_fisica, 'wb+') as destination:
                for chunk in imagen.chunks():
                    destination.write(chunk)
            ruta_relativa = f"/media/promociones/{nombre_archivo}"
            AppkioskoImagen.objects.create(
                ruta=ruta_relativa,
                categoria_imagen='promociones',
                entidad_relacionada_id=promocion.id
            )
            return ruta_relativa
        except Exception as e:
            print(f"❌ Error al guardar imagen de promoción: {str(e)}")
            return None

    def _actualizar_imagen_promocion(self, instance, imagen):
        """Actualiza la imagen de la promoción"""
        try:
            imagen_anterior = AppkioskoImagen.objects.get(
                categoria_imagen='promociones',
                entidad_relacionada_id=instance.id
            )
            if imagen_anterior.ruta:
                ruta_fisica = os.path.join(settings.MEDIA_ROOT, imagen_anterior.ruta.lstrip('/media/'))
                if os.path.exists(ruta_fisica):
                    os.remove(ruta_fisica)
            imagen_anterior.delete()
        except AppkioskoImagen.DoesNotExist:
            pass
        self._crear_imagen_promocion(instance, imagen)