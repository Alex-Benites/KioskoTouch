import os
import sys
import django

# Configurar Django para que el script pueda usar los modelos
# Añadir el directorio padre (Backend) al path de Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Configurar Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'KioskoTouch.settings')
django.setup()

from catalogo.models import AppkioskoTamanos
from django.db import IntegrityError, transaction

def crear_tamanos():
    """Crea los tamaños predefinidos en la tabla AppkioskoTamanos"""
    print("Iniciando creación de tamaños...")
    
    # Lista de tamaños a crear
    tamanos = [
        {'nombre': 'Pequeño', 'codigo': 'P', 'orden': 1},
        {'nombre': 'Mediano', 'codigo': 'M', 'orden': 2},
        {'nombre': 'Grande', 'codigo': 'G', 'orden': 3}
    ]
    
    # Contador de tamaños creados
    contador = 0
    
    for tamano in tamanos:
        try:
            # Intentar buscar primero para no duplicar
            existente = AppkioskoTamanos.objects.filter(codigo=tamano['codigo']).first()
            
            if existente:
                print(f"Ya existe el tamaño {tamano['nombre']} (código: {tamano['codigo']})")
            else:
                nuevo_tamano = AppkioskoTamanos.objects.create(**tamano)
                print(f"✅ Creado tamaño: {nuevo_tamano.nombre} (ID: {nuevo_tamano.id})")
                contador += 1
        
        except IntegrityError:
            print(f"⚠️ Error al crear tamaño {tamano['nombre']}: ya existe")
        except Exception as e:
            print(f"❌ Error al crear tamaño {tamano['nombre']}: {str(e)}")
    
    print(f"\n✅ Proceso completado. Se crearon {contador} tamaños.")

def listar_tamanos():
    """Lista todos los tamaños en la base de datos"""
    print("\n" + "="*50)
    print("TAMAÑOS EN LA BASE DE DATOS:")
    print("="*50)
    
    tamanos = AppkioskoTamanos.objects.all().order_by('orden')
    
    if not tamanos:
        print("No hay tamaños en la base de datos")
        return
        
    for tamano in tamanos:
        estado = "ACTIVO" if tamano.activo else "INACTIVO"
        print(f"ID {tamano.id}: {tamano.nombre} (Código: {tamano.codigo}, Orden: {tamano.orden}) [{estado}]")

def main():
    """Función principal del script"""
    print("SCRIPT DE GESTIÓN DE TAMAÑOS")
    print("="*40)
    
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python Scripts/tamanios.py listar  - Lista tamaños existentes")
        print("  python Scripts/tamanios.py crear   - Crea tamaños predefinidos")
        return

    comando = sys.argv[1].lower()

    try:
        with transaction.atomic():
            if comando == 'listar':
                listar_tamanos()
                
            elif comando == 'crear':
                crear_tamanos()
                listar_tamanos()
                
            else:
                print(f"Comando '{comando}' no reconocido.")
                print("Comandos disponibles: listar, crear")

    except Exception as e:
        print(f"✗ Error durante la ejecución: {str(e)}")
        raise

if __name__ == "__main__":
    main()