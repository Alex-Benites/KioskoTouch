import os
import sys
import django
from datetime import datetime, timedelta
import random
from decimal import Decimal

# Configurar Django para que el script pueda usar los modelos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'KioskoTouch.settings')
django.setup()

# Importar modelos
from django.db import transaction
from django.utils import timezone
from ventas.models import AppkioskoPedidos, AppkioskoDetallepedido
from marketing.models import AppkioskoPromociones, AppkioskoPromocionproductos, AppkioskoPromocionmenu
from catalogo.models import AppkioskoProductos, AppkioskoMenus
from comun.models import AppkioskoTipopago

def limpiar_datos_promociones():
    """Elimina datos existentes de promociones y pedidos relacionados"""
    print("Limpiando datos existentes...")
    
    # Eliminar pedidos (esto eliminará automáticamente los detalles por CASCADE)
    pedidos_count = AppkioskoPedidos.objects.count()
    if pedidos_count > 0:
        AppkioskoPedidos.objects.all().delete()
        print(f"✓ {pedidos_count} pedidos eliminados")
    
    # Eliminar asociaciones de promociones
    promo_productos_count = AppkioskoPromocionproductos.objects.count()
    promo_menus_count = AppkioskoPromocionmenu.objects.count()
    
    if promo_productos_count > 0:
        AppkioskoPromocionproductos.objects.all().delete()
        print(f"✓ {promo_productos_count} asociaciones promoción-producto eliminadas")
    
    if promo_menus_count > 0:
        AppkioskoPromocionmenu.objects.all().delete()
        print(f"✓ {promo_menus_count} asociaciones promoción-menú eliminadas")
    
    # Eliminar promociones
    promociones_count = AppkioskoPromociones.objects.count()
    if promociones_count > 0:
        AppkioskoPromociones.objects.all().delete()
        print(f"✓ {promociones_count} promociones eliminadas")

def crear_productos_ejemplo():
    """Crea productos de ejemplo si no existen"""
    print("\nCreando productos de ejemplo...")
    
    productos_data = [
        {'nombre': 'Hamburguesa Clásica', 'descripcion': 'Hamburguesa con carne, lechuga y tomate', 'precio': 8.50},
        {'nombre': 'Pizza Margherita', 'descripcion': 'Pizza con tomate, mozzarella y albahaca', 'precio': 12.00},
        {'nombre': 'Coca Cola', 'descripcion': 'Bebida gaseosa 500ml', 'precio': 2.50},
        {'nombre': 'Papas Fritas', 'descripcion': 'Papas fritas crujientes', 'precio': 4.00},
        {'nombre': 'Pollo a la Brasa', 'descripcion': 'Pollo entero a la brasa', 'precio': 15.00},
        {'nombre': 'Ensalada César', 'descripcion': 'Ensalada fresca con pollo', 'precio': 7.50},
    ]
    
    productos_creados = []
    for prod_data in productos_data:
        producto, created = AppkioskoProductos.objects.get_or_create(
            nombre=prod_data['nombre'],
            defaults={
                'descripcion': prod_data['descripcion'],
                'precio': Decimal(str(prod_data['precio'])),
                'estado': None
            }
        )
        productos_creados.append(producto)
        if created:
            print(f"✓ Producto creado: {producto.nombre}")
        else:
            print(f"⚠ Producto ya existe: {producto.nombre}")
    
    return productos_creados

def crear_menus_ejemplo():
    """Crea menús de ejemplo si no existen"""
    print("\nCreando menús de ejemplo...")
    
    menus_data = [
        {'nombre': 'Combo Familiar', 'descripcion': 'Combo para 4 personas con pollo, papas y bebidas', 'precio': 25.00},
        {'nombre': 'Menú Ejecutivo', 'descripcion': 'Plato principal + ensalada + bebida', 'precio': 18.00},
        {'nombre': 'Combo Kids', 'descripcion': 'Hamburguesa pequeña + papas + jugo', 'precio': 9.50},
        {'nombre': 'Menú Vegetariano', 'descripcion': 'Ensalada completa + bebida natural', 'precio': 11.00},
    ]
    
    menus_creados = []
    for menu_data in menus_data:
        menu, created = AppkioskoMenus.objects.get_or_create(
            nombre=menu_data['nombre'],
            defaults={
                'descripcion': menu_data['descripcion'],
                'precio': Decimal(str(menu_data['precio'])),
                'estado': None
            }
        )
        menus_creados.append(menu)
        if created:
            print(f"✓ Menú creado: {menu.nombre}")
        else:
            print(f"⚠ Menú ya existe: {menu.nombre}")
    
    return menus_creados

