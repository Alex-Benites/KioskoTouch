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
from catalogo.models import AppkioskoCategorias
from django.db import transaction

def limpiar_categorias():
    """Elimina todas las categorías existentes"""
    categorias_count = AppkioskoCategorias.objects.count()
    if categorias_count > 0:
        print(f"Eliminando {categorias_count} categorías existentes...")
        AppkioskoCategorias.objects.all().delete()
        print("✓ Categorías eliminadas correctamente")
    else:
        print("No hay categorías existentes para eliminar")

def crear_categorias_iniciales():
    """Crea las categorías iniciales del sistema"""
    categorias_a_crear = [
        {'nombre': 'Hamburguesa'},
        {'nombre': 'Bebidas'},
        {'nombre': 'Extras'},
        {'nombre': 'Postres'},
        {'nombre': 'Pollo'},
        {'nombre': 'Ensaladas'},
        {'nombre': 'Pizza'},
        {'nombre': 'Infantil'},
    ]

    print("Creando categorías iniciales...")
    categorias_creadas = []

    for categoria_data in categorias_a_crear:
        # Verificar si ya existe una categoría con ese nombre
        categoria_existente = AppkioskoCategorias.objects.filter(
            nombre=categoria_data['nombre']
        ).first()
        
        if categoria_existente:
            print(f"⚠ Categoría '{categoria_data['nombre']}' ya existe (ID: {categoria_existente.id})")
        else:
            categoria = AppkioskoCategorias.objects.create(**categoria_data)
            categorias_creadas.append(categoria)
            print(f"✓ Creada: {categoria.nombre} (ID: {categoria.id})")

    return categorias_creadas

def listar_categorias():
    """Lista todas las categorías en la base de datos"""
    print("\n" + "="*50)
    print("CATEGORÍAS EN LA BASE DE DATOS:")
    print("="*50)
    
    categorias = AppkioskoCategorias.objects.all().order_by('id')
    
    if not categorias:
        print("No hay categorías en la base de datos")
        return
        
    for categoria in categorias:
        print(f"ID {categoria.id}: {categoria.nombre}")

def main():
    """Función principal del script"""
    print("SCRIPT DE GESTIÓN DE CATEGORÍAS")
    print("="*42)
    
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python Scripts/categorias.py listar          - Lista categorías existentes")
        print("  python Scripts/categorias.py crear           - Crea categorías (sin eliminar existentes)")
        print("  python Scripts/categorias.py limpiar_crear   - Elimina todo y crea categorías nuevas")
        print("  python Scripts/categorias.py limpiar         - Solo elimina categorías existentes")
        return

    comando = sys.argv[1].lower()

    try:
        with transaction.atomic():
            if comando == 'listar':
                listar_categorias()
                
            elif comando == 'crear':
                categorias_creadas = crear_categorias_iniciales()
                listar_categorias()
                print("="*50)
                print(f"✓ Proceso completado. {len(categorias_creadas)} nuevas categorías creadas.")
                
            elif comando == 'limpiar_crear':
                # Confirmar acción destructiva
                respuesta = input("¿Estás seguro de que quieres ELIMINAR todas las categorías existentes? (sí/no): ")
                if respuesta.lower() in ['sí', 'si', 's', 'yes', 'y']:
                    limpiar_categorias()
                    categorias_creadas = crear_categorias_iniciales()
                    listar_categorias()
                    print("="*50)
                    print(f"✓ Proceso completado. {len(categorias_creadas)} categorías creadas desde cero.")
                else:
                    print("Operación cancelada.")
                    
            elif comando == 'limpiar':
                respuesta = input("¿Estás seguro de que quieres ELIMINAR todas las categorías existentes? (sí/no): ")
                if respuesta.lower() in ['sí', 'si', 's', 'yes', 'y']:
                    limpiar_categorias()
                    print("✓ Categorías eliminadas correctamente.")
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