import os
import sys
import django

# Configurar Django para que el script pueda usar los modelos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'KioskoTouch.settings')
django.setup()

from comun.models import AppkioskoImagen
from catalogo.models import AppkioskoIngredientes
from django.db import transaction
from django.conf import settings
from decimal import Decimal

def limpiar_ingredientes_completo():
    """Elimina todos los ingredientes e imágenes existentes"""
    imagenes_count = AppkioskoImagen.objects.filter(categoria_imagen='ingredientes').count()
    if imagenes_count > 0:
        print(f"Eliminando {imagenes_count} imágenes de ingredientes...")
        AppkioskoImagen.objects.filter(categoria_imagen='ingredientes').delete()
        print("✓ Imágenes de ingredientes eliminadas")
    
    ingredientes_count = AppkioskoIngredientes.objects.count()
    if ingredientes_count > 0:
        print(f"Eliminando {ingredientes_count} ingredientes existentes...")
        AppkioskoIngredientes.objects.all().delete()
        print("✓ Ingredientes eliminados")

def verificar_imagen_existe(nombre_archivo):
    """Verifica si la imagen existe en el sistema de archivos"""
    ingredientes_path = os.path.join(settings.MEDIA_ROOT, 'ingredientes')
    ruta_completa = os.path.join(ingredientes_path, f"{nombre_archivo}.png")
    return os.path.exists(ruta_completa)

