from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from usuarios.models import AppkioskoEmpleados
from comun.models import AppkioskoEstados, AppkioskoImagen
from .models import (
    AppkioskoEstablecimientos, 
    AppkioskoKioskostouch,
    AppkioskoPantallascocina  
)
from .serializers import EstablecimientoSerializer  # ✅ IMPORTAR EL SERIALIZER
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes, parser_classes
import os
import uuid
from django.conf import settings


# ✅ VISTA SIMPLIFICADA PARA CREAR ESTABLECIMIENTO
@api_view(['POST'])   
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def crear_establecimiento(request):
    print(f"🔍 Datos recibidos: {list(request.data.keys())}")
    print(f"🔍 FILES recibidos: {list(request.FILES.keys())}")
    
    # ✅ USAR EL SERIALIZER
    serializer = EstablecimientoSerializer(data=request.data)
    
    if serializer.is_valid():
        establecimiento = serializer.save()
        return Response({
            'success': True, 
            'id': establecimiento.id, 
            'message': 'Establecimiento creado correctamente',
            'imagen_id': None,  # El serializer maneja esto internamente
            'imagen_url': serializer.data.get('imagen_url')
        }, status=status.HTTP_201_CREATED)
    else:
        print(f"❌ Errores del serializer: {serializer.errors}")
        return Response({
            'success': False, 
            'error': 'Datos inválidos',
            'detalles': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


# ✅ VISTA SIMPLIFICADA PARA LISTAR ESTABLECIMIENTOS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_establecimientos(request):
    try:
        establecimientos = AppkioskoEstablecimientos.objects.all()
        serializer = EstablecimientoSerializer(establecimientos, many=True)
        
        print(f"✅ {len(serializer.data)} establecimientos serializados correctamente")
        
        # ✅ DEVOLVER DIRECTAMENTE LOS DATOS DEL SERIALIZER
        return Response(serializer.data)
        
    except Exception as e:
        print(f"❌ Error en listar_establecimientos: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Error interno del servidor',
            'detalles': str(e)
        }, status=500)

        

# ✅ VISTA SIMPLIFICADA PARA DETALLES/ACTUALIZAR/ELIMINAR
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def establecimiento_detalle_o_eliminar(request, pk):
    try:
        establecimiento = AppkioskoEstablecimientos.objects.get(pk=pk)
    except AppkioskoEstablecimientos.DoesNotExist:
        return Response({'success': False, 'error': 'Establecimiento no encontrado'}, status=404)

    if request.method == 'GET':
        serializer = EstablecimientoSerializer(establecimiento)
        data = serializer.data
        
        # Agregar campos extra que necesita el frontend
        data.update({
            'responsable_id': establecimiento.responsable_asignado.id if establecimiento.responsable_asignado else None,
            'estado_id': establecimiento.estado.id if establecimiento.estado else None,
        })
        
        return Response(data)
        
    elif request.method == 'PUT':
        print(f"🔍 Datos para actualización: {list(request.data.keys())}")
        print(f"🔍 FILES para actualización: {list(request.FILES.keys())}")
        
        # ✅ USAR EL SERIALIZER PARA ACTUALIZAR
        serializer = EstablecimientoSerializer(establecimiento, data=request.data, partial=True)
        
        if serializer.is_valid():
            establecimiento_actualizado = serializer.save()
            return Response({
                'success': True, 
                'message': 'Establecimiento actualizado correctamente',
                'imagen_id': None,  # El serializer maneja esto internamente
                'imagen_url': serializer.data.get('imagen_url')
            })
        else:
            print(f"❌ Errores del serializer: {serializer.errors}")
            return Response({
                'success': False, 
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    elif request.method == 'DELETE':
        establecimiento.delete()
        return Response({'success': True})


# ✅ ELIMINAR VISTA (mantener separada para compatibilidad)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_establecimiento(request, pk):
    try:
        establecimiento = AppkioskoEstablecimientos.objects.get(pk=pk)
        # Eliminar imagen física y registro si existe
        if establecimiento.imagen:
            imagen_obj = establecimiento.imagen
            if imagen_obj.ruta:
                ruta_fisica = os.path.join(settings.MEDIA_ROOT, imagen_obj.ruta.lstrip('/media/'))
                if os.path.exists(ruta_fisica):
                    os.remove(ruta_fisica)
            imagen_obj.delete()
        establecimiento.delete()
        return Response({'success': True})
    except AppkioskoEstablecimientos.DoesNotExist:
        return Response({'success': False, 'error': 'No existe'}, status=404)


# 🗑️ ELIMINAR ESTAS FUNCIONES - YA NO SE NECESITAN:
# def _crear_imagen_establecimiento(establecimiento, imagen):
# def _actualizar_imagen_establecimiento(establecimiento, imagen):
# ↑ Estas funciones ahora están en el serializer


# ✅ MANTENER: Vista para gestionar imágenes (para el dropdown si lo usas)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def gestionar_imagenes_establecimientos(request):
    """
    GET: Obtiene todas las imágenes disponibles para establecimientos
    POST: Sube una nueva imagen para establecimientos
    """
    if request.method == 'GET':
        try:
            print("🔍 Buscando imágenes para establecimientos...")
            
            imagenes_generales = AppkioskoImagen.objects.filter(
                categoria_imagen='establecimientos',
                entidad_relacionada_id__isnull=True
            ).order_by('-created_at')
            
            imagenes_de_establecimientos = AppkioskoImagen.objects.filter(
                categoria_imagen='establecimientos',
                entidad_relacionada_id__isnull=False
            ).select_related().order_by('-created_at')
            
            data = []
            
            # Agregar imágenes generales
            for img in imagenes_generales:
                nombre_formateado = _extraer_nombre_imagen(img.ruta, f"Imagen General {img.id}")
                data.append({
                    'id': img.id,
                    'nombre': nombre_formateado,
                    'url': img.ruta,
                    'archivo': img.ruta,
                    'tipo': 'general'
                })
            
            # Agregar imágenes de establecimientos existentes
            for img in imagenes_de_establecimientos:
                try:
                    establecimiento = AppkioskoEstablecimientos.objects.get(imagen_id=img.id)
                    nombre_formateado = f"{establecimiento.nombre} (ID: {img.id})"
                except AppkioskoEstablecimientos.DoesNotExist:
                    nombre_formateado = _extraer_nombre_imagen(img.ruta, f"Establecimiento {img.id}")
                
                data.append({
                    'id': img.id,
                    'nombre': nombre_formateado,
                    'url': img.ruta,
                    'archivo': img.ruta,
                    'tipo': 'establecimiento'
                })
            
            return Response(data)
            
        except Exception as e:
            print(f"❌ Error en gestionar_imagenes_establecimientos GET: {e}")
            return Response({'error': str(e)}, status=500)

    elif request.method == 'POST':
        try:
            archivo = request.FILES.get('imagen')
            nombre = request.data.get('nombre', 'imagen_establecimiento')
            
            if not archivo:
                return Response({'error': 'No se proporcionó archivo de imagen'}, status=400)

            # Crear directorio si no existe
            establecimientos_dir = os.path.join(settings.MEDIA_ROOT, 'establecimientos')
            os.makedirs(establecimientos_dir, exist_ok=True)
            
            # Generar nombre único
            import time
            timestamp = int(time.time())
            extension = archivo.name.split('.')[-1] if '.' in archivo.name else 'jpg'
            nombre_archivo = f"{nombre}_{timestamp}.{extension}"
            
            # Guardar archivo físicamente
            ruta_completa = os.path.join(establecimientos_dir, nombre_archivo)
            with open(ruta_completa, 'wb+') as destination:
                for chunk in archivo.chunks():
                    destination.write(chunk)
            
            # Crear registro en base de datos
            ruta_relativa = f"/media/establecimientos/{nombre_archivo}"
            nueva_imagen = AppkioskoImagen.objects.create(
                ruta=ruta_relativa,
                categoria_imagen='establecimientos',
                entidad_relacionada_id=None
            )
            
            return Response({
                'id': nueva_imagen.id,
                'nombre': nombre.replace('_', ' ').title(),
                'url': nueva_imagen.ruta,
                'archivo': nueva_imagen.ruta,
                'tipo': 'general',
                'message': 'Imagen subida correctamente'
            })

        except Exception as e:
            print(f"❌ Error en gestionar_imagenes_establecimientos POST: {e}")
            return Response({'error': f'Error al subir imagen: {str(e)}'}, status=500)


def _extraer_nombre_imagen(ruta, fallback):
    """Helper para extraer nombre legible de la ruta de imagen"""
    if not ruta:
        return fallback
    
    try:
        nombre_archivo = ruta.split('/')[-1]
        nombre_sin_extension = nombre_archivo.split('.')[0]
        nombre_formateado = nombre_sin_extension.replace('_', ' ').replace('-', ' ').title()
        return nombre_formateado
    except:
        return fallback


# ✅ MANTENER: Resto de vistas de KIOSCOS y PANTALLAS sin cambios...
# (Aquí van todas las vistas de kioscos touch y pantallas cocina que ya tienes)



# KIOSCOS TOUCH - NUEVAS VISTAS
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_kiosko_touch(request):
    data = request.data
    
    try:
        # Buscar estado
        estado = None
        if 'estado' in data and data['estado']:
            estado_valor = data['estado']
            try:
                if isinstance(estado_valor, int) or estado_valor.isdigit():
                    estado = AppkioskoEstados.objects.get(id=int(estado_valor))
                else:
                    estado = AppkioskoEstados.objects.get(nombre=estado_valor)
            except AppkioskoEstados.DoesNotExist:
                return Response({'success': False, 'error': f'Estado "{estado_valor}" no encontrado'}, status=400)
        
        # Buscar establecimiento (solo el primero de la lista)
        establecimiento = None
        establecimientos_ids = data.get('establecimientos_asociados', [])
        if establecimientos_ids:
            establecimiento = AppkioskoEstablecimientos.objects.get(id=establecimientos_ids[0])
        
        # Crear el kiosco
        kiosko = AppkioskoKioskostouch.objects.create(
            nombre=data.get('nombre'),
            token=data.get('token'),
            estado=estado,
            establecimiento=establecimiento  # Solo un establecimiento
        )
        
        return Response({
            'success': True, 
            'id': kiosko.id, 
            'message': 'Kiosco Touch creado correctamente'
        })
    except AppkioskoEstablecimientos.DoesNotExist:
        return Response({'success': False, 'error': 'Establecimiento no encontrado'}, status=400)
    except Exception as e:
        print("❌ Error al crear kiosco touch:", e)
        return Response({'success': False, 'error': str(e)}, status=400)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_kioscos_touch(request):
    kioscos = AppkioskoKioskostouch.objects.all()
    data = [
        {
            'id': k.id,
            'nombre': k.nombre,
            'token': k.token,
            'estado': k.estado.nombre if k.estado else '',
            'establecimiento': {
                'id': k.establecimiento.id,
                'nombre': k.establecimiento.nombre,
                'ciudad': k.establecimiento.ciudad,
                'provincia': k.establecimiento.provincia
            } if k.establecimiento else None
        }
        for k in kioscos
    ]
    return Response(data)



@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def kiosco_touch_detalle_o_eliminar(request, pk):
    try:
        kiosco = AppkioskoKioskostouch.objects.get(pk=pk)
    except AppkioskoKioskostouch.DoesNotExist:
        return Response({'success': False, 'error': 'No existe'}, status=404)

    if request.method == 'GET':
        data = {
            'id': kiosco.id,
            'nombre': kiosco.nombre,
            'token': kiosco.token,
            'estado_id': kiosco.estado.id if kiosco.estado else None,
            'estado': kiosco.estado.nombre if kiosco.estado else '',
            'establecimiento_id': kiosco.establecimiento.id if kiosco.establecimiento else None,
            'establecimiento': {
                'id': kiosco.establecimiento.id,
                'nombre': kiosco.establecimiento.nombre,
                'ciudad': kiosco.establecimiento.ciudad,
                'provincia': kiosco.establecimiento.provincia
            } if kiosco.establecimiento else None
        }
        return Response(data)
    elif request.method == 'PUT':
        data = request.data
        try:
            # Buscar estado
            estado = None
            if 'estado' in data and data['estado']:
                estado_valor = data['estado']
                if isinstance(estado_valor, int) or estado_valor.isdigit():
                    estado = AppkioskoEstados.objects.get(id=int(estado_valor))
                else:
                    estado = AppkioskoEstados.objects.get(nombre=estado_valor)
            
            # Buscar establecimiento (solo el primero de la lista)
            establecimiento = None
            establecimientos_ids = data.get('establecimientos_asociados', [])
            if establecimientos_ids:
                establecimiento = AppkioskoEstablecimientos.objects.get(id=establecimientos_ids[0])
            
            # Actualizar campos
            kiosco.nombre = data.get('nombre', kiosco.nombre)
            kiosco.token = data.get('token', kiosco.token)
            if estado:
                kiosco.estado = estado
            if establecimiento:
                kiosco.establecimiento = establecimiento
            kiosco.save()
            
            return Response({'success': True, 'message': 'Kiosco Touch actualizado correctamente'})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)
    elif request.method == 'DELETE':
        kiosco.delete()
        return Response({'success': True})




# PANTALLAS COCINA - NUEVAS VISTAS
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_pantalla_cocina(request):
    data = request.data
    
    try:
        # Buscar estado
        estado = None
        if 'estado' in data and data['estado']:
            estado_valor = data['estado']
            try:
                if isinstance(estado_valor, int) or estado_valor.isdigit():
                    estado = AppkioskoEstados.objects.get(id=int(estado_valor))
                else:
                    estado = AppkioskoEstados.objects.get(nombre=estado_valor)
            except AppkioskoEstados.DoesNotExist:
                return Response({'success': False, 'error': f'Estado "{estado_valor}" no encontrado'}, status=400)
        
        # Buscar kiosco touch
        kiosco_touch = None
        kiosco_id = data.get('kiosco_touch_asociado')
        if kiosco_id:
            kiosco_touch = AppkioskoKioskostouch.objects.get(id=kiosco_id)
        
        # Crear la pantalla
        pantalla = AppkioskoPantallascocina.objects.create(
            nombre=data.get('nombre'),
            token=data.get('token'),
            estado=estado,
            establecimiento=kiosco_touch.establecimiento if kiosco_touch else None
        )
        
        return Response({
            'success': True, 
            'id': pantalla.id, 
            'message': 'Pantalla de Cocina creada correctamente'
        })
    except AppkioskoKioskostouch.DoesNotExist:
        return Response({'success': False, 'error': 'Kiosco Touch no encontrado'}, status=400)
    except Exception as e:
        print("❌ Error al crear pantalla cocina:", e)
        return Response({'success': False, 'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_pantallas_cocina(request):
    pantallas = AppkioskoPantallascocina.objects.all()
    data = [
        {
            'id': p.id,
            'nombre': p.nombre,
            'token': p.token,
            'estado': p.estado.nombre if p.estado else '',
            'kiosco_touch': {
                'id': p.establecimiento.id,
                'nombre': p.establecimiento.nombre
            } if p.establecimiento else None
        }
        for p in pantallas
    ]
    return Response(data)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def pantalla_cocina_detalle_o_eliminar(request, pk):
    try:
        pantalla = AppkioskoPantallascocina.objects.get(pk=pk)
    except AppkioskoPantallascocina.DoesNotExist:
        return Response({'success': False, 'error': 'No existe'}, status=404)

    if request.method == 'GET':
        data = {
            'id': pantalla.id,
            'nombre': pantalla.nombre,
            'token': pantalla.token,
            'estado_id': pantalla.estado.id if pantalla.estado else None,
            'estado': pantalla.estado.nombre if pantalla.estado else '',
            'kiosco_touch_id': pantalla.establecimiento.id if pantalla.establecimiento else None,
            'kiosco_touch': {
                'id': pantalla.establecimiento.id,
                'nombre': pantalla.establecimiento.nombre
            } if pantalla.establecimiento else None
        }
        return Response(data)
    elif request.method == 'PUT':
        data = request.data
        try:
            # Buscar estado
            estado = None
            if 'estado' in data and data['estado']:
                estado_valor = data['estado']
                if isinstance(estado_valor, int) or estado_valor.isdigit():
                    estado = AppkioskoEstados.objects.get(id=int(estado_valor))
                else:
                    estado = AppkioskoEstados.objects.get(nombre=estado_valor)
            
            # Buscar kiosco touch
            kiosco_touch = None
            kiosco_id = data.get('kiosco_touch_asociado')
            if kiosco_id:
                kiosco_touch = AppkioskoKioskostouch.objects.get(id=kiosco_id)
            
            # Actualizar campos
            pantalla.nombre = data.get('nombre', pantalla.nombre)
            pantalla.token = data.get('token', pantalla.token)
            if estado:
                pantalla.estado = estado
            if kiosco_touch:
                pantalla.establecimiento = kiosco_touch.establecimiento
            pantalla.save()
            
            return Response({'success': True, 'message': 'Pantalla de Cocina actualizada correctamente'})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)
    elif request.method == 'DELETE':
        pantalla.delete()
        return Response({'success': True})