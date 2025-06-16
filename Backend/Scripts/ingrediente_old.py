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
from comun.models import AppkioskoImagen
from catalogo.models import AppkioskoIngredientes
from django.db import transaction
from django.conf import settings

def limpiar_ingredientes():
    """Elimina todos los ingredientes existentes"""
    ingredientes_count = AppkioskoIngredientes.objects.count()
    if ingredientes_count > 0:
        print(f"Eliminando {ingredientes_count} ingredientes existentes...")
        AppkioskoIngredientes.objects.all().delete()
        print("✓ Ingredientes eliminados correctamente")
    else:
        print("No hay ingredientes existentes para eliminar")

def limpiar_imagenes_ingredientes():
    """Elimina todas las imágenes de ingredientes de la BD"""
    imagenes_count = AppkioskoImagen.objects.filter(categoria_imagen='ingredientes').count()
    if imagenes_count > 0:
        print(f"Eliminando {imagenes_count} imágenes de ingredientes...")
        AppkioskoImagen.objects.filter(categoria_imagen='ingredientes').delete()
        print("✓ Imágenes de ingredientes eliminadas correctamente")
    else:
        print("No hay imágenes de ingredientes para eliminar")

def crear_ingredientes_iniciales():
    """Crea los ingredientes iniciales del sistema - Solo Pizzas y Hamburguesas"""
    ingredientes_a_crear = [
        # Ingredientes para Hamburguesas
        {'nombre': 'Lechuga', 'descripcion': 'Lechuga fresca', 'categoria_producto': 'hamburguesas'},
        {'nombre': 'Tomate', 'descripcion': 'Tomate rojo fresco', 'categoria_producto': 'hamburguesas'},
        {'nombre': 'Cebolla', 'descripcion': 'Cebolla blanca', 'categoria_producto': 'hamburguesas'},
        {'nombre': 'Queso Amarillo', 'descripcion': 'Queso amarillo', 'categoria_producto': 'hamburguesas'},
        {'nombre': 'Pepinillos', 'descripcion': 'Pepinillos en vinagre', 'categoria_producto': 'hamburguesas'},
        {'nombre': 'Bacon', 'descripcion': 'Tocino crujiente', 'categoria_producto': 'hamburguesas'},
        {'nombre': 'Aguacate', 'descripcion': 'Aguacate fresco', 'categoria_producto': 'hamburguesas'},
        {'nombre': 'Champiñones', 'descripcion': 'Champiñones frescos', 'categoria_producto': 'hamburguesas'},
        {'nombre': 'Mayonesa', 'descripcion': 'Mayonesa casera', 'categoria_producto': 'hamburguesas'},
        {'nombre': 'Ketchup', 'descripcion': 'Salsa de tomate', 'categoria_producto': 'hamburguesas'},
        {'nombre': 'Mostaza', 'descripcion': 'Mostaza americana', 'categoria_producto': 'hamburguesas'},
        
        # Ingredientes para Pizzas
        {'nombre': 'Mozzarella', 'descripcion': 'Queso mozzarella', 'categoria_producto': 'pizzas'},
        {'nombre': 'Pepperoni', 'descripcion': 'Pepperoni italiano', 'categoria_producto': 'pizzas'},
        {'nombre': 'Jamón', 'descripcion': 'Jamón cocido', 'categoria_producto': 'pizzas'},
        {'nombre': 'Piña', 'descripcion': 'Piña natural', 'categoria_producto': 'pizzas'},
        {'nombre': 'Pimientos', 'descripcion': 'Pimientos rojos y verdes', 'categoria_producto': 'pizzas'},
        {'nombre': 'Aceitunas', 'descripcion': 'Aceitunas negras', 'categoria_producto': 'pizzas'},
        {'nombre': 'Salami', 'descripcion': 'Salami italiano', 'categoria_producto': 'pizzas'},
        {'nombre': 'Albahaca', 'descripcion': 'Albahaca fresca', 'categoria_producto': 'pizzas'},
        {'nombre': 'Tomate Cherry', 'descripcion': 'Tomate cherry', 'categoria_producto': 'pizzas'},
        {'nombre': 'Queso Parmesano', 'descripcion': 'Queso parmesano rallado', 'categoria_producto': 'pizzas'},
        {'nombre': 'Orégano', 'descripcion': 'Orégano seco', 'categoria_producto': 'pizzas'},
    ]

    print("Creando ingredientes iniciales para PIZZAS y HAMBURGUESAS...")
    ingredientes_creados = []

    for ingrediente_data in ingredientes_a_crear:
        # Verificar si ya existe un ingrediente con ese nombre
        ingrediente_existente = AppkioskoIngredientes.objects.filter(
            nombre=ingrediente_data['nombre']
        ).first()
        
        if ingrediente_existente:
            print(f"⚠ Ingrediente '{ingrediente_data['nombre']}' ya existe (ID: {ingrediente_existente.id})")
        else:
            ingrediente = AppkioskoIngredientes.objects.create(**ingrediente_data)
            ingredientes_creados.append(ingrediente)
            print(f"✓ Creado: {ingrediente.nombre} [{ingrediente.categoria_producto}] (ID: {ingrediente.id})")

    return ingredientes_creados