def crear_ingredientes_por_categoria():
    """Crea ingredientes separados para cada categoría con nombres simples y precios ecuatorianos"""
    print("\n" + "="*70)
    print("CREANDO INGREDIENTES POR CATEGORÍA (NOMBRES SIMPLES + PRECIOS ECUADOR)")
    print("="*70)
    
    # 🍽️ Ingredientes base con nombres simples y precios en USD (Ecuador)
    ingredientes_base = {
        # Proteínas
        'carne': {
            'nombre_base': 'Carne',
            'descripcion': 'Carne de res premium',
            'precio_adicional': Decimal('1.50'),  # $1.50 carne extra
            'categorias': ['hamburguesas']
        },
        'tocino': {
            'nombre_base': 'Tocino',
            'descripcion': 'Tocino crujiente',
            'precio_adicional': Decimal('0.75'),  # $0.75 tocino extra
            'categorias': ['pizzas', 'snacks', 'hamburguesas']
        },
        'pepperoni': {
            'nombre_base': 'Pepperoni',
            'descripcion': 'Pepperoni italiano',
            'precio_adicional': Decimal('1.00'),  # $1.00 pepperoni extra
            'categorias': ['pizzas']
        },
        
        # Panes y bases
        'pan': {
            'nombre_base': 'Pan',
            'descripcion': 'Pan de hamburguesa fresco',
            'precio_adicional': Decimal('0.50'),  # $0.50 pan extra
            'categorias': ['hamburguesas']
        },
        
        # Quesos
        'quesoamarillo': {
            'nombre_base': 'Queso Amarillo',
            'descripcion': 'Queso amarillo americano',
            'precio_adicional': Decimal('0.50'),  # $0.50 queso extra
            'categorias': ['ensaladas', 'snacks', 'hamburguesas']
        },
        'quesoparmesano': {
            'nombre_base': 'Queso Parmesano',
            'descripcion': 'Queso parmesano rallado',
            'precio_adicional': Decimal('0.75'),  # $0.75 parmesano (más caro)
            'categorias': ['pizzas']
        },
        
        # Vegetales
        'lechuga': {
            'nombre_base': 'Lechuga',
            'descripcion': 'Lechuga fresca y crujiente',
            'precio_adicional': Decimal('0.25'),  # $0.25 vegetales baratos
            'categorias': ['ensaladas', 'hamburguesas']
        },
        'tomate': {
            'nombre_base': 'Tomate',
            'descripcion': 'Tomate rojo fresco',
            'precio_adicional': Decimal('0.30'),  # $0.30 tomate
            'categorias': ['ensaladas', 'pizzas', 'hamburguesas']
        },
        'cebolla': {
            'nombre_base': 'Cebolla',
            'descripcion': 'Cebolla blanca fresca',
            'precio_adicional': Decimal('0.25'),  # $0.25 cebolla
            'categorias': ['ensaladas', 'pizzas', 'hamburguesas']
        },
        'cebollin': {
            'nombre_base': 'Cebollín',
            'descripcion': 'Cebollín fresco',
            'precio_adicional': Decimal('0.30'),  # $0.30 cebollín
            'categorias': ['ensaladas', 'snacks']
        },
        'pimientorojo': {
            'nombre_base': 'Pimiento Rojo',
            'descripcion': 'Pimiento rojo fresco',
            'precio_adicional': Decimal('0.40'),  # $0.40 pimiento
            'categorias': ['pizzas']
        },
        'pepinillo': {
            'nombre_base': 'Pepinillo',
            'descripcion': 'Pepinillos encurtidos',
            'precio_adicional': Decimal('0.35'),  # $0.35 pepinillos
            'categorias': ['hamburguesas']
        },
        
        # Salsas y aderezos
        'mayonesa': {
            'nombre_base': 'Mayonesa',
            'descripcion': 'Mayonesa casera',
            'precio_adicional': Decimal('0.15'),  # $0.15 salsas básicas
            'categorias': ['ensaladas', 'pollos', 'snacks', 'hamburguesas']
        },
        'ketchup': {
            'nombre_base': 'Ketchup',
            'descripcion': 'Salsa de tomate',
            'precio_adicional': Decimal('0.15'),  # $0.15 salsas básicas
            'categorias': ['ensaladas', 'pollos', 'pizzas', 'snacks', 'hamburguesas']
        },
        
        # Para bebidas
        'hielo': {
            'nombre_base': 'Hielo',
            'descripcion': 'Hielo fresco',
            'precio_adicional': Decimal('0.00'),  # Gratis el hielo
            'categorias': ['bebidas']
        },
        
        # Helados base
        'heladochocolate': {
            'nombre_base': 'Helado Chocolate',
            'descripcion': 'Helado sabor chocolate',
            'precio_adicional': Decimal('0.50'),  # $0.50 sabor extra
            'categorias': ['helados']
        },
        'heladovainilla': {
            'nombre_base': 'Helado Vainilla',
            'descripcion': 'Helado sabor vainilla',
            'precio_adicional': Decimal('0.50'),  # $0.50 sabor extra
            'categorias': ['helados']
        },
        'heladofresa': {
            'nombre_base': 'Helado Fresa',
            'descripcion': 'Helado sabor fresa',
            'precio_adicional': Decimal('0.50'),  # $0.50 sabor extra
            'categorias': ['helados']
        },
        
        # Frutas y toppings
        'fresa': {
            'nombre_base': 'Fresa',
            'descripcion': 'Fresas frescas',
            'precio_adicional': Decimal('0.60'),  # $0.60 frutas frescas
            'categorias': ['helados']
        },
        'frambuesa': {
            'nombre_base': 'Frambuesa',
            'descripcion': 'Frambuesas frescas',
            'precio_adicional': Decimal('0.80'),  # $0.80 frambuesas (más caras)
            'categorias': ['helados']
        },
        'cereza': {
            'nombre_base': 'Cereza',
            'descripcion': 'Cerezas frescas',
            'precio_adicional': Decimal('0.70'),  # $0.70 cerezas
            'categorias': ['helados']
        },
        
        # Complementos crujientes
        'barquillo': {
            'nombre_base': 'Barquillo',
            'descripcion': 'Barquillo crujiente',
            'precio_adicional': Decimal('0.40'),  # $0.40 barquillo
            'categorias': ['helados']
        },
        'galleta': {
            'nombre_base': 'Galleta',
            'descripcion': 'Galleta dulce',
            'precio_adicional': Decimal('0.35'),  # $0.35 galleta
            'categorias': ['helados']
        }
    }
    
    ingredientes_creados = 0
    imagenes_creadas = 0
    resumen_por_categoria = {}
    ingredientes_sin_imagen = []
    
    print("🔄 Procesando ingredientes con nombres simples y precios ecuatorianos...")
    print("─" * 50)
    
    for imagen_nombre, data in ingredientes_base.items():
        print(f"\n📦 Procesando: {data['nombre_base']} (${data['precio_adicional']})")
        
        for categoria in data['categorias']:
            # ✅ CORREGIDO: Usar solo el nombre base, no agregar "para Categoria"
            nombre_ingrediente = data['nombre_base']
            
            # Verificar si ya existe este ingrediente específico en esta categoría
            ingrediente_existente = AppkioskoIngredientes.objects.filter(
                nombre=nombre_ingrediente,
                categoria_producto=categoria
            ).first()
            
            if ingrediente_existente:
                print(f"  ⚠️  {categoria}: Ya existe (ID: {ingrediente_existente.id})")
                continue
            
            # Crear el ingrediente para esta categoría
            ingrediente = AppkioskoIngredientes.objects.create(
                nombre=nombre_ingrediente,
                descripcion=data['descripcion'],
                categoria_producto=categoria,
                precio_adicional=data['precio_adicional']  # ✅ NUEVO: Agregar precio
            )
            ingredientes_creados += 1
            
            # Contabilizar por categoría
            if categoria not in resumen_por_categoria:
                resumen_por_categoria[categoria] = 0
            resumen_por_categoria[categoria] += 1
            
            # Verificar y asociar imagen
            if verificar_imagen_existe(imagen_nombre):
                ruta_imagen = f"/media/ingredientes/{imagen_nombre}.png"
                
                imagen_obj = AppkioskoImagen.objects.create(
                    ruta=ruta_imagen,
                    categoria_imagen='ingredientes',
                    entidad_relacionada_id=ingrediente.id
                )
                imagenes_creadas += 1
                print(f"  ✅ {categoria}: {nombre_ingrediente} (${data['precio_adicional']}) con imagen (ID: {ingrediente.id})")
            else:
                ingredientes_sin_imagen.append(f"{imagen_nombre}.png ({nombre_ingrediente} → {categoria})")
                print(f"  ✅ {categoria}: {nombre_ingrediente} (${data['precio_adicional']}) SIN imagen (ID: {ingrediente.id})")
    
    # Resumen final detallado
    print("\n" + "="*70)
    print("📊 RESUMEN POR CATEGORÍA:")
    print("="*70)
    
    orden_categorias = ['hamburguesas', 'pizzas', 'snacks', 'ensaladas', 'pollos', 'bebidas', 'helados']
    
    for categoria in orden_categorias:
        if categoria in resumen_por_categoria:
            emoji_categoria = {
                'hamburguesas': '🍔',
                'pizzas': '🍕', 
                'snacks': '🍿',
                'ensaladas': '🥗',
                'pollos': '🍗',
                'bebidas': '🥤',
                'helados': '🍦'
            }.get(categoria, '🍽️')
            
            cantidad = resumen_por_categoria[categoria]
            print(f"{emoji_categoria} {categoria.upper()}: {cantidad} ingredientes")
    
    print("\n" + "="*70)
    print("📈 RESUMEN GENERAL:")
    print("="*70)
    print(f"✅ Total ingredientes creados: {ingredientes_creados}")
    print(f"🖼️  Total imágenes asociadas: {imagenes_creadas}")
    print(f"📂 Categorías procesadas: {len(resumen_por_categoria)}")
    
    # Mostrar ingredientes sin imagen
    if ingredientes_sin_imagen:
        print(f"\n⚠️  IMÁGENES FALTANTES ({len(ingredientes_sin_imagen)}):")
        print("─" * 40)
        for item in ingredientes_sin_imagen:
            print(f"   📷 {item}")
        print(f"\n💡 Ubicación esperada: {os.path.join(settings.MEDIA_ROOT, 'ingredientes')}")
    
    return ingredientes_creados, imagenes_creadas