def crear_promociones():
    """Crea promociones de ejemplo"""
    print("\nCreando promociones...")
    
    promociones_data = [
        {'nombre': 'Promo 1', 'descripcion': 'Descuento 10% en hamburguesas', 'valor_descuento': 10},
        {'nombre': 'Promo 2', 'descripcion': 'Descuento 15% en pizzas', 'valor_descuento': 15},
        {'nombre': 'Promo 3', 'descripcion': 'Descuento 20% en bebidas', 'valor_descuento': 20},
        {'nombre': 'Promo 4', 'descripcion': 'Descuento 25% en combos familiares', 'valor_descuento': 25},
        {'nombre': 'Promo 5', 'descripcion': 'Descuento 30% en menús ejecutivos', 'valor_descuento': 30},
    ]
    
    promociones_creadas = []
    for promo_data in promociones_data:
        promocion = AppkioskoPromociones.objects.create(
            nombre=promo_data['nombre'],
            descripcion=promo_data['descripcion'],
            valor_descuento=promo_data['valor_descuento'],
            fecha_inicio_promo=timezone.now() - timedelta(days=30),
            fecha_fin_promo=timezone.now() + timedelta(days=30),
            tipo_promocion='descuento',
            limite_uso_total=100,
            estado=None
        )
        promociones_creadas.append(promocion)
        print(f"✓ Promoción creada: {promocion.nombre} ({promocion.valor_descuento}%)")
    
    return promociones_creadas

def asociar_promociones_productos_y_menus(promociones, productos, menus):
    """Asocia promociones con productos y menús específicos"""
    print("\nAsociando promociones con productos y menús...")
    
    # Asociaciones con productos
    asociaciones_productos = [
        (promociones[0], productos[0]),  # Promo 1 -> Hamburguesa
        (promociones[1], productos[1]),  # Promo 2 -> Pizza
        (promociones[2], productos[2]),  # Promo 3 -> Coca Cola
    ]
    
    for promocion, producto in asociaciones_productos:
        AppkioskoPromocionproductos.objects.create(
            promocion=promocion,
            producto=producto,
            tamano=None
        )
        print(f"✓ {promocion.nombre} asociada con producto: {producto.nombre}")
    
    # Asociaciones con menús
    asociaciones_menus = [
        (promociones[3], menus[0]),  # Promo 4 -> Combo Familiar
        (promociones[4], menus[1]),  # Promo 5 -> Menú Ejecutivo
    ]
    
    for promocion, menu in asociaciones_menus:
        AppkioskoPromocionmenu.objects.create(
            promocion=promocion,
            menu=menu
        )
        print(f"✓ {promocion.nombre} asociada con menú: {menu.nombre}")

