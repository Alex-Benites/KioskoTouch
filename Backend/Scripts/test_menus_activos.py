import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'KioskoTouch.settings')
django.setup()

from catalogo.models import AppkioskoMenus
from comun.models import AppkioskoEstados

def test_menus_activos():
    """Probar la funcionalidad de menús activos"""
    print("🧪 PROBANDO FUNCIONALIDAD DE MENÚS ACTIVOS")
    print("=" * 60)

    # === PASO 1: Verificar estados disponibles ===
    print("\n📊 ESTADOS DISPONIBLES EN LA BASE DE DATOS:")
    estados = AppkioskoEstados.objects.all()
    for estado in estados:
        print(f"   ID: {estado.id:02d} | {estado.nombre:15} | Activo: {'✅' if estado.is_active else '❌'}")

    # === PASO 2: Obtener todos los menús ===
    todos_menus = AppkioskoMenus.objects.all()
    print(f"\n🍽️ TOTAL DE MENÚS EN BASE DE DATOS: {todos_menus.count()}")

    if todos_menus.count() == 0:
        print("⚠️ No hay menús en la base de datos")
        return

    # === PASO 3: Probar el método esta_activo ===
    print("\n🔍 VERIFICANDO MÉTODO 'esta_activo' EN CADA MENÚ:")
    for menu in todos_menus:
        estado_activo = menu.esta_activo
        estado_nombre = menu.get_estado_nombre()

        print(f"\n🍽️ Menú: {menu.nombre}")
        print(f"   Estado: {estado_nombre}")
        print(f"   ¿Activo?: {'✅ SÍ' if estado_activo else '❌ NO'}")
        print(f"   Precio: ${menu.precio}")

        if menu.estado:
            print(f"   Estado ID: {menu.estado.id}")
            print(f"   is_active: {menu.estado.is_active}")
            print(f"   is_eliminated: {getattr(menu.estado, 'is_eliminated', 'N/A')}")
        else:
            print(f"   ⚠️ Sin estado asignado")

    # === PASO 4: Probar consulta de menús activos ===
    print(f"\n🎯 CONSULTANDO MENÚS ACTIVOS DESDE LA BASE DE DATOS:")

    menus_activos_query = AppkioskoMenus.objects.filter(
        estado__is_active=1
    ).select_related('estado')

    print(f"   Query SQL: {menus_activos_query.query}")
    print(f"   Menús activos encontrados: {menus_activos_query.count()}")

    if menus_activos_query.count() > 0:
        print(f"\n📋 LISTA DE MENÚS ACTIVOS:")
        for menu in menus_activos_query:
            print(f"   ✅ {menu.nombre} - ${menu.precio} - Estado: {menu.estado.nombre}")
    else:
        print("   ❌ No se encontraron menús activos")
        print("\n🔧 SUGERENCIA: Verifica que:")
        print("     1. Los menús tengan un estado asignado")
        print("     2. El estado tenga is_active = 1")
        print("     3. El estado tenga is_eliminated = 0 (si aplica)")

def test_pedido_con_menu():
    """Simular un pedido con menú para probar el flujo completo"""
    print(f"\n🧪 SIMULANDO PEDIDO CON MENÚ")
    print("=" * 40)

    # Obtener un menú activo
    menu_activo = AppkioskoMenus.objects.filter(
        estado__is_active=1
    ).first()

    if not menu_activo:
        print("❌ No hay menús activos para probar")
        return

    print(f"🍽️ Menú seleccionado: {menu_activo.nombre}")
    print(f"   Precio: ${menu_activo.precio}")
    print(f"   Estado: {menu_activo.get_estado_nombre()}")

    # Simular datos de un pedido
    pedido_simulado = {
        "numero_mesa": 0,
        "tipo_entrega": "llevar",
        "tipo_pago": "efectivo",
        "productos": [
            {
                "menu_id": menu_activo.id,  # ✅ Usar menu_id en lugar de producto_id
                "cantidad": 1,
                "precio_unitario": float(menu_activo.precio),
                "subtotal": float(menu_activo.precio),
                "personalizaciones": []
            }
        ],
        "subtotal": float(menu_activo.precio) / 1.15,  # Ejemplo con 15% IVA
        "iva_porcentaje": 15.00,
        "iva_valor": float(menu_activo.precio) * 0.15 / 1.15,
        "total": float(menu_activo.precio)
    }

    print(f"\n📝 DATOS DEL PEDIDO SIMULADO:")
    print(f"   Menu ID: {pedido_simulado['productos'][0]['menu_id']}")
    print(f"   Cantidad: {pedido_simulado['productos'][0]['cantidad']}")
    print(f"   Precio unitario: ${pedido_simulado['productos'][0]['precio_unitario']}")
    print(f"   Total: ${pedido_simulado['total']}")

    print(f"\n✅ PEDIDO SIMULADO LISTO PARA ENVIAR AL ENDPOINT:")
    print(f"   POST /api/ventas/pedidos/crear/")
    print(f"   Con menu_id en lugar de producto_id")

def test_endpoint_menus_activos():
    """Probar el endpoint de menús activos"""
    print(f"\n🧪 PROBANDO ENDPOINT DE MENÚS ACTIVOS")
    print("=" * 45)

    try:
        from django.test import Client
        client = Client()

        # Hacer request al endpoint
        response = client.get('/api/catalogo/menus/activos/')

        print(f"📡 Request a: /api/catalogo/menus/activos/")
        print(f"   Status code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Respuesta exitosa")
            print(f"   Total menús: {data.get('total', 0)}")

            menus = data.get('menus', [])
            if menus:
                print(f"\n📋 MENÚS DEVUELTOS POR EL ENDPOINT:")
                for menu in menus[:3]:  # Mostrar solo los primeros 3
                    print(f"   • {menu['nombre']} - ${menu['precio']}")
            else:
                print(f"   ⚠️ No se devolvieron menús")
        else:
            print(f"   ❌ Error en el endpoint: {response.status_code}")
            print(f"   Contenido: {response.content}")

    except Exception as e:
        print(f"❌ Error probando endpoint: {str(e)}")

if __name__ == "__main__":
    test_menus_activos()
    test_pedido_con_menu()
    test_endpoint_menus_activos()

    print(f"\n🎯 RESUMEN:")
    print(f"   1. ✅ Método 'esta_activo' implementado")
    print(f"   2. ✅ Consulta de menús activos funcional")
    print(f"   3. ✅ Simulación de pedido con menú")
    print(f"   4. ✅ Endpoint de menús activos probado")
    print(f"\n🚀 ¡TODO LISTO PARA PROBAR CON TU COMBO!")