def verificar_especificacion():
    """Muestra la especificación con precios ecuatorianos"""
    print("\n" + "="*70)
    print("ESPECIFICACIÓN CON PRECIOS ECUATORIANOS (USD):")
    print("="*70)
    
    especificacion = {
        '🥤 BEBIDAS': [('hielo', '$0.00')],
        '🥗 ENSALADAS': [
            ('lechuga', '$0.25'), ('quesoamarillo', '$0.50'), ('cebollin', '$0.30'), 
            ('cebolla', '$0.25'), ('tomate', '$0.30'), ('ketchup', '$0.15'), ('mayonesa', '$0.15')
        ],
        '🍗 POLLOS': [('ketchup', '$0.15'), ('mayonesa', '$0.15')],
        '🍕 PIZZAS': [
            ('pepperoni', '$1.00'), ('quesoparmesano', '$0.75'), ('pimientorojo', '$0.40'), 
            ('tocino', '$0.75'), ('ketchup', '$0.15'), ('cebolla', '$0.25'), ('tomate', '$0.30')
        ],
        '🍿 SNACKS': [
            ('tocino', '$0.75'), ('quesoamarillo', '$0.50'), ('cebollin', '$0.30'), 
            ('ketchup', '$0.15'), ('mayonesa', '$0.15')
        ],
        '🍔 HAMBURGUESAS': [
            ('pan', '$0.50'), ('carne', '$1.50'), ('quesoamarillo', '$0.50'), ('pepinillo', '$0.35'),
            ('lechuga', '$0.25'), ('cebolla', '$0.25'), ('tocino', '$0.75'), ('tomate', '$0.30'), 
            ('ketchup', '$0.15'), ('mayonesa', '$0.15')
        ],
        '🍦 HELADOS': [
            ('heladochocolate', '$0.50'), ('heladovainilla', '$0.50'), ('heladofresa', '$0.50'),
            ('fresa', '$0.60'), ('frambuesa', '$0.80'), ('cereza', '$0.70'), 
            ('barquillo', '$0.40'), ('galleta', '$0.35')
        ]
    }
    
    for categoria, ingredientes in especificacion.items():
        print(f"\n{categoria} ({len(ingredientes)} ingredientes):")
        for ingrediente, precio in ingredientes:
            print(f"  • {ingrediente} → {precio}")