def generar_pedidos_con_promociones(promociones, productos, menus):
    """Genera pedidos con promociones aplicadas"""
    print("\nGenerando pedidos con promociones...")
    
    # Crear tipo de pago si no existe
    tipo_pago, created = AppkioskoTipopago.objects.get_or_create(
        nombre='Efectivo'
    )
    
    if created:
        print(f"✓ Tipo de pago creado: {tipo_pago.nombre}")
    
    fecha_inicio = timezone.now() - timedelta(days=90)
    
    # Distribución de uso por promoción - productos
    distribucion_productos = [
        (promociones[0], productos[0], 28),  # Promo 1: 28 usos (Hamburguesa)
        (promociones[1], productos[1], 15),  # Promo 2: 15 usos (Pizza)
        (promociones[2], productos[2], 20),  # Promo 3: 20 usos (Coca Cola)
    ]
    
    # Distribución de uso por promoción - menús
    distribucion_menus = [
        (promociones[3], menus[0], 35),  # Promo 4: 35 usos (Combo Familiar)
        (promociones[4], menus[1], 22),  # Promo 5: 22 usos (Menú Ejecutivo)
    ]
    
    contador_invoice = 1
    pedidos_creados = 0
    
    # Generar pedidos con productos promocionados
    for promocion, producto, cantidad_usos in distribucion_productos:
        print(f"  Generando {cantidad_usos} pedidos para {promocion.nombre} (Producto: {producto.nombre})...")
        
        for i in range(cantidad_usos):
            # Fecha aleatoria en los últimos 3 meses
            dias_random = random.randint(0, 90)
            fecha_pedido = fecha_inicio + timedelta(days=dias_random)
            
            # Calcular precios
            precio_original = producto.precio
            porcentaje_descuento = Decimal(str(promocion.valor_descuento)) / Decimal('100')
            descuento = precio_original * porcentaje_descuento
            precio_con_descuento = precio_original - descuento
            
            # Crear pedido
            pedido = AppkioskoPedidos.objects.create(
                invoice_number=f'INV-{contador_invoice:06d}',
                tipo_entrega='mesa',
                total=precio_con_descuento,
                numero_mesa=random.randint(1, 20),
                cliente=None,
                valor_descuento=descuento,
                tipo_pago=tipo_pago,
                fecha_pago=fecha_pedido,
                is_facturado=True,
                estado=None,
                created_at=fecha_pedido
            )
            contador_invoice += 1
            
            # Crear detalle del pedido (producto)
            AppkioskoDetallepedido.objects.create(
                pedido=pedido,
                producto=producto,
                menu=None,
                cantidad=1,
                precio_unitario=precio_con_descuento,
                subtotal=precio_con_descuento,
                created_at=fecha_pedido
            )
            pedidos_creados += 1
    
    # Generar pedidos con menús promocionados
    for promocion, menu, cantidad_usos in distribucion_menus:
        print(f"  Generando {cantidad_usos} pedidos para {promocion.nombre} (Menú: {menu.nombre})...")
        
        for i in range(cantidad_usos):
            # Fecha aleatoria en los últimos 3 meses
            dias_random = random.randint(0, 90)
            fecha_pedido = fecha_inicio + timedelta(days=dias_random)
            
            # Calcular precios
            precio_original = menu.precio
            porcentaje_descuento = Decimal(str(promocion.valor_descuento)) / Decimal('100')
            descuento = precio_original * porcentaje_descuento
            precio_con_descuento = precio_original - descuento
            
            # Crear pedido
            pedido = AppkioskoPedidos.objects.create(
                invoice_number=f'INV-{contador_invoice:06d}',
                tipo_entrega='mesa',
                total=precio_con_descuento,
                numero_mesa=random.randint(1, 20),
                cliente=None,
                valor_descuento=descuento,
                tipo_pago=tipo_pago,
                fecha_pago=fecha_pedido,
                is_facturado=True,
                estado=None,
                created_at=fecha_pedido
            )
            contador_invoice += 1
            
            # Crear detalle del pedido (menú)
            AppkioskoDetallepedido.objects.create(
                pedido=pedido,
                producto=None,
                menu=menu,
                cantidad=1,
                precio_unitario=precio_con_descuento,
                subtotal=precio_con_descuento,
                created_at=fecha_pedido
            )
            pedidos_creados += 1
    
    # Generar pedidos sin promoción
    print("  Generando pedidos sin promoción...")
    for i in range(40):
        dias_random = random.randint(0, 90)
        fecha_pedido = fecha_inicio + timedelta(days=dias_random)
        
        # Decidir aleatoriamente entre producto o menú
        if random.choice([True, False]):
            # Pedido con producto
            producto = random.choice(productos)
            cantidad = random.randint(1, 3)
            subtotal = producto.precio * Decimal(str(cantidad))
            
            pedido = AppkioskoPedidos.objects.create(
                invoice_number=f'INV-{contador_invoice:06d}',
                tipo_entrega='mesa',
                total=subtotal,
                numero_mesa=random.randint(1, 20),
                cliente=None,
                valor_descuento=Decimal('0.00'),
                tipo_pago=tipo_pago,
                fecha_pago=fecha_pedido,
                is_facturado=True,
                estado=None,
                created_at=fecha_pedido
            )
            contador_invoice += 1
            
            AppkioskoDetallepedido.objects.create(
                pedido=pedido,
                producto=producto,
                menu=None,
                cantidad=cantidad,
                precio_unitario=producto.precio,
                subtotal=subtotal,
                created_at=fecha_pedido
            )
        else:
            # Pedido con menú
            menu = random.choice(menus)
            cantidad = 1
            subtotal = menu.precio * Decimal(str(cantidad))
            
            pedido = AppkioskoPedidos.objects.create(
                invoice_number=f'INV-{contador_invoice:06d}',
                tipo_entrega='mesa',
                total=subtotal,
                numero_mesa=random.randint(1, 20),
                cliente=None,
                valor_descuento=Decimal('0.00'),
                tipo_pago=tipo_pago,
                fecha_pago=fecha_pedido,
                is_facturado=True,
                estado=None,
                created_at=fecha_pedido
            )
            contador_invoice += 1
            
            AppkioskoDetallepedido.objects.create(
                pedido=pedido,
                producto=None,
                menu=menu,
                cantidad=cantidad,
                precio_unitario=menu.precio,
                subtotal=subtotal,
                created_at=fecha_pedido
            )
        
        pedidos_creados += 1
    
    print(f"✓ {pedidos_creados} pedidos generados")

