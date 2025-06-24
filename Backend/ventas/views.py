from django.db import transaction
from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import uuid
from datetime import datetime

from .serializers import CrearPedidoSerializer
from .models import (
    AppkioskoPedidos,
    AppkioskoDetallepedido,
    AppkioskoFacturas,
    AppkioskoTipopago
)
from catalogo.models import AppkioskoProductos, AppkioskoIngredientes
from comun.models import AppkioskoIva

@api_view(['POST'])
@permission_classes([AllowAny])  # Cambia a [IsAuthenticated] si necesitas autenticación
def crear_pedido(request):
    """
    ✅ ENDPOINT PRINCIPAL: Crear pedido completo con productos y personalizaciones
    """
    try:
        print("📥 DATOS RECIBIDOS PARA CREAR PEDIDO:")
        print(f"   - Request data: {request.data}")

        # 1. Validar datos de entrada
        serializer = CrearPedidoSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"❌ Errores de validación: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors,
                'message': 'Datos inválidos'
            }, status=status.HTTP_400_BAD_REQUEST)

        datos_validados = serializer.validated_data
        print(f"✅ Datos validados: {datos_validados}")

        # 2. Crear pedido usando transacción atómica
        with transaction.atomic():
            resultado = procesar_pedido_completo(datos_validados)

            print(f"✅ PEDIDO CREADO EXITOSAMENTE:")
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
                    'estado': resultado['pedido'].estado_id or 1  # Estado inicial
                },
                'message': f'Pedido #{resultado["pedido"].invoice_number} creado exitosamente'
            }

            # Agregar datos de factura si existe
            if resultado.get('factura'):
                response_data['data']['factura_id'] = resultado['factura'].id
                response_data['data']['numero_factura'] = f"F-{resultado['factura'].id:06d}"

            return Response(response_data, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"❌ ERROR AL CREAR PEDIDO: {e}")
        import traceback
        print(f"❌ TRACEBACK: {traceback.format_exc()}")

        return Response({
            'success': False,
            'error': str(e),
            'message': 'Error interno del servidor al procesar el pedido'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def procesar_pedido_completo(datos_validados):
    """
    ✅ FUNCIÓN PRINCIPAL: Procesar pedido completo con todos sus detalles
    """
    print("🔄 INICIANDO PROCESAMIENTO DE PEDIDO COMPLETO...")

    # 1. Obtener o crear tipo de pago
    tipo_pago_nombre = datos_validados['tipo_pago']
    tipo_pago, created = AppkioskoTipopago.objects.get_or_create(
        nombre=tipo_pago_nombre,
        defaults={'created_at': datetime.now(), 'updated_at': datetime.now()}
    )
    print(f"💳 Tipo de pago: {tipo_pago.nombre} (ID: {tipo_pago.id})")

    # 2. Crear registro principal del pedido
    pedido = crear_pedido_principal(datos_validados, tipo_pago)
    print(f"📝 Pedido principal creado: ID {pedido.id}")

    # 3. Crear detalles del pedido (productos + personalizaciones)
    crear_detalles_pedido(pedido, datos_validados['productos'])
    print(f"📋 Detalles del pedido creados: {len(datos_validados['productos'])} productos")

    # 4. Crear factura si hay datos de facturación
    factura = None
    if datos_validados.get('datos_facturacion'):
        factura = crear_factura(pedido, datos_validados['datos_facturacion'])
        print(f"🧾 Factura creada: ID {factura.id}")

    return {
        'pedido': pedido,
        'factura': factura
    }


def crear_pedido_principal(datos_validados, tipo_pago):
    """
    ✅ CREAR: Registro principal en appkiosko_pedidos
    """
    # Generar número de pedido único
    numero_pedido = generar_numero_pedido()

    # ✅ MANEJAR MESA/TURNO CORRECTAMENTE
    numero_mesa = datos_validados['numero_mesa']  # Este puede ser mesa o turno
    if numero_mesa == 0:
        numero_mesa = None  # Para llevar no tiene mesa

    # ✅ OBTENER ESTADO INICIAL DINÁMICAMENTE
    from comun.models import AppkioskoEstados
    try:
        # Buscar estado activo (priorizar "Pendiente" o similar)
        estado_inicial = AppkioskoEstados.objects.filter(
            is_active=True
        ).order_by('id').first()

        if not estado_inicial:
            # Si no hay estados activos, crear uno básico
            estado_inicial = AppkioskoEstados.objects.create(
                nombre='Pendiente',
                descripcion='Pedido recibido',
                is_active=True,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            print("⚠️ Se creó estado inicial automáticamente")

        estado_id = estado_inicial.id
        print(f"✅ Estado inicial asignado: {estado_inicial.nombre} (ID: {estado_id})")

    except Exception as e:
        print(f"❌ Error obteniendo estado: {e}")
        raise ValueError("No se pudo asignar un estado inicial al pedido")

    # Datos básicos del pedido
    pedido_data = {
        'invoice_number': numero_pedido,
        'tipo_entrega': datos_validados['tipo_entrega'],
        'total': datos_validados['total'],
        'numero_mesa': numero_mesa,  # ✅ AQUÍ GUARDAS EL TURNO
        'tipo_pago_id': tipo_pago.id,
        'is_facturado': 1 if datos_validados.get('datos_facturacion') else 0,
        'estado_id': estado_id,
        'created_at': datetime.now(),
        'updated_at': datetime.now()
    }

    print(f"🏠 CREANDO PEDIDO CON MESA/TURNO: {numero_mesa}")
    print(f"   - Tipo entrega: {datos_validados['tipo_entrega']}")
    print(f"   - Estado ID: {estado_id}")

    pedido = AppkioskoPedidos.objects.create(**pedido_data)
    print(f"✅ Pedido #{numero_pedido} creado con mesa/turno: {pedido.numero_mesa}")

    return pedido


def crear_detalles_pedido(pedido, productos_data):
    """
    ✅ CREAR: Detalles del pedido en appkiosko_detallepedido
    """
    for producto_data in productos_data:
        print(f"🍔 Procesando producto ID: {producto_data['producto_id']}")

        # Verificar que el producto existe
        try:
            producto = AppkioskoProductos.objects.get(id=producto_data['producto_id'])
        except AppkioskoProductos.DoesNotExist:
            raise ValueError(f"Producto con ID {producto_data['producto_id']} no existe")

        # Crear detalle del pedido
        detalle = AppkioskoDetallepedido.objects.create(
            pedido_id=pedido.id,
            producto_id=producto.id,
            cantidad=producto_data['cantidad'],
            precio_unitario=producto_data['precio_unitario'],
            subtotal=producto_data['subtotal'],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        # Procesar personalizaciones de ingredientes
        personalizaciones = producto_data.get('personalizaciones', [])
        if personalizaciones:
            procesar_personalizaciones(detalle, personalizaciones)


def procesar_personalizaciones(detalle_pedido, personalizaciones):
    """
    ✅ PROCESAR: Personalizaciones de ingredientes
    Nota: Guardamos en el campo 'menu_id' la información de personalizaciones
    """
    personalizaciones_info = []

    for p in personalizaciones:
        # Verificar que el ingrediente existe
        try:
            ingrediente = AppkioskoIngredientes.objects.get(id=p['ingrediente_id'])
            personalizaciones_info.append({
                'ingrediente_id': p['ingrediente_id'],
                'ingrediente_nombre': ingrediente.nombre,
                'accion': p['accion'],
                'precio_aplicado': float(p['precio_aplicado'])
            })
            print(f"  🥬 {p['accion']} {ingrediente.nombre} (+${p['precio_aplicado']})")
        except AppkioskoIngredientes.DoesNotExist:
            print(f"  ⚠️ Ingrediente ID {p['ingrediente_id']} no encontrado, omitiendo...")

    # Guardar personalizaciones como JSON en menu_id (temporal)
    # TODO: Considerar crear tabla específica para personalizaciones
    if personalizaciones_info:
        import json
        detalle_pedido.menu_id = json.dumps(personalizaciones_info)
        detalle_pedido.save()


def crear_factura(pedido, datos_facturacion):
    """
    ✅ CREAR: Factura en appkiosko_facturas
    """
    factura = AppkioskoFacturas.objects.create(
        pedido_id=pedido.id,
        nombre_cliente=datos_facturacion['nombre_completo'],
        email_cliente=datos_facturacion['correo'],
        cedula_cliente=datos_facturacion['cedula'],
        telefono_cliente=datos_facturacion['telefono'],
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    print(f"🧾 Factura creada para {datos_facturacion['nombre_completo']}")
    return factura


def generar_numero_pedido():
    """
    ✅ GENERAR: Número único de pedido
    """
    # Formato: YYYYMMDD-HHMMSS-XXX
    timestamp = datetime.now()
    fecha_parte = timestamp.strftime("%Y%m%d")
    hora_parte = timestamp.strftime("%H%M%S")

    # Buscar último pedido del día para secuencial
    import random
    secuencial = random.randint(100, 999)  # Por simplicidad, usar random

    return f"{fecha_parte}-{hora_parte}-{secuencial}"


# ✅ ENDPOINT ADICIONAL: Obtener pedido por ID
@api_view(['GET'])
@permission_classes([AllowAny])
def obtener_pedido(request, pedido_id):
    """Obtener detalles de un pedido específico"""
    try:
        pedido = AppkioskoPedidos.objects.get(id=pedido_id)
        detalles = AppkioskoDetallepedido.objects.filter(pedido_id=pedido_id)

        return Response({
            'success': True,
            'data': {
                'pedido': {
                    'id': pedido.id,
                    'numero': pedido.invoice_number,
                    'total': float(pedido.total),
                    'estado': pedido.estado_id,
                    'mesa': pedido.numero_mesa,
                    'tipo_entrega': pedido.tipo_entrega
                },
                'productos': [
                    {
                        'producto_id': d.producto_id,
                        'cantidad': d.cantidad,
                        'precio_unitario': float(d.precio_unitario),
                        'subtotal': float(d.subtotal),
                        'personalizaciones': d.menu_id  # JSON con personalizaciones
                    } for d in detalles
                ]
            }
        })
    except AppkioskoPedidos.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Pedido no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