def migrar_imagenes_ingredientes():
    """Migra las imágenes existentes de ingredientes a la base de datos"""
    print("\n" + "="*50)
    print("MIGRANDO IMÁGENES DE INGREDIENTES")
    print("="*50)
    
    # Ruta de la carpeta de imágenes de ingredientes
    ingredientes_path = os.path.join(settings.MEDIA_ROOT, 'ingredientes')
    
    if not os.path.exists(ingredientes_path):
        print(f"❌ La carpeta {ingredientes_path} no existe")
        return
    
    # Obtener solo ingredientes de pizzas y hamburguesas
    ingredientes = AppkioskoIngredientes.objects.filter(
        categoria_producto__in=['pizzas', 'hamburguesas']
    )
    
    print(f"📁 Buscando imágenes en: {ingredientes_path}")
    print(f"📊 Ingredientes encontrados: {ingredientes.count()} (solo pizzas y hamburguesas)")
    print("─" * 50)
    
    # Mapeo especial para nombres que no coinciden exactamente
    mapeo_nombres = {
        'champiñones': 'champinones',  # Sin ñ
        'pepinillos': 'pepinillo',     # Singular/plural
        'queso amarillo': 'queso',
        'queso parmesano': 'parmesano',
        'tomate cherry': 'tomate_cherry',
        'orégano': 'oregano',
        'jamón': 'jamon',
        'piña': 'pina',
        'aceitunas': 'aceitunas',
        'pimientos': 'pimientos',
        'albahaca': 'albahaca',
        'aguacate': 'aguacate', 
        'ketchup': 'ketchup',
        'mayonesa': 'mayonesa',
        'mostaza': 'mostaza',
        'mozzarella': 'mozzarella',
    }
    
    imagenes_migradas = 0
    
    for ingrediente in ingredientes:
        # Buscar imagen que coincida con el nombre del ingrediente (en minúsculas)
        nombre_ingrediente = ingrediente.nombre.lower()
        
        # Aplicar mapeo especial si existe
        nombre_archivo = mapeo_nombres.get(nombre_ingrediente, nombre_ingrediente)
        
        imagen_encontrada = False
        
        # Posibles extensiones
        extensiones = ['.png', '.jpg', '.jpeg']
        
        for ext in extensiones:
            archivo_imagen = f"{nombre_archivo}{ext}"
            ruta_completa = os.path.join(ingredientes_path, archivo_imagen)
            
            if os.path.exists(ruta_completa):
                # Verificar si ya existe en la BD
                existe_en_bd = AppkioskoImagen.objects.filter(
                    categoria_imagen='ingredientes',
                    entidad_relacionada_id=ingrediente.id
                ).exists()
                
                if not existe_en_bd:
                    # Crear la ruta relativa
                    ruta_relativa = f"/media/ingredientes/{archivo_imagen}"
                    
                    # Crear registro en AppkioskoImagen
                    imagen_obj = AppkioskoImagen.objects.create(
                        ruta=ruta_relativa,
                        categoria_imagen='ingredientes',
                        entidad_relacionada_id=ingrediente.id
                    )
                    
                    print(f"✅ {ingrediente.nombre}: {archivo_imagen} → BD (ID: {imagen_obj.id})")
                    imagenes_migradas += 1
                else:
                    print(f"⚠️  {ingrediente.nombre}: Ya existe en BD")
                
                imagen_encontrada = True
                break
        
        if not imagen_encontrada:
            print(f"❌ {ingrediente.nombre}: No se encontró imagen (buscando: {nombre_archivo}.*)")
    
    print("─" * 50)
    print(f"🎉 Migración completada! {imagenes_migradas} imágenes migradas.")

