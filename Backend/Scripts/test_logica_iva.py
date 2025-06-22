import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'KioskoTouch.settings')
django.setup()

from comun.models import AppkioskoIva

def test_logica_inteligente():
    """Probar la nueva lógica de IVA inteligente"""
    print("🧪 PROBANDO LÓGICA INTELIGENTE DE IVA")
    print("=" * 50)

    # Limpiar datos
    AppkioskoIva.objects.all().delete()
    print("🗑️ Base de datos limpiada")

    # Escenario 1: Crear IVA 15%
    print("\n📝 ESCENARIO 1: Crear IVA 15%")
    iva1, creado1 = AppkioskoIva.activar_o_crear_iva(15.00)
    print(f"Resultado: {iva1} - Creado: {creado1}")

    # Escenario 2: Crear IVA 12%
    print("\n📝 ESCENARIO 2: Crear IVA 12%")
    iva2, creado2 = AppkioskoIva.activar_o_crear_iva(12.00)
    print(f"Resultado: {iva2} - Creado: {creado2}")

    # Escenario 3: Volver a IVA 15% (debería reutilizar)
    print("\n📝 ESCENARIO 3: Volver a IVA 15% (reutilizar)")
    iva3, creado3 = AppkioskoIva.activar_o_crear_iva(15.00)
    print(f"Resultado: {iva3} - Creado: {creado3}")
    print(f"¿Es el mismo ID que el primer 15%? {iva1.id == iva3.id}")

    # Escenario 4: Crear IVA 18% (nuevo)
    print("\n📝 ESCENARIO 4: Crear IVA 18% (nuevo)")
    iva4, creado4 = AppkioskoIva.activar_o_crear_iva(18.00)
    print(f"Resultado: {iva4} - Creado: {creado4}")

    # Escenario 5: Volver a IVA 12% (debería reutilizar)
    print("\n📝 ESCENARIO 5: Volver a IVA 12% (reutilizar)")
    iva5, creado5 = AppkioskoIva.activar_o_crear_iva(12.00)
    print(f"Resultado: {iva5} - Creado: {creado5}")
    print(f"¿Es el mismo ID que el primer 12%? {iva2.id == iva5.id}")

    # Estado final
    print(f"\n📊 RESUMEN FINAL:")
    print(f"Total de registros en BD: {AppkioskoIva.objects.count()}")
    print(f"Registros activos: {AppkioskoIva.objects.filter(activo=True).count()}")

    print(f"\n📋 TODOS LOS IVAs EN BD:")
    for iva in AppkioskoIva.objects.all().order_by('id'):
        estado = "🟢 ACTIVO" if iva.activo else "🔴 INACTIVO"
        print(f"   ID {iva.id}: {iva.porcentaje_iva}% - {estado}")

    # Verificar IVA actual
    iva_actual = AppkioskoIva.get_porcentaje_actual()
    print(f"\n🎯 IVA ACTUAL DEL SISTEMA: {iva_actual}%")

if __name__ == "__main__":
    test_logica_inteligente()