def listar_ingredientes_por_categoria():
    """Lista todos los ingredientes agrupados por categoría con precios"""
    print("\n" + "="*70)
    print("INGREDIENTES CREADOS CON PRECIOS:")
    print("="*70)
    
    orden_categorias = ['hamburguesas', 'pizzas', 'snacks', 'ensaladas', 'pollos', 'bebidas', 'helados']
    
    total_ingredientes = 0
    total_con_imagen = 0
    
    for categoria in orden_categorias:
        emoji_categoria = {
            'hamburguesas': '🍔',
            'pizzas': '🍕', 
            'snacks': '🍿',
            'ensaladas': '🥗',
            'pollos': '🍗',
            'bebidas': '🥤',
            'helados': '🍦'
        }.get(categoria, '🍽️')
        
        ingredientes = AppkioskoIngredientes.objects.filter(categoria_producto=categoria).order_by('nombre')
        
        if ingredientes:
            print(f"\n{emoji_categoria} {categoria.upper()} ({len(ingredientes)} ingredientes):")
            print("─" * 60)
            
            for ingrediente in ingredientes:
                total_ingredientes += 1
                
                # Verificar imagen
                imagen_bd = AppkioskoImagen.objects.filter(
                    categoria_imagen='ingredientes',
                    entidad_relacionada_id=ingrediente.id
                ).first()
                
                if imagen_bd:
                    ruta_fisica = os.path.join(settings.MEDIA_ROOT, 'ingredientes', 
                                             os.path.basename(imagen_bd.ruta))
                    existe_archivo = os.path.exists(ruta_fisica)
                    
                    if existe_archivo:
                        icono = "✅🖼️ "
                        total_con_imagen += 1
                    else:
                        icono = "⚠️🖼️ "
                else:
                    icono = "❌📷 "
                    
                # ✅ NUEVO: Mostrar precio también
                precio = f"${ingrediente.precio_adicional}" if hasattr(ingrediente, 'precio_adicional') else "$0.00"
                print(f"  {icono}{ingrediente.nombre} ({precio}) - ID: {ingrediente.id}")
    
    print("\n" + "="*70)
    print("📊 ESTADÍSTICAS GLOBALES:")
    print("="*70)
    print(f"📦 Total ingredientes: {total_ingredientes}")
    print(f"🖼️  Con imagen: {total_con_imagen}")
    print(f"❌ Sin imagen: {total_ingredientes - total_con_imagen}")

def main():
    """Función principal del script"""
    print("SCRIPT DE INGREDIENTES (NOMBRES SIMPLES + PRECIOS ECUADOR)")
    print("="*60)
    
    if len(sys.argv) < 2:
        print("Comandos disponibles:")
        print("  crear           - Crear ingredientes con nombres simples y precios")
        print("  limpiar_crear   - Limpiar todo y crear desde cero")
        print("  listar          - Listar ingredientes con precios por categoría")
        print("  verificar       - Mostrar especificación con precios")
        print("\n🖼️  NOTA: Las imágenes deben estar en /media/ingredientes/ con extensión .png")
        print("💰 PRECIOS: Basados en economía ecuatoriana (USD)")
        return

    comando = sys.argv[1].lower()

    try:
        if comando == 'verificar':
            verificar_especificacion()
            return
            
        with transaction.atomic():
            if comando == 'crear':
                ingredientes_creados, imagenes_creadas = crear_ingredientes_por_categoria()
                print(f"\n🎉 Proceso completado con nombres simples y precios!")
                
            elif comando == 'limpiar_crear':
                respuesta = input("¿Estás seguro de que quieres ELIMINAR todos los ingredientes e imágenes existentes? (sí/no): ")
                if respuesta.lower() in ['sí', 'si', 's', 'yes', 'y']:
                    limpiar_ingredientes_completo()
                    ingredientes_creados, imagenes_creadas = crear_ingredientes_por_categoria()
                    print(f"\n🎉 Proceso completado desde cero!")
                else:
                    print("Operación cancelada.")
                    
            elif comando == 'listar':
                listar_ingredientes_por_categoria()
                
            else:
                print(f"Comando '{comando}' no reconocido.")
                print("Comandos disponibles: crear, limpiar_crear, listar, verificar")

    except Exception as e:
        print(f"✗ Error durante la ejecución: {str(e)}")
        raise

if __name__ == "__main__":
    main()