def listar_ingredientes():
    """Lista todos los ingredientes en la base de datos"""
    print("\n" + "="*50)
    print("INGREDIENTES EN LA BASE DE DATOS:")
    print("="*50)
    
    ingredientes = AppkioskoIngredientes.objects.filter(
        categoria_producto__in=['pizzas', 'hamburguesas']
    ).order_by('categoria_producto', 'nombre')
    
    if not ingredientes:
        print("No hay ingredientes de pizzas o hamburguesas en la base de datos")
        return
        
    for ingrediente in ingredientes:
        # Verificar si tiene imagen
        tiene_imagen = AppkioskoImagen.objects.filter(
            categoria_imagen='ingredientes',
            entidad_relacionada_id=ingrediente.id
        ).exists()
        
        icono_imagen = "🖼️ " if tiene_imagen else "📷"
        categoria = getattr(ingrediente, 'categoria_producto', 'hamburguesas')
        print(f"ID {ingrediente.id}: {icono_imagen} {ingrediente.nombre} [{categoria}] - {ingrediente.descripcion}")

def listar_ingredientes_por_categoria():
    """Lista ingredientes agrupados por categoría (solo pizzas y hamburguesas)"""
    print("\n" + "="*50)
    print("INGREDIENTES POR CATEGORÍA (PIZZAS Y HAMBURGUESAS):")
    print("="*50)
    
    # Solo pizzas y hamburguesas
    categorias = ['hamburguesas', 'pizzas']
    
    # Mapeo de nombres de categorías para mostrar
    nombre_categorias = {
        'hamburguesas': 'HAMBURGUESAS',
        'pizzas': 'PIZZAS'
    }
    
    for categoria in categorias:
        ingredientes = AppkioskoIngredientes.objects.filter(
            categoria_producto=categoria
        ).order_by('nombre')
        
        if ingredientes.exists():
            categoria_nombre = nombre_categorias.get(categoria, categoria.upper())
            print(f"\n🍽️  {categoria_nombre} ({ingredientes.count()} ingredientes):")
            print("─" * 30)
            
            for ingrediente in ingredientes:
                # Verificar si tiene imagen
                tiene_imagen = AppkioskoImagen.objects.filter(
                    categoria_imagen='ingredientes',
                    entidad_relacionada_id=ingrediente.id
                ).exists()
                
                icono_imagen = "🖼️ " if tiene_imagen else "📷"
                print(f"  {icono_imagen} {ingrediente.nombre} - {ingrediente.descripcion}")
        else:
            categoria_nombre = nombre_categorias.get(categoria, categoria.upper())
            print(f"\n🍽️  {categoria_nombre}: Sin ingredientes")

def listar_imagenes_ingredientes():
    """Lista todas las imágenes de ingredientes en la BD"""
    print("\n" + "="*50)
    print("IMÁGENES DE INGREDIENTES EN LA BD:")
    print("="*50)
    
    imagenes = AppkioskoImagen.objects.filter(categoria_imagen='ingredientes').order_by('entidad_relacionada_id')
    
    if not imagenes:
        print("No hay imágenes de ingredientes en la base de datos")
        return
    
    for imagen in imagenes:
        try:
            ingrediente = AppkioskoIngredientes.objects.get(id=imagen.entidad_relacionada_id)
            categoria = getattr(ingrediente, 'categoria_producto', 'hamburguesas')
            
            # Solo mostrar pizzas y hamburguesas
            if categoria in ['pizzas', 'hamburguesas']:
                print(f"ID {imagen.id}: {ingrediente.nombre} [{categoria}] → {imagen.ruta}")
        except AppkioskoIngredientes.DoesNotExist:
            print(f"ID {imagen.id}: ⚠️  Ingrediente no encontrado (ID: {imagen.entidad_relacionada_id}) → {imagen.ruta}")

def eliminar_ingrediente_por_nombre(nombre_ingrediente):
    """Elimina un ingrediente específico por su nombre (solo pizzas y hamburguesas)"""
    try:
        ingrediente = AppkioskoIngredientes.objects.get(
            nombre__iexact=nombre_ingrediente,
            categoria_producto__in=['pizzas', 'hamburguesas']
        )
        
        # Eliminar también su imagen asociada
        imagenes_eliminadas = AppkioskoImagen.objects.filter(
            categoria_imagen='ingredientes',
            entidad_relacionada_id=ingrediente.id
        ).delete()
        
        print(f"✓ Eliminando ingrediente: {ingrediente.nombre} [{ingrediente.categoria_producto}] (ID: {ingrediente.id})")
        if imagenes_eliminadas[0] > 0:
            print(f"✓ También se eliminó su imagen asociada")
        
        ingrediente.delete()
        print(f"✅ Ingrediente '{nombre_ingrediente}' eliminado correctamente")
        
    except AppkioskoIngredientes.DoesNotExist:
        print(f"❌ No se encontró el ingrediente '{nombre_ingrediente}' en pizzas o hamburguesas")
        print("Ingredientes disponibles:")
        ingredientes = AppkioskoIngredientes.objects.filter(
            categoria_producto__in=['pizzas', 'hamburguesas']
        ).order_by('nombre')
        for ing in ingredientes:
            print(f"  - {ing.nombre} [{ing.categoria_producto}]")

