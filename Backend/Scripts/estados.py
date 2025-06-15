import os
import sys
import django

# Configurar Django para que el script pueda usar los modelos
# Añadir el directorio padre (Backend) al path de Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configurar Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'KioskoTouch.settings')
django.setup()

# Ahora podemos importar los modelos
from comun.models import AppkioskoEstados
from django.db import transaction

def limpiar_estados():
    """Elimina todos los estados existentes"""
    estados_count = AppkioskoEstados.objects.count()
    if estados_count > 0:
        print(f"Eliminando {estados_count} estados existentes...")
        AppkioskoEstados.objects.all().delete()
        print("✓ Estados eliminados correctamente")
    else:
        print("No hay estados existentes para eliminar")

def crear_estados_iniciales():
    """Crea los estados iniciales del sistema"""
    estados_a_crear = [
        {
            'nombre': 'Activado',
            'is_active': True,
            'is_eliminated': False,
            'is_inactive': False,
        },
        {
            'nombre': 'Desactivado',
            'is_active': False,  
            'is_eliminated': False,
            'is_inactive': True,  
        },
    ]

    print("Creando estados iniciales...")
    estados_creados = []

    for estado_data in estados_a_crear:
        # Verificar si ya existe un estado con ese nombre
        estado_existente = AppkioskoEstados.objects.filter(
            nombre=estado_data['nombre']
        ).first()
        
        if estado_existente:
            print(f"⚠ Estado '{estado_data['nombre']}' ya existe (ID: {estado_existente.id})")
        else:
            estado = AppkioskoEstados.objects.create(**estado_data)
            estados_creados.append(estado)
            print(f"✓ Creado: {estado.nombre} (ID: {estado.id})")

    return estados_creados

def listar_estados():
    """Lista todos los estados en la base de datos"""
    print("\n" + "="*50)
    print("ESTADOS EN LA BASE DE DATOS:")
    print("="*50)
    
    estados = AppkioskoEstados.objects.all().order_by('id')
    
    if not estados:
        print("No hay estados en la base de datos")
        return
        
    for estado in estados:
        flags = []
        if estado.is_active:
            flags.append("ACTIVO")
        if estado.is_inactive:
            flags.append("INACTIVO")
        if estado.is_eliminated:
            flags.append("ELIMINADO")
        
        flags_str = f" [{', '.join(flags)}]" if flags else " [Sin flags especiales]"
        print(f"ID {estado.id}: {estado.nombre}{flags_str}")

def main():
    """Función principal del script"""
    print("SCRIPT DE GESTIÓN DE ESTADOS")
    print("="*40)
    
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python Scripts/estados.py listar          - Lista estados existentes")
        print("  python Scripts/estados.py crear           - Crea estados (sin eliminar existentes)")
        print("  python Scripts/estados.py limpiar_crear   - Elimina todo y crea estados nuevos")
        print("  python Scripts/estados.py limpiar         - Solo elimina estados existentes")
        return

    comando = sys.argv[1].lower()

    try:
        with transaction.atomic():
            if comando == 'listar':
                listar_estados()
                
            elif comando == 'crear':
                estados_creados = crear_estados_iniciales()
                listar_estados()
                print("="*50)
                print(f"✓ Proceso completado. {len(estados_creados)} nuevos estados creados.")
                
            elif comando == 'limpiar_crear':
                # Confirmar acción destructiva
                respuesta = input("¿Estás seguro de que quieres ELIMINAR todos los estados existentes? (sí/no): ")
                if respuesta.lower() in ['sí', 'si', 's', 'yes', 'y']:
                    limpiar_estados()
                    estados_creados = crear_estados_iniciales()
                    listar_estados()
                    print("="*50)
                    print(f"✓ Proceso completado. {len(estados_creados)} estados creados desde cero.")
                else:
                    print("Operación cancelada.")
                    
            elif comando == 'limpiar':
                respuesta = input("¿Estás seguro de que quieres ELIMINAR todos los estados existentes? (sí/no): ")
                if respuesta.lower() in ['sí', 'si', 's', 'yes', 'y']:
                    limpiar_estados()
                    print("✓ Estados eliminados correctamente.")
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