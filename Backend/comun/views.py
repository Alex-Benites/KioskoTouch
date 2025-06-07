from rest_framework import generics
from .models import AppkioskoEstados
from .serializers import EstadosSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import AppkioskoImagen
import os
from django.conf import settings
import time


class EstadosListView(generics.ListAPIView):
    queryset = AppkioskoEstados.objects.all()
    serializer_class = EstadosSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def gestionar_imagenes(request):
    if request.method == 'GET':
        try:
            print("🔍 Buscando imágenes con categoria_imagen='establecimientos'...")
            
            # ✅ FILTRAR POR CATEGORÍA ESTABLECIMIENTOS:
            imagenes = AppkioskoImagen.objects.filter(
                categoria_imagen='establecimientos'
            ).order_by('-created_at')
            
            print(f"📊 Total imágenes encontradas: {imagenes.count()}")
            
            data = []
            for img in imagenes:
                # Extraer nombre del archivo para que sea más legible
                if img.ruta:
                    nombre_archivo = img.ruta.split('/')[-1]  # Obtener solo el nombre del archivo
                    nombre_sin_extension = nombre_archivo.split('.')[0]  # Quitar extensión
                    nombre_formateado = nombre_sin_extension.replace('_', ' ').replace('-', ' ').title()
                else:
                    nombre_formateado = f'Imagen {img.id}'
                
                imagen_data = {
                    'id': img.id,
                    'nombre': nombre_formateado,
                    'url': img.ruta,
                    'archivo': img.ruta
                }
                data.append(imagen_data)
                print(f"✅ Imagen procesada: ID {img.id}, nombre: {nombre_formateado}, url: {img.ruta}")
            
            print(f"📤 Devolviendo {len(data)} imágenes al frontend")
            return Response(data)
            
        except Exception as e:
            print(f"❌ Error en gestionar_imagenes GET: {e}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            return Response({'error': str(e)}, status=500)

    elif request.method == 'POST':
        try:
            print("📥 Recibiendo nueva imagen...")
            print(f"📥 request.FILES: {request.FILES}")
            print(f"📥 request.data: {request.data}")
            
            archivo = request.FILES.get('imagen')
            nombre = request.data.get('nombre', 'imagen_establecimiento')
            
            if not archivo:
                return Response({
                    'error': 'No se proporcionó archivo de imagen'
                }, status=400)

            print(f"📁 Archivo recibido: {archivo.name}, tamaño: {archivo.size} bytes")

            # Crear directorio si no existe
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'establecimientos')
            os.makedirs(upload_dir, exist_ok=True)
            print(f"📂 Directorio de destino: {upload_dir}")
            
            # Generar nombre único
            timestamp = int(time.time())
            extension = archivo.name.split('.')[-1] if '.' in archivo.name else 'jpg'
            nombre_archivo = f"{nombre}_{timestamp}.{extension}"
            
            # Guardar archivo físicamente
            ruta_completa = os.path.join(upload_dir, nombre_archivo)
            print(f"💾 Guardando en: {ruta_completa}")
            
            with open(ruta_completa, 'wb+') as destination:
                for chunk in archivo.chunks():
                    destination.write(chunk)
            
            # Crear registro en base de datos
            ruta_relativa = f"{settings.MEDIA_URL}establecimientos/{nombre_archivo}"
            nueva_imagen = AppkioskoImagen.objects.create(
                ruta=ruta_relativa,
                categoria_imagen='establecimientos',
                entidad_relacionada_id=None  # Para imágenes generales
            )
            
            print(f"✅ Imagen guardada: ID {nueva_imagen.id}, ruta: {nueva_imagen.ruta}")
            
            return Response({
                'id': nueva_imagen.id,
                'nombre': nombre.replace('_', ' ').title(),
                'url': nueva_imagen.ruta,
                'archivo': nueva_imagen.ruta,
                'message': 'Imagen subida correctamente'
            })

        except Exception as e:
            print(f"❌ Error en gestionar_imagenes POST: {e}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            return Response({
                'error': f'Error al subir imagen: {str(e)}'
            }, status=500)