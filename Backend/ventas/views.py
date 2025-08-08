from django.db import transaction
from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import uuid
from datetime import datetime, timedelta
from django.utils import timezone

from .serializers import CrearPedidoSerializer
from .models import (
    AppkioskoPedidos,
    AppkioskoDetallepedido,
    AppkioskoFacturas,
    AppkioskoTipopago,
    AppkioskoPedidoProductoIngredientes,
    AppkioskoDetallefacturaproducto,
)
from catalogo.models import AppkioskoProductos, AppkioskoIngredientes, AppkioskoMenus, AppkioskoProductosIngredientes
from comun.models import AppkioskoIva, AppkioskoEstados
from marketing.models import AppkioskoPromocionproductos, AppkioskoPromocionmenu


@api_view(['POST'])
@permission_classes([AllowAny])
def crear_pedido(request):
    """
    ENDPOINT PRINCIPAL: Crear pedido completo con productos y personalizaciones
    """
    try:
        print("DATOS RECIBIDOS PARA CREAR PEDIDO:")
        print(f"   - Request data: {request.data}")

        # 1. Validar datos de entrada
        serializer = CrearPedidoSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"Errores de validación: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors,
                'message': 'Datos inválidos'
            }, status=status.HTTP_400_BAD_REQUEST)

        datos_validados = serializer.validated_data
        print(f"Datos validados: {datos_validados}")

        # 2. Crear pedido usando transacción atómica
        with transaction.atomic():
            resultado = procesar_pedido_completo(datos_validados)

            print(f"PEDIDO CREADO EXITOSAMENTE:")
            print(f"   - Pedido ID: {resultado['pedido'].id}")
            print(f"   - Número de pedido: {resultado['pedido'].invoice_number}")
            if resultado.get('factura'):
                print(f"   - Factura ID: {resultado['factura'].id}")

            # 3. Preparar respuesta
            response_data = {
                'success': True,
                'data': {
                    'pedido_id': resultado['pedido'].id,
                    'numero_pedido': resultado['pedido'].invoice_number,
                    'total': float(resultado['pedido'].total),
                    'estado': resultado['pedido'].estado_id or 1
                },
                'message': f'Pedido #{resultado["pedido"].invoice_number} creado exitosamente'
            }

            # Agregar datos de factura si existe
            if resultado.get('factura'):
                response_data['data']['factura_id'] = resultado['factura'].id
                response_data['data']['numero_factura'] = f"F-{resultado['factura'].id:06d}"

            return Response(response_data, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"ERROR AL CREAR PEDIDO: {e}")
        import traceback
        print(f"TRACEBACK: {traceback.format_exc()}")

        return Response({
            'success': False,
            'error': str(e),
            'message': 'Error interno del servidor al procesar el pedido'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def obtener_pedidos_chef(request):
    """
    ENDPOINT PARA CHEF: Obtener pedidos de las últimas 24 horas con detalles completos
    """
    print("=== ENDPOINT CHEF LLAMADO ===")
    print(f"Method: {request.method}")
    print(f"Headers: {dict(request.headers)}")

    try:
        print("OBTENIENDO PEDIDOS PARA CHEF...")

        # Obtener pedidos de las últimas 24 horas
        hace_24_horas = timezone.now() - timedelta(hours=24)

        pedidos = AppkioskoPedidos.objects.filter(
            created_at__gte=hace_24_horas
        ).select_related(
            'estado', 'tipo_pago'
        ).order_by('-created_at')

        print(f"Pedidos encontrados: {pedidos.count()}")

        pedidos_data = []

        if pedidos.exists():
            for pedido in pedidos:
                print(f"\nProcesando pedido ID: {pedido.id}")

                # Obtener detalles del pedido
                detalles = AppkioskoDetallepedido.objects.filter(
                    pedido=pedido
                ).select_related('producto', 'menu', 'promocion')

                items = []
                for detalle in detalles:
                    item_data = {
                        'id': detalle.id,
                        'cantidad': detalle.cantidad,
                        'precio_unitario': float(detalle.precio_unitario),
                        'subtotal': float(detalle.subtotal),
                        'personalizaciones': []
                    }

                    # Información del producto o menú
                    if detalle.producto:
                        item_data.update({
                            'nombre': detalle.producto.nombre,
                            'tipo': 'producto',
                            'producto_id': detalle.producto.id
                        })

                        # Obtener personalizaciones de ingredientes
                        try:
                            personalizaciones = AppkioskoPedidoProductoIngredientes.objects.filter(
                                pedido=pedido,
                                detalle_pedido=detalle
                            ).select_related('ingrediente')

                            print(f"     Personalizaciones encontradas para {detalle.producto.nombre}: {personalizaciones.count()}")

                            # Obtener ingredientes base del producto para comparar cantidades
                            ingredientes_base = AppkioskoProductosIngredientes.objects.filter(
                                producto=detalle.producto
                            ).select_related('ingrediente')

                            # Crear diccionario de ingredientes base {ingrediente_id: cantidad_base}
                            base_map = {}
                            for ing_base in ingredientes_base:
                                base_map[ing_base.ingrediente.id] = {
                                    'cantidad': ing_base.cantidad,
                                    'es_base': ing_base.es_base
                                }
                                print(f"       Base: {ing_base.ingrediente.nombre} - cantidad_base={ing_base.cantidad}, es_base={ing_base.es_base}")

                            # Agrupar personalizaciones por ingrediente y acción
                            personalizaciones_agrupadas = {}
                            for p in personalizaciones:
                                print(f"       - {p.ingrediente.nombre}: {p.accion} (cantidad={p.cantidad}, precio={p.precio_aplicado})")
                                
                                # Obtener cantidad base para este ingrediente
                                info_base = base_map.get(p.ingrediente.id, {'cantidad': 0, 'es_base': False})
                                cantidad_base = info_base['cantidad']
                                es_base = info_base['es_base']
                                
                                # Para cantidad_aumentada, calcular la cantidad extra real
                                if p.accion == 'cantidad_aumentada':
                                    cantidad_extra = p.cantidad - cantidad_base
                                    if cantidad_extra > 0:
                                        # Crear dos registros: base + extra
                                        # 1. Registro base (no se muestra al chef)
                                        key_base = f"{p.ingrediente.nombre}_incluir_base"
                                        personalizaciones_agrupadas[key_base] = {
                                            'ingrediente': p.ingrediente.nombre,
                                            'accion': 'incluir_base',
                                            'cantidad': cantidad_base,
                                            'precio_aplicado': 0.00
                                        }
                                        
                                        # 2. Registro extra (sí se muestra al chef)
                                        key_extra = f"{p.ingrediente.nombre}_agregar_nuevo"
                                        personalizaciones_agrupadas[key_extra] = {
                                            'ingrediente': p.ingrediente.nombre,
                                            'accion': 'agregar_nuevo',
                                            'cantidad': cantidad_extra,
                                            'precio_aplicado': float(p.precio_aplicado)
                                        }
                                        print(f"         DIVIDIDO en: Base x{cantidad_base} + Extra x{cantidad_extra}")
                                    else:
                                        # Si no hay cantidad extra, solo incluir base
                                        key = f"{p.ingrediente.nombre}_incluir_base"
                                        personalizaciones_agrupadas[key] = {
                                            'ingrediente': p.ingrediente.nombre,
                                            'accion': 'incluir_base',
                                            'cantidad': p.cantidad,
                                            'precio_aplicado': 0.00
                                        }
                                else:
                                    # Para otras acciones, mantener como están
                                    key = f"{p.ingrediente.nombre}_{p.accion}"
                                    if key not in personalizaciones_agrupadas:
                                        personalizaciones_agrupadas[key] = {
                                            'ingrediente': p.ingrediente.nombre,
                                            'accion': p.accion,
                                            'cantidad': 0,
                                            'precio_aplicado': 0.00
                                        }
                                    personalizaciones_agrupadas[key]['cantidad'] += p.cantidad
                                    personalizaciones_agrupadas[key]['precio_aplicado'] += float(p.precio_aplicado)
                            
                            item_data['personalizaciones'] = list(personalizaciones_agrupadas.values())
                            print(f"     Personalizaciones agrupadas: {len(item_data['personalizaciones'])} items")
                            for pers in item_data['personalizaciones']:
                                print(f"       FINAL: {pers['ingrediente']} - {pers['accion']} x{pers['cantidad']}")
                        except Exception as e:
                            print(f"Error obteniendo personalizaciones: {e}")
                            item_data['personalizaciones'] = []

                    elif detalle.menu:
                        item_data.update({
                            'nombre': detalle.menu.nombre,
                            'tipo': 'menu',
                            'menu_id': detalle.menu.id
                        })

                    # Información de promoción
                    if hasattr(detalle, 'promocion') and detalle.promocion:
                        try:
                            item_data['promocion'] = {
                                'nombre': detalle.promocion.nombre,
                                'descuento': float(getattr(detalle, 'descuento_promocion', 0) or 0),
                                'precio_original': float(getattr(detalle, 'precio_original', 0)) if getattr(detalle, 'precio_original', None) else None
                            }
                        except Exception as e:
                            print(f"Error procesando promoción: {e}")
                            item_data['promocion'] = None

                    items.append(item_data)

                # Calcular tiempo transcurrido
                tiempo_transcurrido = calcular_tiempo_transcurrido(pedido.created_at)

                # Determinar estado del pedido
                estado_nombre = pedido.estado.nombre if pedido.estado else 'Sin estado'
                estado_activo = pedido.estado.is_active if pedido.estado else False

                pedido_data = {
                    'id': pedido.id,
                    'numero': pedido.invoice_number,
                    'total': float(pedido.total),
                    'numero_mesa': pedido.numero_mesa,
                    'tipo_entrega': pedido.tipo_entrega,
                    'created_at': pedido.created_at.isoformat(),
                    'tiempo_transcurrido': tiempo_transcurrido,
                    'estado': {
                        'id': pedido.estado_id,
                        'nombre': estado_nombre,
                        'activo': estado_activo
                    },
                    'items': items
                }

                pedidos_data.append(pedido_data)
                print(f"Pedido {pedido.id} procesado - Estado: {estado_nombre} - Items: {len(items)}")

        print(f"Total pedidos procesados: {len(pedidos_data)}")

        response_data = {
            'success': True,
            'data': pedidos_data,
            'total': len(pedidos_data),
            'message': 'Pedidos obtenidos exitosamente' if len(pedidos_data) > 0 else 'No hay pedidos en las últimas 24 horas'
        }

        print(f"Respuesta preparada con {len(pedidos_data)} pedidos")

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"ERROR OBTENIENDO PEDIDOS: {e}")
        import traceback
        print(f"TRACEBACK: {traceback.format_exc()}")

        return Response({
            'success': False,
            'message': 'Error interno del servidor',
            'error': str(e),
            'data': [],
            'total': 0
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def cambiar_estado_pedido(request, pedido_id):
    """
    ENDPOINT: Cambiar estado de un pedido (activar/desactivar)
    """
    try:
        print(f"CAMBIANDO ESTADO DE PEDIDO ID: {pedido_id}")

        pedido = AppkioskoPedidos.objects.get(id=pedido_id)
        nuevo_estado = request.data.get('estado')

        if not nuevo_estado:
            return Response({
                'success': False,
                'message': 'El campo estado es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Buscar estado por nombre o por is_active
        if nuevo_estado == 'activado':
            estado = AppkioskoEstados.objects.filter(is_active=True).first()
        elif nuevo_estado == 'desactivado':
            estado = AppkioskoEstados.objects.filter(is_active=False).first()
        else:
            return Response({
                'success': False,
                'message': 'Estado no válido. Use "activado" o "desactivado"'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not estado:
            return Response({
                'success': False,
                'message': f'No se encontró estado {nuevo_estado}'
            }, status=status.HTTP_404_NOT_FOUND)

        # Actualizar estado
        pedido.estado = estado
        pedido.updated_at = timezone.now()
        pedido.save()

        print(f"Estado cambiado a: {estado.nombre}")

        return Response({
            'success': True,
            'message': f'Pedido {pedido.invoice_number} {nuevo_estado} exitosamente',
            'data': {
                'pedido_id': pedido.id,
                'estado': {
                    'id': estado.id,
                    'nombre': estado.nombre,
                    'activo': estado.is_active
                }
            }
        })

    except AppkioskoPedidos.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Pedido no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"ERROR CAMBIANDO ESTADO: {e}")
        return Response({
            'success': False,
            'message': 'Error interno del servidor',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def obtener_pedido(request, pedido_id):
    """
    ENDPOINT: Obtener detalles de un pedido específico
    """
    try:
        pedido = AppkioskoPedidos.objects.select_related('estado', 'tipo_pago').get(id=pedido_id)
        detalles = AppkioskoDetallepedido.objects.filter(
            pedido_id=pedido_id
        ).select_related('producto', 'menu', 'promocion')

        items = []
        for detalle in detalles:
            item_data = {
                'id': detalle.id,
                'cantidad': detalle.cantidad,
                'precio_unitario': float(detalle.precio_unitario),
                'subtotal': float(detalle.subtotal),
                'personalizaciones': []
            }

            if detalle.producto:
                item_data.update({
                    'nombre': detalle.producto.nombre,
                    'tipo': 'producto',
                    'producto_id': detalle.producto.id
                })

                # Obtener personalizaciones
                personalizaciones = AppkioskoPedidoProductoIngredientes.objects.filter(
                    pedido=pedido,
                    detalle_pedido=detalle
                ).select_related('ingrediente')

                # Agrupar personalizaciones por ingrediente y acción
                personalizaciones_agrupadas = {}
                for p in personalizaciones:
                    key = f"{p.ingrediente.nombre}_{p.accion}"
                    if key not in personalizaciones_agrupadas:
                        personalizaciones_agrupadas[key] = {
                            'ingrediente': p.ingrediente.nombre,
                            'accion': p.accion,
                            'cantidad': 0,
                            'precio_aplicado': 0.00
                        }
                    personalizaciones_agrupadas[key]['cantidad'] += p.cantidad
                    personalizaciones_agrupadas[key]['precio_aplicado'] += float(p.precio_aplicado)
                
                item_data['personalizaciones'] = list(personalizaciones_agrupadas.values())

            elif detalle.menu:
                item_data.update({
                    'nombre': detalle.menu.nombre,
                    'tipo': 'menu',
                    'menu_id': detalle.menu.id
                })

            if hasattr(detalle, 'promocion') and detalle.promocion:
                item_data['promocion'] = {
                    'nombre': detalle.promocion.nombre,
                    'descuento': float(getattr(detalle, 'descuento_promocion', 0) or 0),
                    'precio_original': float(getattr(detalle, 'precio_original', 0)) if getattr(detalle, 'precio_original', None) else None
                }

            items.append(item_data)

        return Response({
            'success': True,
            'data': {
                'pedido': {
                    'id': pedido.id,
                    'numero': pedido.invoice_number,
                    'total': float(pedido.total),
                    'estado': {
                        'id': pedido.estado_id,
                        'nombre': pedido.estado.nombre if pedido.estado else 'Sin estado',
                        'activo': pedido.estado.is_active if pedido.estado else False
                    },
                    'numero_mesa': pedido.numero_mesa,
                    'tipo_entrega': pedido.tipo_entrega,
                    'created_at': pedido.created_at.isoformat(),
                    'tiempo_transcurrido': calcular_tiempo_transcurrido(pedido.created_at)
                },
                'items': items
            }
        })
    except AppkioskoPedidos.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Pedido no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"ERROR OBTENIENDO PEDIDO: {e}")
        return Response({
            'success': False,
            'message': 'Error interno del servidor',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def calcular_tiempo_transcurrido(fecha_creacion):
    """
    Calcular tiempo transcurrido desde la creación del pedido
    """
    try:
        ahora = timezone.now()
        diferencia = ahora - fecha_creacion
        minutos = int(diferencia.total_seconds() / 60)

        if minutos < 1:
            return "Recién llegado"
        elif minutos == 1:
            return "1 min"
        elif minutos < 60:
            return f"{minutos} min"
        else:
            horas = minutos // 60
            minutos_restantes = minutos % 60
            if horas == 1:
                return f"1h {minutos_restantes}min" if minutos_restantes > 0 else "1h"
            else:
                return f"{horas}h {minutos_restantes}min" if minutos_restantes > 0 else f"{horas}h"
    except Exception as e:
        print(f"Error calculando tiempo: {e}")
        return "Tiempo desconocido"


def procesar_pedido_completo(datos_validados):
    """
    FUNCIÓN PRINCIPAL: Procesar pedido completo con todos sus detalles
    """
    print("INICIANDO PROCESAMIENTO DE PEDIDO COMPLETO...")

    # 1. Obtener o crear tipo de pago
    tipo_pago_nombre = datos_validados['tipo_pago']
    tipo_pago, created = AppkioskoTipopago.objects.get_or_create(
        nombre=tipo_pago_nombre,
        defaults={'created_at': datetime.now(), 'updated_at': datetime.now()}
    )
    print(f"Tipo de pago: {tipo_pago.nombre} (ID: {tipo_pago.id})")

    # 2. Crear registro principal del pedido
    pedido = crear_pedido_principal(datos_validados, tipo_pago)
    print(f"Pedido principal creado: ID {pedido.id}")

    # 3. Crear detalles del pedido (productos + personalizaciones)
    crear_detalles_pedido(pedido, datos_validados['productos'])
    print(f"Detalles del pedido creados: {len(datos_validados['productos'])} productos")

    # 4. Crear factura SIEMPRE (con o sin datos de facturación)
    factura = crear_factura(pedido, datos_validados.get('datos_facturacion'))
    crear_detalles_factura(factura, pedido)  # ✅ CAMBIAR: pasar pedido en lugar de productos
    print(f"Factura creada: ID {factura.id}")

    return {
        'pedido': pedido,
        'factura': factura
    }


def crear_pedido_principal(datos_validados, tipo_pago):
    """
    CREAR: Registro principal en appkiosko_pedidos
    """
    # Generar número de pedido único
    numero_pedido = generar_numero_pedido()

    # MANEJAR MESA/TURNO CORRECTAMENTE
    numero_mesa = datos_validados['numero_mesa']
    if numero_mesa == 0:
        numero_mesa = None

    # OBTENER ESTADO INICIAL DINÁMICAMENTE
    try:
        estado_inicial = AppkioskoEstados.objects.filter(
            is_active=True
        ).order_by('id').first()

        if not estado_inicial:
            estado_inicial = AppkioskoEstados.objects.create(
                nombre='Pendiente',
                descripcion='Pedido recibido',
                is_active=True,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            print("Se creó estado inicial automáticamente")

        estado_id = estado_inicial.id
        print(f"Estado inicial asignado: {estado_inicial.nombre} (ID: {estado_id})")

    except Exception as e:
        print(f"Error obteniendo estado: {e}")
        raise ValueError("No se pudo asignar un estado inicial al pedido")

    # Datos básicos del pedido
    pedido_data = {
        'invoice_number': numero_pedido,
        'tipo_entrega': datos_validados['tipo_entrega'],
        'total': datos_validados['total'],
        'numero_mesa': numero_mesa,
        'tipo_pago_id': tipo_pago.id,
        'is_facturado': 1 if datos_validados.get('datos_facturacion') else 0,
        'estado_id': estado_id,
        'created_at': datetime.now(),
        'updated_at': datetime.now()
    }

    print(f"CREANDO PEDIDO CON MESA/TURNO: {numero_mesa}")
    print(f"   - Tipo entrega: {datos_validados['tipo_entrega']}")
    print(f"   - Estado ID: {estado_id}")

    pedido = AppkioskoPedidos.objects.create(**pedido_data)
    print(f"Pedido #{numero_pedido} creado con mesa/turno: {pedido.numero_mesa}")

    return pedido


def crear_detalles_pedido(pedido, productos_data):
    """
    CREAR: Detalles con promociones para productos Y menús
    """
    print(f"Creando detalles de pedido: {len(productos_data)} items")

    for producto_data in productos_data:
        producto_id = producto_data.get('producto_id')
        menu_id = producto_data.get('menu_id')

        precio_original = float(producto_data['precio_unitario'])
        cantidad = producto_data['cantidad']

        promocion = None
        precio_final = precio_original
        descuento = 0.00

        if producto_id:
            print(f"Procesando producto ID: {producto_id}")

            try:
                producto = AppkioskoProductos.objects.select_related('estado').get(id=producto_id)

                if producto.estado and producto.estado.is_active != 1:
                    raise ValueError(f"El producto '{producto.nombre}' no está disponible")

            except AppkioskoProductos.DoesNotExist:
                raise ValueError(f"Producto con ID {producto_id} no existe")

            # Verificar promoción activa
            promocion = obtener_promocion_activa(producto=producto)
            if promocion:
                precio_final, descuento = calcular_precio_con_promocion(precio_original, promocion)

            # Crear detalle con promoción
            detalle = AppkioskoDetallepedido.objects.create(
                pedido_id=pedido.id,
                producto_id=producto.id,
                menu_id=None,
                cantidad=cantidad,
                precio_unitario=precio_final,
                subtotal=precio_final * cantidad,
                precio_original=precio_original if promocion else None,
                promocion=promocion,
                descuento_promocion=descuento,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )

            # Procesar ingredientes
            procesar_todos_los_ingredientes(pedido, detalle, producto_data)

        elif menu_id:
            print(f"Procesando menú ID: {menu_id}")

            try:
                menu = AppkioskoMenus.objects.select_related('estado').get(id=menu_id)

                if not menu.esta_activo:
                    raise ValueError(f"El menú '{menu.nombre}' no está disponible")

            except AppkioskoMenus.DoesNotExist:
                raise ValueError(f"Menú con ID {menu_id} no existe")

            # Verificar promoción activa para menú
            promocion = obtener_promocion_activa(menu=menu)
            if promocion:
                precio_final, descuento = calcular_precio_con_promocion(precio_original, promocion)

            # Crear detalle con promoción
            detalle = AppkioskoDetallepedido.objects.create(
                pedido_id=pedido.id,
                producto_id=None,
                menu_id=menu.id,
                cantidad=cantidad,
                precio_unitario=precio_final,
                subtotal=precio_final * cantidad,
                precio_original=precio_original if promocion else None,
                promocion=promocion,
                descuento_promocion=descuento,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )

            print(f"Menú '{menu.nombre}' agregado")

        else:
            raise ValueError("Debe especificar producto_id o menu_id")

        # Log del resultado
        if promocion:
            print(f"Detalle creado CON promoción:")
            print(f"     - Item: {producto.nombre if producto_id else menu.nombre}")
            print(f"     - Promoción: {promocion.nombre}")
            print(f"     - Precio original: ${precio_original}")
            print(f"     - Descuento: ${descuento}")
            print(f"     - Precio final: ${precio_final}")
        else:
            print(f"Detalle creado SIN promoción: ID {detalle.id}")

    print(f"Detalles del pedido creados: {len(productos_data)} productos")


def crear_factura(pedido, datos_facturacion=None):
    """
    CREAR: Factura en appkiosko_facturas
    """
    if datos_facturacion:
        nombre = datos_facturacion['nombre_completo']
        correo = datos_facturacion['correo']
        cedula = datos_facturacion['cedula']
        telefono = datos_facturacion['telefono']
    else:
        nombre = "Consumidor Final"
        correo = ""
        cedula = ""
        telefono = ""

    factura = AppkioskoFacturas.objects.create(
        pedido_id=pedido.id,
        nombre_cliente=nombre,
        email_cliente=correo,
        cedula_cliente=cedula,
        telefono_cliente=telefono,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    print(f"Factura creada para {nombre}")
    return factura

def crear_detalles_factura(factura, pedido):
    """
    Crea los registros de detalle de factura para cada detalle de pedido.
    ✅ ACTUALIZADO: Usa detalles del pedido en lugar de productos directos
    """
    # Obtener todos los detalles del pedido
    detalles_pedido = AppkioskoDetallepedido.objects.filter(pedido=pedido)
    
    print(f"Creando detalles de factura para {detalles_pedido.count()} productos")
    
    for detalle in detalles_pedido:
        # Calcular valores para la factura basados en los campos disponibles
        iva_calculado = 0  # Por ahora, no hay IVA en el modelo de detalle
        descuento = detalle.descuento_promocion if detalle.descuento_promocion else 0
        total_calculado = detalle.subtotal + iva_calculado - descuento
        
        AppkioskoDetallefacturaproducto.objects.create(
            factura=factura,
            detalle_pedido=detalle,  # ✅ NUEVO CAMPO
            producto=detalle.producto,  # ✅ MANTENER por compatibilidad
            cantidad=detalle.cantidad,
            precio_unitario=detalle.precio_unitario,
            iva=iva_calculado,  # ✅ CALCULAR IVA (por ahora 0)
            descuento=descuento,  # ✅ USAR descuento_promocion
            subtotal=detalle.subtotal,
            total=total_calculado,  # ✅ CALCULAR TOTAL
            fecha_emision_factura=timezone.now(),  # ✅ USAR timezone.now() para evitar warning
        )
        
        print(f"Detalle factura creado: {detalle.producto.nombre} x{detalle.cantidad} - Subtotal: ${detalle.subtotal}")


def generar_numero_pedido():
    """
    GENERAR: Número único de pedido
    """
    timestamp = datetime.now()
    fecha_parte = timestamp.strftime("%Y%m%d")
    hora_parte = timestamp.strftime("%H%M%S")

    import random
    secuencial = random.randint(100, 999)

    return f"{fecha_parte}-{hora_parte}-{secuencial}"


def procesar_todos_los_ingredientes(pedido, detalle_pedido, producto_data):
    """
    Procesa todos los ingredientes para un detalle específico del pedido
    """
    # Obtener el producto desde el detalle
    producto = detalle_pedido.producto
    print(f"Procesando ingredientes para detalle ID: {detalle_pedido.id}, producto: {producto.nombre}")

    # Obtener ingredientes del producto
    ingredientes_producto = AppkioskoProductosIngredientes.objects.filter(
        producto=producto
    ).select_related('ingrediente')

    print(f"   Ingredientes del producto encontrados: {ingredientes_producto.count()}")

    # Obtener personalizaciones
    personalizaciones = producto_data.get('personalizaciones', [])
    cambios_ingredientes = {}

    for p in personalizaciones:
        ingrediente_id = p['ingrediente_id']
        accion = p['accion']
        precio_aplicado = p['precio_aplicado']

        if ingrediente_id not in cambios_ingredientes:
            cambios_ingredientes[ingrediente_id] = {
                'cantidad_agregada': 0,
                'cantidad_quitada': 0,
                'precio_por_unidad': precio_aplicado
            }

        if accion == 'agregar':
            cambios_ingredientes[ingrediente_id]['cantidad_agregada'] += 1
        elif accion == 'quitar':
            cambios_ingredientes[ingrediente_id]['cantidad_quitada'] += 1

    print(f"   Cambios de ingredientes: {len(cambios_ingredientes)}")

    # Procesar ingredientes base del producto
    for ingrediente_producto in ingredientes_producto:
        ingrediente_id = ingrediente_producto.ingrediente.id
        ingrediente_nombre = ingrediente_producto.ingrediente.nombre
        es_base = ingrediente_producto.es_base

        cantidad_base = getattr(ingrediente_producto, 'cantidad', 1)

        print(f"\n   Procesando: {ingrediente_nombre} (ID:{ingrediente_id}, base:{es_base})")
        print(f"     Cantidad base en producto: {cantidad_base}")

        cambios = cambios_ingredientes.get(ingrediente_id, {
            'cantidad_agregada': 0,
            'cantidad_quitada': 0,
            'precio_por_unidad': 0
        })

        cantidad_final = cantidad_base + cambios['cantidad_agregada'] - cambios['cantidad_quitada']

        print(f"     Cálculo: {cantidad_base} + {cambios['cantidad_agregada']} - {cambios['cantidad_quitada']} = {cantidad_final}")

        if cantidad_final < 0:
            cantidad_final = 0

        if cantidad_final == 0:
            print(f"     Ingrediente ELIMINADO completamente: {ingrediente_nombre}")

            AppkioskoPedidoProductoIngredientes.objects.create(
                pedido=pedido,
                detalle_pedido=detalle_pedido,  
                producto=producto,  
                ingrediente=ingrediente_producto.ingrediente,
                accion='eliminar_completo',
                precio_aplicado=0.00,
                cantidad=0,
                created_at=datetime.now()
            )

        elif cantidad_final == cantidad_base:
            print(f"     Cantidad NORMAL: {ingrediente_nombre} x{cantidad_final}")

            accion_tipo = 'incluir_base' if es_base else 'incluir_adicional'
            AppkioskoPedidoProductoIngredientes.objects.create(
                pedido=pedido,
                detalle_pedido=detalle_pedido,
                producto=producto,  
                ingrediente=ingrediente_producto.ingrediente,
                accion=accion_tipo,
                precio_aplicado=0.00,
                cantidad=cantidad_final,
                created_at=datetime.now()
            )

        else:
            if cantidad_final > cantidad_base:
                print(f"     Cantidad AUMENTADA: {ingrediente_nombre} x{cantidad_final} (era {cantidad_base})")
                
                # Primero, crear el registro base
                accion_base = 'incluir_base' if es_base else 'incluir_adicional'
                AppkioskoPedidoProductoIngredientes.objects.create(
                    pedido=pedido,
                    detalle_pedido=detalle_pedido,
                    producto=producto,  
                    ingrediente=ingrediente_producto.ingrediente,
                    accion=accion_base,
                    precio_aplicado=0.00,
                    cantidad=cantidad_base,
                    created_at=datetime.now()
                )
                print(f"     Guardado ingrediente base: {ingrediente_nombre} x{cantidad_base}")
                
                # Luego, crear el registro para la cantidad extra
                if cambios['cantidad_agregada'] > 0:
                    cantidad_extra = cambios['cantidad_agregada']
                    precio_extra = cambios['precio_por_unidad'] * cantidad_extra
                    
                    AppkioskoPedidoProductoIngredientes.objects.create(
                        pedido=pedido,
                        detalle_pedido=detalle_pedido, 
                        producto=producto,  
                        ingrediente=ingrediente_producto.ingrediente,
                        accion='agregar_nuevo',
                        precio_aplicado=cambios['precio_por_unidad'],
                        cantidad=cantidad_extra,  # Solo la cantidad extra, no la total
                        created_at=datetime.now()
                    )
                    print(f"     Guardado ingrediente extra: {ingrediente_nombre} x{cantidad_extra}")
                    
            else:
                print(f"     Cantidad REDUCIDA: {ingrediente_nombre} x{cantidad_final} (era {cantidad_base})")
                AppkioskoPedidoProductoIngredientes.objects.create(
                    pedido=pedido,
                    detalle_pedido=detalle_pedido, 
                    producto=producto,  
                    ingrediente=ingrediente_producto.ingrediente,
                    accion='cantidad_reducida',
                    precio_aplicado=0.00,
                    cantidad=cantidad_final,
                    created_at=datetime.now()
                )

        # Remover de cambios procesados
        if ingrediente_id in cambios_ingredientes:
            del cambios_ingredientes[ingrediente_id]

    # Procesar ingredientes completamente nuevos (personalizaciones)
    for ingrediente_id, cambios in cambios_ingredientes.items():
        if cambios['cantidad_agregada'] > 0:
            try:
                ingrediente = AppkioskoIngredientes.objects.get(id=ingrediente_id)
                cantidad_nueva = cambios['cantidad_agregada']
                precio_total = cambios['precio_por_unidad'] * cantidad_nueva

                print(f"\n   Ingrediente COMPLETAMENTE NUEVO: {ingrediente.nombre} x{cantidad_nueva}")

                AppkioskoPedidoProductoIngredientes.objects.create(
                    pedido=pedido,
                    detalle_pedido=detalle_pedido, 
                    producto=producto,  
                    ingrediente=ingrediente,
                    accion='agregar_nuevo',
                    precio_aplicado=cambios['precio_por_unidad'],
                    cantidad=cantidad_nueva,
                    created_at=datetime.now()
                )

                print(f"     Guardado: {ingrediente.nombre} x{cantidad_nueva} (+${precio_total})")

            except AppkioskoIngredientes.DoesNotExist:
                print(f"   Ingrediente ID {ingrediente_id} no encontrado, omitiendo...")

    print(f"\n   Procesamiento completado para {producto.nombre} (detalle {detalle_pedido.id})")


def obtener_promocion_activa(producto=None, menu=None):
    """
    VERIFICAR: Si hay promoción activa para producto/menú
    """
    try:
        if producto:
            promocion_producto = AppkioskoPromocionproductos.objects.filter(
                producto=producto,
                promocion__fecha_inicio_promo__lte=timezone.now(),
                promocion__fecha_fin_promo__gte=timezone.now(),
                promocion__estado__is_active=1
            ).select_related('promocion', 'promocion__estado').first()

            if promocion_producto:
                promo = promocion_producto.promocion
                print(f"   Promoción encontrada para producto {producto.nombre}:")
                print(f"      - Nombre: {promo.nombre}")
                print(f"      - Estado ID: {promo.estado_id}")
                print(f"      - Fecha inicio: {promo.fecha_inicio_promo}")
                print(f"      - Fecha fin: {promo.fecha_fin_promo}")
                return promo

        elif menu:
            promocion_menu = AppkioskoPromocionmenu.objects.filter(
                menu=menu,
                promocion__fecha_inicio_promo__lte=timezone.now(),
                promocion__fecha_fin_promo__gte=timezone.now(),
                promocion__estado__is_active=1
            ).select_related('promocion', 'promocion__estado').first()

            if promocion_menu:
                promo = promocion_menu.promocion
                print(f"   Promoción encontrada para menú {menu.nombre}:")
                print(f"      - Nombre: {promo.nombre}")
                print(f"      - Estado ID: {promo.estado_id}")
                return promo

        print(f"   Sin promoción activa para {'producto' if producto else 'menú'}")
        return None

    except ImportError as e:
        print(f"   Error de importación: {e}")
        return None
    except Exception as e:
        print(f"   Error buscando promoción: {e}")
        return None


def calcular_precio_con_promocion(precio_base, promocion):
    """
    CALCULAR: Precio final aplicando promoción
    """
    if not promocion:
        return precio_base, 0.00

    try:
        valor_descuento = float(promocion.valor_descuento)
        descuento = precio_base * (valor_descuento / 100)
        descuento = min(descuento, precio_base)
        precio_final = max(0, precio_base - descuento)

        print(f"   Cálculo promoción:")
        print(f"      - Precio base: ${precio_base}")
        print(f"      - Descuento ({valor_descuento}%): ${descuento}")
        print(f"      - Precio final: ${precio_final}")

        return precio_final, descuento

    except Exception as e:
        print(f"   Error calculando promoción: {e}")
        return precio_base, 0.00

# ✅ AGREGAR ESTAS NUEVAS FUNCIONES AL FINAL DEL ARCHIVO:

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@csrf_exempt
@require_http_methods(["POST"])
def confirmar_pago_y_descontar_stock(request, invoice_number):
    """
    Función SIMPLE: Confirma pago y descuenta stock directamente
    """
    try:
        # 1. Buscar el pedido
        pedido = AppkioskoPedidos.objects.get(invoice_number=invoice_number)
        
        # 2. Obtener datos del pago
        data = json.loads(request.body)
        metodo_pago = data.get('metodo_pago', 'efectivo')
        
        # 3. Actualizar el pedido (simple)
        pedido.fecha_pago = timezone.now()
        pedido.save()
        
        # 4. DESCONTAR STOCK (función simple)
        stock_actualizado = descontar_stock_simple(pedido)
        
        print(f"✅ Pago confirmado para pedido {invoice_number}, stock actualizado: {len(stock_actualizado)} ingredientes")
        
        return JsonResponse({
            'success': True,
            'mensaje': 'Pago confirmado y stock actualizado',
            'pedido': invoice_number,
            'metodo_pago': metodo_pago,
            'stock_actualizado': stock_actualizado
        })
        
    except AppkioskoPedidos.DoesNotExist:
        print(f"❌ Pedido no encontrado: {invoice_number}")
        return JsonResponse({
            'success': False,
            'error': 'Pedido no encontrado',
            'mensaje': f'No existe un pedido con el número {invoice_number}'
        }, status=404)
    
    except json.JSONDecodeError:
        print("❌ Error al decodificar JSON")
        return JsonResponse({
            'success': False,
            'error': 'Datos inválidos',
            'mensaje': 'Error al procesar los datos enviados'
        }, status=400)
    
    except Exception as e:
        print(f"❌ Error al confirmar pago: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e),
            'mensaje': 'Error interno del servidor'
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def confirmar_pago_con_stock(request, numero_pedido):
    """
    ✅ NUEVA FUNCIONALIDAD: Confirma pago Y descuenta stock automáticamente
    Incluye ingredientes base + ingredientes adicionales de personalizaciones
    """
    try:
        # Buscar el pedido
        pedido = AppkioskoPedidos.objects.get(invoice_number=numero_pedido)
        
        # Validar que el pedido esté en estado correcto
        if hasattr(pedido, 'estado') and pedido.estado:
            if pedido.estado.nombre.lower() in ['cancelado', 'pagado']:
                return Response({
                    'success': False,
                    'error': f'El pedido está en estado "{pedido.estado.nombre}" y no se puede procesar'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        metodo_pago = request.data.get('metodo_pago', 'efectivo')
        print(f"📋 Procesando pedido {numero_pedido}")
        
        stock_actualizado = []
        
        # ✅ PROCESAR CADA DETALLE DEL PEDIDO
        detalles = AppkioskoDetallepedido.objects.filter(pedido=pedido)
        print(f"📋 Procesando {detalles.count()} items del pedido {numero_pedido}")
        
        for detalle in detalles:
            if detalle.producto:
                print(f"🍔 Procesando producto: {detalle.producto.nombre} (cantidad: {detalle.cantidad})")
                
                # ✅ 1. DESCONTAR INGREDIENTES BASE DEL PRODUCTO
                ingredientes_producto = AppkioskoProductosIngredientes.objects.filter(
                    producto=detalle.producto
                ).select_related('ingrediente')
                
                for prod_ingrediente in ingredientes_producto:
                    cantidad_a_descontar = prod_ingrediente.cantidad * detalle.cantidad
                    stock_actual = prod_ingrediente.ingrediente.stock
                    
                    print(f"  🥗 Ingrediente: {prod_ingrediente.ingrediente.nombre}, descontar: {cantidad_a_descontar}, stock actual: {stock_actual}")
                    
                    if stock_actual >= cantidad_a_descontar:
                        nuevo_stock = stock_actual - cantidad_a_descontar
                        prod_ingrediente.ingrediente.stock = nuevo_stock
                        prod_ingrediente.ingrediente.save()
                        
                        stock_actualizado.append({
                            'ingrediente': prod_ingrediente.ingrediente.nombre,
                            'stock_anterior': stock_actual,
                            'cantidad_descontada': cantidad_a_descontar,
                            'stock_nuevo': nuevo_stock,
                            'tipo': 'base'
                        })
                        
                        print(f"    ✅ Stock actualizado: {prod_ingrediente.ingrediente.nombre} ({stock_actual} → {nuevo_stock})")
                    else:
                        print(f"    ⚠️ Stock insuficiente: {prod_ingrediente.ingrediente.nombre} (disponible: {stock_actual}, necesario: {cantidad_a_descontar})")
                
                # ✅ 2. DESCONTAR INGREDIENTES ADICIONALES DE PERSONALIZACIONES
                personalizaciones = AppkioskoPedidoProductoIngredientes.objects.filter(
                    detalle_pedido=detalle,
                    accion='agregar_nuevo'  # Solo los ingredientes que se AGREGARON
                ).select_related('ingrediente')
                
                if personalizaciones.exists():
                    print(f"  🎨 Procesando {personalizaciones.count()} ingredientes adicionales")
                    
                    for personalizacion in personalizaciones:
                        cantidad_a_descontar = personalizacion.cantidad * detalle.cantidad
                        stock_actual = personalizacion.ingrediente.stock
                        
                        print(f"    🔥 Ingrediente adicional: {personalizacion.ingrediente.nombre}, descontar: {cantidad_a_descontar}, stock actual: {stock_actual}")
                        
                        if stock_actual >= cantidad_a_descontar:
                            nuevo_stock = stock_actual - cantidad_a_descontar
                            personalizacion.ingrediente.stock = nuevo_stock
                            personalizacion.ingrediente.save()
                            
                            stock_actualizado.append({
                                'ingrediente': personalizacion.ingrediente.nombre,
                                'stock_anterior': stock_actual,
                                'cantidad_descontada': cantidad_a_descontar,
                                'stock_nuevo': nuevo_stock,
                                'tipo': 'adicional',
                                'accion': personalizacion.accion
                            })
                            
                            print(f"      ✅ Stock adicional actualizado: {personalizacion.ingrediente.nombre} ({stock_actual} → {nuevo_stock})")
                        else:
                            print(f"      ⚠️ Stock adicional insuficiente: {personalizacion.ingrediente.nombre} (disponible: {stock_actual}, necesario: {cantidad_a_descontar})")
        
        # ✅ 3. ACTUALIZAR ESTADO DEL PEDIDO A 'PAGADO' (si existe el campo)
        try:
            if hasattr(pedido, 'estado'):
                estado_pagado = AppkioskoEstados.objects.filter(nombre__iexact='pagado').first()
                if estado_pagado:
                    pedido.estado = estado_pagado
                    pedido.save()
                    print(f"✅ Pedido {numero_pedido} marcado como PAGADO")
        except Exception as e:
            print(f"⚠️ No se pudo cambiar estado: {e}")
        
        # ✅ 4. RESPUESTA DE CONFIRMACIÓN
        ingredientes_base = [item for item in stock_actualizado if item['tipo'] == 'base']
        ingredientes_adicionales = [item for item in stock_actualizado if item['tipo'] == 'adicional']
        
        print(f"✅ Stock actualizado completamente para pedido {numero_pedido}: {len(ingredientes_base)} ingredientes base + {len(ingredientes_adicionales)} ingredientes adicionales")
        
        return Response({
            'success': True,
            'message': f'Pago confirmado para pedido {numero_pedido}',
            'pedido': numero_pedido,
            'metodo_pago': metodo_pago,
            'stock_actualizado': {
                'total_items': len(stock_actualizado),
                'ingredientes_base': ingredientes_base,
                'ingredientes_adicionales': ingredientes_adicionales,
                'resumen': f"{len(ingredientes_base)} base + {len(ingredientes_adicionales)} adicionales = {len(stock_actualizado)} total"
            }
        })
        
    except AppkioskoPedidos.DoesNotExist:
        return Response({
            'success': False,
            'error': f'Pedido {numero_pedido} no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        print(f"❌ Error al confirmar pago con stock: {str(e)}")
        return Response({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)