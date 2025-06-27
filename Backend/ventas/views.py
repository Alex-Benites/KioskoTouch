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
    ✅ ACTUALIZADO: Crear detalles con promociones para productos Y menús
    """
    # ✅ MANTENER TUS IMPORTACIONES EXISTENTES
    from catalogo.models import AppkioskoProductos, AppkioskoMenus
    from .models import AppkioskoPedidoProductoIngredientes  # ✅ NECESARIO para ingredientes

    print(f"📋 Creando detalles de pedido: {len(productos_data)} items")

    for producto_data in productos_data:
        producto_id = producto_data.get('producto_id')
        menu_id = producto_data.get('menu_id')

        precio_original = float(producto_data['precio_unitario'])
        cantidad = producto_data['cantidad']

        # ✅ NUEVAS VARIABLES para promoción
        promocion = None
        precio_final = precio_original
        descuento = 0.00

        if producto_id:
            # ✅ PROCESAR PRODUCTO (CONSERVAR TU LÓGICA EXISTENTE)
            print(f"🍔 Procesando producto ID: {producto_id}")

            try:
                producto = AppkioskoProductos.objects.select_related('estado').get(id=producto_id)

                if producto.estado and producto.estado.is_active != 1:
                    raise ValueError(f"El producto '{producto.nombre}' no está disponible")

            except AppkioskoProductos.DoesNotExist:
                raise ValueError(f"Producto con ID {producto_id} no existe")

            # ✅ AGREGAR: Verificar promoción activa
            promocion = obtener_promocion_activa(producto=producto)
            if promocion:
                precio_final, descuento = calcular_precio_con_promocion(precio_original, promocion)

            # ✅ MODIFICAR: Crear detalle con promoción
            detalle = AppkioskoDetallepedido.objects.create(
                pedido_id=pedido.id,
                producto_id=producto.id,
                menu_id=None,
                cantidad=cantidad,
                precio_unitario=precio_final,  # ✅ Precio CON descuento
                subtotal=precio_final * cantidad,  # ✅ Subtotal correcto

                # ✅ NUEVOS CAMPOS (solo si ya tienes los campos en el modelo)
                precio_original=precio_original if promocion else None,
                promocion=promocion,
                descuento_promocion=descuento,

                created_at=datetime.now(),
                updated_at=datetime.now()
            )

            # ✅ CONSERVAR: Procesar ingredientes (TU FUNCIÓN EXISTENTE)
            procesar_todos_los_ingredientes(pedido, producto, producto_data)

        elif menu_id:
            # ✅ PROCESAR MENÚ (CONSERVAR TU LÓGICA EXISTENTE)
            print(f"🍽️ Procesando menú ID: {menu_id}")

            try:
                menu = AppkioskoMenus.objects.select_related('estado').get(id=menu_id)

                if not menu.esta_activo:
                    raise ValueError(f"El menú '{menu.nombre}' no está disponible")

            except AppkioskoMenus.DoesNotExist:
                raise ValueError(f"Menú con ID {menu_id} no existe")

            # ✅ AGREGAR: Verificar promoción activa para menú
            promocion = obtener_promocion_activa(menu=menu)
            if promocion:
                precio_final, descuento = calcular_precio_con_promocion(precio_original, promocion)

            # ✅ MODIFICAR: Crear detalle con promoción
            detalle = AppkioskoDetallepedido.objects.create(
                pedido_id=pedido.id,
                producto_id=None,
                menu_id=menu.id,
                cantidad=cantidad,
                precio_unitario=precio_final,  # ✅ Precio CON descuento
                subtotal=precio_final * cantidad,  # ✅ Subtotal correcto

                # ✅ NUEVOS CAMPOS (solo si ya tienes los campos en el modelo)
                precio_original=precio_original if promocion else None,
                promocion=promocion,
                descuento_promocion=descuento,

                created_at=datetime.now(),
                updated_at=datetime.now()
            )

            print(f"  ✅ Menú '{menu.nombre}' agregado")

        else:
            raise ValueError("Debe especificar producto_id o menu_id")

        # ✅ AGREGAR: Log del resultado
        if promocion:
            print(f"  ✅ Detalle creado CON promoción:")
            print(f"     - Item: {producto.nombre if producto_id else menu.nombre}")
            print(f"     - Promoción: {promocion.nombre}")
            print(f"     - Precio original: ${precio_original}")
            print(f"     - Descuento: ${descuento}")
            print(f"     - Precio final: ${precio_final}")
        else:
            print(f"  ✅ Detalle creado SIN promoción: ID {detalle.id}")

    print(f"📋 Detalles del pedido creados: {len(productos_data)} productos")

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


def procesar_todos_los_ingredientes(pedido, producto, producto_data):
    """
    ✅ CORREGIDA: Procesar ingredientes con cantidad FINAL correcta
    """
    from catalogo.models import AppkioskoProductosIngredientes
    from .models import AppkioskoPedidoProductoIngredientes

    print(f"🥗 Procesando ingredientes para producto: {producto.nombre}")

    # 1. OBTENER TODOS LOS INGREDIENTES DEL PRODUCTO CON SUS CANTIDADES BASE
    ingredientes_producto = AppkioskoProductosIngredientes.objects.filter(
        producto=producto
    ).select_related('ingrediente')

    print(f"   📋 Ingredientes del producto encontrados: {ingredientes_producto.count()}")

    # 2. OBTENER PERSONALIZACIONES DEL CLIENTE Y CALCULAR CANTIDADES FINALES
    personalizaciones = producto_data.get('personalizaciones', [])
    cambios_ingredientes = {}

    # Agrupar cambios por ingrediente
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

    print(f"   🔧 Cambios de ingredientes: {len(cambios_ingredientes)}")

    # Log detallado de cambios
    for ing_id, cambios in cambios_ingredientes.items():
        print(f"     - Ingrediente {ing_id}: +{cambios['cantidad_agregada']} -{cambios['cantidad_quitada']}")

    # 3. PROCESAR TODOS LOS INGREDIENTES DEL PRODUCTO
    for ingrediente_producto in ingredientes_producto:
        ingrediente_id = ingrediente_producto.ingrediente.id
        ingrediente_nombre = ingrediente_producto.ingrediente.nombre
        es_base = ingrediente_producto.es_base

        # ✅ OBTENER CANTIDAD BASE del producto (puede ser > 1)
        cantidad_base = getattr(ingrediente_producto, 'cantidad', 1)  # Por defecto 1

        print(f"\n   🔄 Procesando: {ingrediente_nombre} (ID:{ingrediente_id}, base:{es_base})")
        print(f"     📦 Cantidad base en producto: {cantidad_base}")

        # Calcular cantidad final
        cambios = cambios_ingredientes.get(ingrediente_id, {
            'cantidad_agregada': 0,
            'cantidad_quitada': 0,
            'precio_por_unidad': 0
        })

        cantidad_final = cantidad_base + cambios['cantidad_agregada'] - cambios['cantidad_quitada']

        print(f"     🧮 Cálculo: {cantidad_base} + {cambios['cantidad_agregada']} - {cambios['cantidad_quitada']} = {cantidad_final}")

        if cantidad_final < 0:
            cantidad_final = 0  # No puede ser negativo
            print(f"     ⚠️ Cantidad ajustada a 0 (no puede ser negativa)")

        # ✅ GUARDAR RESULTADO FINAL
        if cantidad_final == 0:
            # Ingrediente completamente eliminado
            print(f"     ❌ Ingrediente ELIMINADO completamente: {ingrediente_nombre}")

            AppkioskoPedidoProductoIngredientes.objects.create(
                pedido=pedido,
                producto=producto,
                ingrediente=ingrediente_producto.ingrediente,
                accion='eliminar_completo',
                precio_aplicado=0.00,
                cantidad=0,  # ✅ CANTIDAD 0 = ELIMINADO
                created_at=datetime.now()
            )

        elif cantidad_final == cantidad_base:
            # Cantidad normal (sin cambios)
            print(f"     ✅ Cantidad NORMAL: {ingrediente_nombre} x{cantidad_final}")

            accion_tipo = 'incluir_base' if es_base else 'incluir_adicional'
            AppkioskoPedidoProductoIngredientes.objects.create(
                pedido=pedido,
                producto=producto,
                ingrediente=ingrediente_producto.ingrediente,
                accion=accion_tipo,
                precio_aplicado=0.00,
                cantidad=cantidad_final,  # ✅ CANTIDAD ORIGINAL
                created_at=datetime.now()
            )

        else:
            # Cantidad modificada (mayor o menor que la base)
            if cantidad_final > cantidad_base:
                print(f"     ➕ Cantidad AUMENTADA: {ingrediente_nombre} x{cantidad_final} (era {cantidad_base})")
                accion_tipo = 'cantidad_aumentada'
                precio_extra = cambios['precio_por_unidad'] * cambios['cantidad_agregada']
            else:
                print(f"     ➖ Cantidad REDUCIDA: {ingrediente_nombre} x{cantidad_final} (era {cantidad_base})")
                accion_tipo = 'cantidad_reducida'
                precio_extra = 0.00

            AppkioskoPedidoProductoIngredientes.objects.create(
                pedido=pedido,
                producto=producto,
                ingrediente=ingrediente_producto.ingrediente,
                accion=accion_tipo,
                precio_aplicado=precio_extra,
                cantidad=cantidad_final,  # ✅ CANTIDAD FINAL REAL
                created_at=datetime.now()
            )

        # Remover de cambios procesados
        if ingrediente_id in cambios_ingredientes:
            del cambios_ingredientes[ingrediente_id]

    # 4. PROCESAR INGREDIENTES COMPLETAMENTE NUEVOS (no estaban en el producto original)
    for ingrediente_id, cambios in cambios_ingredientes.items():
        if cambios['cantidad_agregada'] > 0:
            try:
                ingrediente = AppkioskoIngredientes.objects.get(id=ingrediente_id)
                cantidad_nueva = cambios['cantidad_agregada']
                precio_total = cambios['precio_por_unidad'] * cantidad_nueva

                print(f"\n   🆕 Ingrediente COMPLETAMENTE NUEVO: {ingrediente.nombre} x{cantidad_nueva}")

                AppkioskoPedidoProductoIngredientes.objects.create(
                    pedido=pedido,
                    producto=producto,
                    ingrediente=ingrediente,
                    accion='agregar_nuevo',
                    precio_aplicado=cambios['precio_por_unidad'],
                    cantidad=cantidad_nueva,  # ✅ CANTIDAD TOTAL NUEVA
                    created_at=datetime.now()
                )

                print(f"     ✅ Guardado: {ingrediente.nombre} x{cantidad_nueva} (+${precio_total})")

            except AppkioskoIngredientes.DoesNotExist:
                print(f"   ⚠️ Ingrediente ID {ingrediente_id} no encontrado, omitiendo...")

    print(f"\n   ✅ Procesamiento completado para {producto.nombre}")


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

def obtener_promocion_activa(producto=None, menu=None):
    """
    ✅ VERIFICAR: Si hay promoción activa para producto/menú (DINÁMICO)
    """
    try:
        # ✅ IMPORTS CORREGIDOS
        from marketing.models import AppkioskoPromocionproductos, AppkioskoPromocionmenu
        from django.utils import timezone

        if producto:
            # ✅ BUSCAR PROMOCIÓN CON ESTADO ACTIVO (dinámico)
            promocion_producto = AppkioskoPromocionproductos.objects.filter(
                producto=producto,
                promocion__fecha_inicio_promo__lte=timezone.now(),
                promocion__fecha_fin_promo__gte=timezone.now(),
                # ✅ VERIFICAR ESTADO ACTIVO POR NOMBRE O FLAG
                promocion__estado__is_active=1  # O usar is_active=True si es Boolean
            ).select_related('promocion', 'promocion__estado').first()

            # ✅ DEBUG: Mostrar información detallada
            if promocion_producto:
                promo = promocion_producto.promocion
                print(f"   🎁 Promoción encontrada para producto {producto.nombre}:")
                print(f"      - Nombre: {promo.nombre}")
                print(f"      - Estado ID: {promo.estado_id}")
                print(f"      - Estado nombre: {promo.estado.nombre if promo.estado else 'N/A'}")
                print(f"      - Fecha inicio: {promo.fecha_inicio_promo}")
                print(f"      - Fecha fin: {promo.fecha_fin_promo}")
                return promo
            else:
                # ✅ DEBUG: Mostrar por qué no encontró promoción
                todas_promociones = AppkioskoPromocionproductos.objects.filter(
                    producto=producto
                ).select_related('promocion', 'promocion__estado')

                print(f"   🔍 DEBUG - Promociones encontradas para producto {producto.nombre}:")
                for promo_prod in todas_promociones:
                    promo = promo_prod.promocion
                    print(f"      - Promoción: {promo.nombre}")
                    print(f"        Estado ID: {promo.estado_id}")
                    print(f"        Estado nombre: {promo.estado.nombre if promo.estado else 'N/A'}")
                    print(f"        Is active: {promo.estado.is_active if promo.estado else 'N/A'}")
                    print(f"        Fecha inicio: {promo.fecha_inicio_promo}")
                    print(f"        Fecha fin: {promo.fecha_fin_promo}")
                    print(f"        En rango de fechas: {promo.fecha_inicio_promo <= timezone.now() <= promo.fecha_fin_promo}")

        elif menu:
            # ✅ SIMILAR PARA MENÚS
            promocion_menu = AppkioskoPromocionmenu.objects.filter(
                menu=menu,
                promocion__fecha_inicio_promo__lte=timezone.now(),
                promocion__fecha_fin_promo__gte=timezone.now(),
                promocion__estado__is_active=1  # O usar estado_id=4
            ).select_related('promocion', 'promocion__estado').first()

            if promocion_menu:
                promo = promocion_menu.promocion
                print(f"   🎁 Promoción encontrada para menú {menu.nombre}:")
                print(f"      - Nombre: {promo.nombre}")
                print(f"      - Estado ID: {promo.estado_id}")
                print(f"      - Estado nombre: {promo.estado.nombre if promo.estado else 'N/A'}")
                return promo
            else:
                # ✅ DEBUG PARA MENÚS
                todas_promociones = AppkioskoPromocionmenu.objects.filter(
                    menu=menu
                ).select_related('promocion', 'promocion__estado')

                print(f"   🔍 DEBUG - Promociones encontradas para menú {menu.nombre}:")
                for promo_menu in todas_promociones:
                    promo = promo_menu.promocion
                    print(f"      - Promoción: {promo.nombre}")
                    print(f"        Estado ID: {promo.estado_id}")
                    print(f"        Estado nombre: {promo.estado.nombre if promo.estado else 'N/A'}")
                    print(f"        Is active: {promo.estado.is_active if promo.estado else 'N/A'}")
                    print(f"        Fecha inicio: {promo.fecha_inicio_promo}")
                    print(f"        Fecha fin: {promo.fecha_fin_promo}")

        print(f"   📋 Sin promoción activa para {'producto' if producto else 'menú'}")
        return None

    except ImportError as e:
        print(f"   ⚠️ Error de importación: {e}")
        return None
    except Exception as e:
        print(f"   ❌ Error buscando promoción: {e}")
        return None


def calcular_precio_con_promocion(precio_base, promocion):
    """
    ✅ CALCULAR: Precio final aplicando promoción
    """
    if not promocion:
        return precio_base, 0.00

    try:
        # Obtener el tipo de descuento desde la promoción
        valor_descuento = float(promocion.valor_descuento)

        # Asumir que el campo valor_descuento es el porcentaje
        # Si tienes campo tipo_descuento, ajusta aquí
        descuento = precio_base * (valor_descuento / 100)

        # Asegurar que el descuento no sea mayor al precio
        descuento = min(descuento, precio_base)
        precio_final = max(0, precio_base - descuento)

        print(f"   💰 Cálculo promoción:")
        print(f"      - Precio base: ${precio_base}")
        print(f"      - Descuento ({valor_descuento}%): ${descuento}")
        print(f"      - Precio final: ${precio_final}")

        return precio_final, descuento

    except Exception as e:
        print(f"   ❌ Error calculando promoción: {e}")
        return precio_base, 0.00