def listar_estadisticas():
    """Muestra estadísticas generadas"""
    print("\n" + "="*50)
    print("ESTADÍSTICAS GENERADAS:")
    print("="*50)
    
    # Promociones
    promociones = AppkioskoPromociones.objects.all()
    print(f"📊 Promociones: {promociones.count()}")
    for promo in promociones:
        productos_count = AppkioskoPromocionproductos.objects.filter(promocion=promo).count()
        menus_count = AppkioskoPromocionmenu.objects.filter(promocion=promo).count()
        
        # Contar pedidos con productos promocionados
        pedidos_productos = AppkioskoPedidos.objects.filter(
            valor_descuento__gt=0,
            appkioskodetallepedido__producto__appkioskopromocionproductos__promocion=promo
        ).distinct().count()
        
        # Contar pedidos con menús promocionados
        pedidos_menus = AppkioskoPedidos.objects.filter(
            valor_descuento__gt=0,
            appkioskodetallepedido__menu__appkioskopromocionmenu__promocion=promo
        ).distinct().count()
        
        total_pedidos = pedidos_productos + pedidos_menus
        
        print(f"  • {promo.nombre}: {productos_count} productos, {menus_count} menús, {total_pedidos} pedidos")
    
    # Productos y Menús
    total_productos = AppkioskoProductos.objects.count()
    total_menus = AppkioskoMenus.objects.count()
    print(f"🍽️  Productos: {total_productos}, Menús: {total_menus}")
    
    # Pedidos
    total_pedidos = AppkioskoPedidos.objects.count()
    pedidos_con_descuento = AppkioskoPedidos.objects.filter(valor_descuento__gt=0).count()
    pedidos_sin_descuento = total_pedidos - pedidos_con_descuento
    
    print(f"🛒 Pedidos totales: {total_pedidos}")
    print(f"  • Con promoción: {pedidos_con_descuento}")
    print(f"  • Sin promoción: {pedidos_sin_descuento}")
    
    # Ingresos
    from django.db.models import Sum
    total_descuentos = AppkioskoPedidos.objects.aggregate(
        total=Sum('valor_descuento')
    )['total'] or Decimal('0.00')
    
    print(f"💰 Total descuentos aplicados: ${total_descuentos}")

def main():
    """Función principal del script"""
    print("SCRIPT DE ESTADÍSTICAS DE PROMOCIONES")
    print("="*42)
    
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python Scripts/promociones_estadisticas.py listar       - Muestra estadísticas actuales")
        print("  python Scripts/promociones_estadisticas.py crear        - Crea datos (sin eliminar)")
        print("  python Scripts/promociones_estadisticas.py limpiar      - Solo elimina datos")
        print("  python Scripts/promociones_estadisticas.py limpiar_crear - Elimina y crea datos nuevos")
        return

    comando = sys.argv[1].lower()

    try:
        with transaction.atomic():
            if comando == 'listar':
                listar_estadisticas()
                
            elif comando == 'crear':
                productos = crear_productos_ejemplo()
                menus = crear_menus_ejemplo()
                promociones = crear_promociones()
                asociar_promociones_productos_y_menus(promociones, productos, menus)
                generar_pedidos_con_promociones(promociones, productos, menus)
                listar_estadisticas()
                print("="*50)
                print("✓ Datos de promociones creados exitosamente!")
                
            elif comando == 'limpiar_crear':
                respuesta = input("¿Estás seguro de que quieres ELIMINAR todos los datos existentes? (sí/no): ")
                if respuesta.lower() in ['sí', 'si', 's', 'yes', 'y']:
                    limpiar_datos_promociones()
                    productos = crear_productos_ejemplo()
                    menus = crear_menus_ejemplo()
                    promociones = crear_promociones()
                    asociar_promociones_productos_y_menus(promociones, productos, menus)
                    generar_pedidos_con_promociones(promociones, productos, menus)
                    listar_estadisticas()
                    print("="*50)
                    print("✓ Datos recreados desde cero exitosamente!")
                else:
                    print("Operación cancelada.")
                    
            elif comando == 'limpiar':
                respuesta = input("¿Estás seguro de que quieres ELIMINAR todos los datos? (sí/no): ")
                if respuesta.lower() in ['sí', 'si', 's', 'yes', 'y']:
                    limpiar_datos_promociones()
                    print("✓ Datos eliminados correctamente.")
                else:
                    print("Operación cancelada.")
                    
            else:
                print(f"Comando '{comando}' no reconocido.")
                print("Comandos disponibles: listar, crear, limpiar_crear, limpiar")

    except Exception as e:
        print(f"✗ Error durante la ejecución: {str(e)}")
        raise

if __name__ == "__main__":
    main()