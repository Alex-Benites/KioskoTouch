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
from comun.models import AppkioskoImagen
from django.conf import settings


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
        {'nombre': 'Pizzas'},
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

def migrar_imagenes_categorias():
    """Migra las imágenes existentes de categorías a la base de datos"""
    print("\n" + "="*50)
    print("MIGRANDO IMÁGENES DE CATEGORÍAS")
    print("="*50)
    
    # Mapeo especial para nombres que no coinciden exactamente
    mapeo_nombres = {
        'pizza': 'pizzas',
    }
    
    # Ruta de la carpeta de imágenes de categorías
    categorias_path = os.path.join(settings.MEDIA_ROOT, 'categorias')
    
    if not os.path.exists(categorias_path):
        print(f"❌ La carpeta {categorias_path} no existe")
        return
    
    # Obtener todas las categorías
    categorias = AppkioskoCategorias.objects.all()
    
    print(f"📁 Buscando imágenes en: {categorias_path}")
    print(f"📊 Categorías encontradas: {categorias.count()}")
    print("─" * 50)
    
    imagenes_migradas = 0
    
    for categoria in categorias:
        # Buscar imagen que coincida con el nombre de la categoría (en minúsculas)
        nombre_categoria = categoria.nombre.lower()
        
        # Aplicar mapeo especial si existe
        nombre_archivo = mapeo_nombres.get(nombre_categoria, nombre_categoria)
        
        imagen_encontrada = False
        
        # Posibles extensiones
        extensiones = ['.png', '.jpg', '.jpeg']
        
        for ext in extensiones:
            archivo_imagen = f"{nombre_archivo}{ext}"
            ruta_completa = os.path.join(categorias_path, archivo_imagen)
            
            if os.path.exists(ruta_completa):
                # Verificar si ya existe en la BD
                existe_en_bd = AppkioskoImagen.objects.filter(
                    categoria_imagen='categorias',
                    entidad_relacionada_id=categoria.id
                ).exists()
                
                if not existe_en_bd:
                    # Crear la ruta relativa (como quieres: /media/categorias/pizzas.png)
                    ruta_relativa = f"/media/categorias/{archivo_imagen}"
                    
                    # Crear registro en AppkioskoImagen
                    imagen_obj = AppkioskoImagen.objects.create(
                        ruta=ruta_relativa,
                        categoria_imagen='categorias',
                        entidad_relacionada_id=categoria.id
                    )
                    
                    print(f"✅ {categoria.nombre}: {archivo_imagen} → BD (ID: {imagen_obj.id})")
                    imagenes_migradas += 1
                else:
                    print(f"⚠️  {categoria.nombre}: Ya existe en BD")
                
                imagen_encontrada = True
                break
        
        if not imagen_encontrada:
            print(f"❌ {categoria.nombre}: No se encontró imagen (buscando: {nombre_archivo}.*)")
    
    print("─" * 50)
    print(f"🎉 Migración completada! {imagenes_migradas} imágenes migradas.")

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
        # Verificar si tiene imagen
        tiene_imagen = AppkioskoImagen.objects.filter(
            categoria_imagen='categorias',
            entidad_relacionada_id=categoria.id
        ).exists()
        
        icono_imagen = "🖼️ " if tiene_imagen else "📷"
        print(f"ID {categoria.id}: {icono_imagen} {categoria.nombre}")

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
        print("  python Scripts/categorias.py migrar_imagenes - Migra imágenes existentes a la BD")
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
                    
            elif comando == 'migrar_imagenes':
                migrar_imagenes_categorias()
                
            else:
                print(f"Comando '{comando}' no reconocido.")
                print("Comandos disponibles: listar, crear, limpiar_crear, limpiar, migrar_imagenes")

    except Exception as e:
        print(f"✗ Error durante la ejecución: {str(e)}")
        raise

if __name__ == "__main__":
    main()