def main():
    """Función principal del script"""
    print("SCRIPT DE GESTIÓN DE INGREDIENTES - PIZZAS Y HAMBURGUESAS")
    print("="*55)
    
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python Scripts/ingredientes.py listar               - Lista ingredientes existentes")
        print("  python Scripts/ingredientes.py listar_categorias    - Lista ingredientes por categoría")
        print("  python Scripts/ingredientes.py crear                - Crea ingredientes (sin eliminar existentes)")
        print("  python Scripts/ingredientes.py limpiar_crear        - Elimina todo y crea ingredientes nuevos")
        print("  python Scripts/ingredientes.py limpiar              - Solo elimina ingredientes existentes")
        print("  python Scripts/ingredientes.py eliminar <nombre>    - Elimina un ingrediente específico")
        print("  python Scripts/ingredientes.py migrar_imagenes      - Migra imágenes existentes a la BD")
        print("  python Scripts/ingredientes.py listar_imagenes      - Lista imágenes de ingredientes en BD")
        print("  python Scripts/ingredientes.py limpiar_imagenes     - Elimina imágenes de ingredientes de BD")
        print("\n🍕🍔 NOTA: Este script solo gestiona ingredientes de PIZZAS y HAMBURGUESAS")
        return

    comando = sys.argv[1].lower()

    try:
        with transaction.atomic():
            if comando == 'listar':
                listar_ingredientes()
                
            elif comando == 'listar_categorias':
                listar_ingredientes_por_categoria()
                
            elif comando == 'crear':
                ingredientes_creados = crear_ingredientes_iniciales()
                listar_ingredientes_por_categoria()
                print("="*50)
                print(f"✓ Proceso completado. {len(ingredientes_creados)} nuevos ingredientes creados.")
                
            elif comando == 'limpiar_crear':
                respuesta = input("¿Estás seguro de que quieres ELIMINAR todos los ingredientes existentes? (sí/no): ")
                if respuesta.lower() in ['sí', 'si', 's', 'yes', 'y']:
                    limpiar_ingredientes()
                    ingredientes_creados = crear_ingredientes_iniciales()
                    listar_ingredientes_por_categoria()
                    print("="*50)
                    print(f"✓ Proceso completado. {len(ingredientes_creados)} ingredientes creados desde cero.")
                else:
                    print("Operación cancelada.")
                    
            elif comando == 'limpiar':
                respuesta = input("¿Estás seguro de que quieres ELIMINAR todos los ingredientes existentes? (sí/no): ")
                if respuesta.lower() in ['sí', 'si', 's', 'yes', 'y']:
                    limpiar_ingredientes()
                    print("✓ Ingredientes eliminados correctamente.")
                else:
                    print("Operación cancelada.")
                    
            elif comando == 'eliminar':
                if len(sys.argv) < 3:
                    print("❌ Debes especificar el nombre del ingrediente a eliminar")
                    print("Ejemplo: python Scripts/ingredientes.py eliminar 'Tomate Cherry'")
                    print("\nPara ver ingredientes disponibles:")
                    print("python Scripts/ingredientes.py listar")
                else:
                    nombre_ingrediente = ' '.join(sys.argv[2:])
                    eliminar_ingrediente_por_nombre(nombre_ingrediente)
                    
            elif comando == 'migrar_imagenes':
                migrar_imagenes_ingredientes()
                
            elif comando == 'listar_imagenes':
                listar_imagenes_ingredientes()
                
            elif comando == 'limpiar_imagenes':
                respuesta = input("¿Estás seguro de que quieres ELIMINAR todas las imágenes de ingredientes de la BD? (sí/no): ")
                if respuesta.lower() in ['sí', 'si', 's', 'yes', 'y']:
                    limpiar_imagenes_ingredientes()
                    print("✓ Imágenes de ingredientes eliminadas correctamente.")
                else:
                    print("Operación cancelada.")
                    
            else:
                print(f"Comando '{comando}' no reconocido.")
                print("Comandos disponibles: listar, listar_categorias, crear, limpiar_crear, limpiar, eliminar, migrar_imagenes, listar_imagenes, limpiar_imagenes")

    except Exception as e:
        print(f"✗ Error durante la ejecución: {str(e)}")
        raise

if __name__ == "__main__":
    main()