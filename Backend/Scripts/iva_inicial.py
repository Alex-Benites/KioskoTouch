import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'KioskoTouch.settings')
django.setup()

from comun.models import AppkioskoIva
from django.db import transaction

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

if __name__ == "__main__":
    main()