from rest_framework import generics
from .models import AppkioskoEstados, AppkioskoIva
from .serializers import EstadosSerializer, AppkioskoIvaSerializer, ConfiguracionEmpresaSerializer, IvaSimpleSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import AppkioskoImagen
import os
from django.conf import settings
import time


class EstadosListView(generics.ListAPIView):
    queryset = AppkioskoEstados.objects.all()
    serializer_class = EstadosSerializer
    permission_classes = [AllowAny]


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


@api_view(['GET'])
@permission_classes([AllowAny])  # O [IsAuthenticated] si prefieres
def iva_actual(request):
    """Obtener el IVA actual activo"""
    try:
        iva_actual = AppkioskoIva.objects.filter(activo=True).first()

        if iva_actual:
            serializer = IvaSimpleSerializer(iva_actual)  # ✅ Usar serializer simple
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'IVA actual obtenido correctamente'
            })
        else:
            return Response({
                'success': False, 
                'data': None,
                'message': 'No hay configuración de IVA activa'
            })

    except Exception as e:
        print(f"❌ Error al obtener IVA actual: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


# ✅ MEJORAR: Normalización en el backend también
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_iva(request):
    """Crear nueva configuración de IVA o activar existente"""
    try:
        print("📥 Datos recibidos para crear/activar IVA:", request.data)

        porcentaje = request.data.get('porcentaje_iva')

        if not porcentaje:
            return Response({
                'success': False,
                'error': 'porcentaje_iva es requerido'
            }, status=400)

        # ✅ MEJORAR: Validación y normalización más flexible
        try:
            porcentaje = float(porcentaje)
            # Redondear a 2 decimales para evitar problemas de precisión
            porcentaje = round(porcentaje, 2)

            if porcentaje < 0 or porcentaje > 99.99:
                return Response({
                    'success': False,
                    'error': 'El porcentaje debe estar entre 0 y 99.99'
                }, status=400)

            print(f"🔢 Porcentaje normalizado: {porcentaje}")

        except (ValueError, TypeError):
            return Response({
                'success': False,
                'error': 'Porcentaje inválido'
            }, status=400)

        # ✅ USAR: La lógica inteligente con el valor normalizado
        iva_resultado, fue_creado = AppkioskoIva.activar_o_crear_iva(porcentaje)

        # Preparar respuesta
        serializer = AppkioskoIvaSerializer(iva_resultado)

        if fue_creado:
            mensaje = f'IVA del {porcentaje}% creado correctamente'
            status_code = 201
        else:
            mensaje = f'IVA del {porcentaje}% reactivado correctamente'
            status_code = 200

        print(f"✅ {'Creado' if fue_creado else 'Reactivado'} IVA: {iva_resultado}")

        return Response({
            'success': True,
            'data': serializer.data,
            'message': mensaje,
            'fue_creado': fue_creado
        }, status=status_code)

    except Exception as e:
        print(f"❌ Error al crear/activar IVA: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def actualizar_iva(request):
    """Actualizar configuración de IVA (reutilizar o crear)"""
    try:
        print("📥 Datos recibidos para actualizar IVA:", request.data)

        porcentaje = request.data.get('porcentaje_iva')

        if not porcentaje:
            return Response({
                'success': False,
                'error': 'porcentaje_iva es requerido'
            }, status=400)

        # ✅ MEJORAR: Misma normalización
        try:
            porcentaje = float(porcentaje)
            porcentaje = round(porcentaje, 2)  # Normalizar a 2 decimales

            if porcentaje < 0 or porcentaje > 99.99:
                return Response({
                    'success': False,
                    'error': 'El porcentaje debe estar entre 0 y 99.99'
                }, status=400)

            print(f"🔢 Porcentaje normalizado: {porcentaje}")

        except (ValueError, TypeError):
            return Response({
                'success': False,
                'error': 'Porcentaje inválido'
            }, status=400)

        # Resto del código igual...
        iva_resultado, fue_creado = AppkioskoIva.activar_o_crear_iva(porcentaje)

        # Preparar respuesta
        serializer = AppkioskoIvaSerializer(iva_resultado)

        if fue_creado:
            mensaje = f'IVA actualizado al {porcentaje}% (nuevo registro)'
        else:
            mensaje = f'IVA actualizado al {porcentaje}% (registro existente reactivado)'

        print(f"✅ {'Creado' if fue_creado else 'Reactivado'} IVA: {iva_resultado}")

        return Response({
            'success': True,
            'data': serializer.data,
            'message': mensaje,
            'fue_creado': fue_creado
        })

    except Exception as e:
        print(f"❌ Error al actualizar IVA: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


# ===== 🆕 NUEVAS VIEWS PARA CONFIGURACIÓN EMPRESARIAL =====

@api_view(['GET'])
@permission_classes([AllowAny])
def configuracion_empresa(request):
    """Obtener datos completos de la empresa para facturas"""
    try:
        config_actual = AppkioskoIva.objects.filter(activo=True).first()
        
        if config_actual:
            serializer = ConfiguracionEmpresaSerializer(config_actual)
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Configuración empresarial obtenida correctamente'
            })
        else:
            # Devolver valores por defecto
            datos_default = {
                'ruc': '1791310199001',
                'razon_social': 'KIOSKO TOUCH',
                'nombre_comercial': 'Kiosko de Autoservicio',
                'direccion': 'Dirección no configurada',
                'ciudad': 'Ciudad no configurada',
                'provincia': '',
                'telefono': '',
                'email': '',
                'porcentaje_iva': 15.00
            }
            return Response({
                'success': True,
                'data': datos_default,
                'message': 'Usando configuración por defecto (no hay configuración activa)'
            })

    except Exception as e:
        print(f"❌ Error al obtener configuración empresa: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def gestionar_configuracion_empresa(request):
    """CRUD completo para configuración empresarial"""
    
    if request.method == 'GET':
        """Obtener configuración empresarial actual para edición"""
        try:
            config_actual = AppkioskoIva.objects.filter(activo=True).first()
            
            if config_actual:
                serializer = AppkioskoIvaSerializer(config_actual)
                return Response({
                    'success': True,
                    'data': serializer.data,
                    'message': 'Configuración actual obtenida'
                })
            else:
                return Response({
                    'success': False,
                    'data': None,
                    'message': 'No hay configuración activa'
                })

        except Exception as e:
            print(f"❌ Error en GET configuración: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        """Crear nueva configuración empresarial"""
        try:
            print("📥 Creando nueva configuración empresarial:", request.data)
            
            serializer = AppkioskoIvaSerializer(data=request.data)
            
            if serializer.is_valid():
                # Desactivar configuraciones existentes
                AppkioskoIva.objects.filter(activo=True).update(activo=False)
                
                # Crear nueva configuración activa
                nueva_config = serializer.save(activo=True)
                
                return Response({
                    'success': True,
                    'data': serializer.data,
                    'message': 'Configuración empresarial creada correctamente'
                }, status=201)
            else:
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=400)
                
        except Exception as e:
            print(f"❌ Error al crear configuración: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'PUT':
        """Actualizar configuración empresarial existente"""
        try:
            print("📥 Actualizando configuración empresarial:", request.data)
            
            config_actual = AppkioskoIva.objects.filter(activo=True).first()
            
            if not config_actual:
                # Si no hay configuración activa, crear una nueva
                return gestionar_configuracion_empresa(request.POST if hasattr(request, 'POST') else request)
            
            serializer = AppkioskoIvaSerializer(config_actual, data=request.data, partial=True)
            
            if serializer.is_valid():
                config_actualizada = serializer.save()
                
                return Response({
                    'success': True,
                    'data': serializer.data,
                    'message': 'Configuración empresarial actualizada correctamente'
                })
            else:
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=400)
                
        except Exception as e:
            print(f"❌ Error al actualizar configuración: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_configuraciones(request):
    """Listar todas las configuraciones (para admin)"""
    try:
        configuraciones = AppkioskoIva.objects.all().order_by('-created_at')
        serializer = AppkioskoIvaSerializer(configuraciones, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'count': configuraciones.count(),
            'message': f'Se encontraron {configuraciones.count()} configuraciones'
        })
        
    except Exception as e:
        print(f"❌ Error al listar configuraciones: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def activar_configuracion(request, config_id):
    """Activar una configuración específica"""
    try:
        config = AppkioskoIva.objects.get(id=config_id)
        
        # Desactivar todas las demás
        AppkioskoIva.objects.filter(activo=True).update(activo=False)
        
        # Activar la seleccionada
        config.activo = True
        config.save()
        
        serializer = AppkioskoIvaSerializer(config)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': f'Configuración {config_id} activada correctamente'
        })
        
    except AppkioskoIva.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Configuración no encontrada'
        }, status=404)
    except Exception as e:
        print(f"❌ Error al activar configuración: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_configuracion(request, config_id):
    """Eliminar una configuración (solo si no está activa)"""
    try:
        config = AppkioskoIva.objects.get(id=config_id)
        
        if config.activo:
            return Response({
                'success': False,
                'error': 'No se puede eliminar la configuración activa'
            }, status=400)
        
        config.delete()
        
        return Response({
            'success': True,
            'message': f'Configuración {config_id} eliminada correctamente'
        })
        
    except AppkioskoIva.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Configuración no encontrada'
        }, status=404)
    except Exception as e:
        print(f"❌ Error al eliminar configuración: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)