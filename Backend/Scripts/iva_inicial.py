import os
import sys
import django
import requests

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'KioskoTouch.settings')
django.setup()

from comun.models import AppkioskoIva

def crear_iva_inicial():
    """Crea el IVA inicial del sistema (15%)"""
    try:
        with transaction.atomic():
            # Verificar si ya existe un IVA
            if AppkioskoIva.objects.exists():
                print("⚠️ Ya existen configuraciones de IVA")
                return

            # ✅ CORREGIDO: Crear IVA inicial del 15%
            iva_inicial = AppkioskoIva.objects.create(
                porcentaje_iva=15.00,
                activo=True,
                observaciones="IVA inicial del sistema - 15%"
            )

            print(f"✅ IVA inicial creado: {iva_inicial}")

    except Exception as e:
        print(f"❌ Error creando IVA inicial: {e}")

def listar_ivas():
    """Lista todas las configuraciones de IVA"""
    ivas = AppkioskoIva.objects.all().order_by('-fecha_vigencia')

    print(f"\n📊 CONFIGURACIONES DE IVA ({ivas.count()}):")
    print("=" * 60)

    for iva in ivas:
        estado = "🟢 ACTIVO" if iva.activo else "🔴 INACTIVO"
        print(f"ID: {iva.id} | {iva.porcentaje_iva}% | {estado}")
        print(f"   Vigencia: {iva.fecha_vigencia.strftime('%Y-%m-%d %H:%M')}")
        if iva.observaciones:
            print(f"   Nota: {iva.observaciones}")
        print("-" * 40)

def probar_iva_directo():
    """Probar creación directa en Django"""
    print("🧪 PRUEBA 1: Creación directa en Django")

    # Limpiar datos anteriores
    AppkioskoIva.objects.all().delete()

    # Crear IVA del 15%
    iva1 = AppkioskoIva.objects.create(
        porcentaje_iva=15.00,
        activo=True
    )
    print(f"✅ IVA creado: {iva1}")

    # Crear IVA del 12% (debería desactivar el anterior)
    iva2 = AppkioskoIva.objects.create(
        porcentaje_iva=12.00,
        activo=True
    )
    print(f"✅ IVA creado: {iva2}")

    # Verificar que solo uno está activo
    ivas_activos = AppkioskoIva.objects.filter(activo=True)
    print(f"📊 IVAs activos: {ivas_activos.count()}")

    for iva in AppkioskoIva.objects.all():
        estado = "🟢 ACTIVO" if iva.activo else "🔴 INACTIVO"
        print(f"   • {iva.porcentaje_iva}% - {estado}")

    # Obtener IVA actual
    iva_actual = AppkioskoIva.get_porcentaje_actual()
    print(f"🎯 IVA actual del sistema: {iva_actual}%")

def probar_api():
    """Probar la API REST"""
    print("\n🧪 PRUEBA 2: API REST")

    base_url = "http://localhost:8000/api/comun"

    # Obtener IVA actual
    try:
        response = requests.get(f"{base_url}/iva/actual/")
        print(f"GET /iva/actual/ - Status: {response.status_code}")
        print(f"Respuesta: {response.json()}")
    except Exception as e:
        print(f"❌ Error en GET: {e}")

    # Crear nuevo IVA
    try:
        data = {"porcentaje_iva": 18.00}
        response = requests.post(f"{base_url}/iva/crear/", json=data)
        print(f"POST /iva/crear/ - Status: {response.status_code}")
        print(f"Respuesta: {response.json()}")
    except Exception as e:
        print(f"❌ Error en POST: {e}")

def main():
    print("🏗️ GESTIÓN DE IVA - KioskoTouch")
    print("=" * 40)

    # Crear IVA inicial
    crear_iva_inicial()

    # Listar IVAs
    listar_ivas()

    # Mostrar IVA actual
    iva_actual = AppkioskoIva.get_iva_actual()
    if iva_actual:
        print(f"\n🎯 IVA ACTUAL: {iva_actual.porcentaje_iva}%")
    else:
        print(f"\n⚠️ No hay IVA activo configurado")

    # Probar creación directa y API
    probar_iva_directo()
    probar_api()

if __name__ == "__main__":
    main()