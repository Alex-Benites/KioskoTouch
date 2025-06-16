# Scripts de Gestión de Categorías, Estados e Ingredientes

Este repositorio contiene scripts para la gestión inicial de **categorías**, **estados** e **ingredientes** dentro de un sistema Django.

## Requisitos

- Python 3.x
- Django
- Acceso a los modelos `AppkioskoCategorias`, `AppkioskoEstados`, `AppkioskoIngredientes` y `AppkioskoImagen`
- Estar dentro de un proyecto Django con las configuraciones adecuadas (`config.settings`)
- Hacer las migraciones pendientes
- Imágenes en las carpetas correspondientes: `/media/categorias/` y `/media/ingredientes/`

## Uso de los Scripts

### Script: `categorias.py`

Gestión de las categorías del sistema.

```bash
python Scripts/categorias.py listar
```
Lista las categorías existentes en la base de datos.

```bash
python Scripts/categorias.py crear
```
Crea las categorías iniciales sin eliminar las existentes.

```bash
python Scripts/categorias.py limpiar
```
Elimina todas las categorías existentes. Se solicita confirmación.

```bash
python Scripts/categorias.py limpiar_crear
```
Elimina todas las categorías y luego crea las iniciales. Se solicita confirmación.

```bash
python Scripts/categorias.py migrar_imagenes
```
Migra las imágenes de categorías desde `/media/categorias/` a la base de datos.

---

### Script: `estados.py`

Gestión de los estados del sistema.

```bash
python Scripts/estados.py listar
```
Lista los estados existentes en la base de datos.

```bash
python Scripts/estados.py crear
```
Crea los estados iniciales sin eliminar los existentes.

```bash
python Scripts/estados.py limpiar
```
Elimina todos los estados existentes. Se solicita confirmación.

```bash
python Scripts/estados.py limpiar_crear
```
Elimina todos los estados y luego crea los iniciales. Se solicita confirmación.

---

### Script: `ingredientes.py`

Gestión de ingredientes con imágenes automáticas por categoría.

```bash
python Scripts/ingredientes.py crear
```
Crea ingredientes con imágenes automáticamente según especificación por categorías:
- 🍔 **Hamburguesas**: pan, carne, queso amarillo, pepinillo, lechuga, cebolla, tocino, tomate, ketchup, mayonesa
- 🍕 **Pizzas**: pepperoni, queso parmesano, pimiento rojo, tocino, ketchup, cebolla, tomate  
- 🍿 **Snacks**: tocino, queso amarillo, cebollín, ketchup, mayonesa
- 🥗 **Ensaladas**: lechuga, queso amarillo, cebollín, cebolla, tomate, ketchup, mayonesa
- 🍗 **Pollos**: ketchup, mayonesa
- 🥤 **Bebidas**: hielo
- 🍦 **Helados**: helado chocolate, helado vainilla, helado fresa, fresa, frambuesa, cereza, barquillo, galleta

```bash
python Scripts/ingredientes.py limpiar_crear
```
Elimina todos los ingredientes e imágenes existentes y crea desde cero. Se solicita confirmación.

```bash
python Scripts/ingredientes.py listar
```
Lista todos los ingredientes organizados por categoría con estado de imágenes.

```bash
python Scripts/ingredientes.py verificar
```
Muestra la especificación exacta de categorías y verifica qué imágenes faltan en el sistema de archivos.

**📝 Nota**: Las imágenes deben estar en `/media/ingredientes/` con nombres exactos y extensión `.png`

---

### Script: `tamanios.py`

Gestión de tamaños del sistema.

```bash
python Scripts/tamanios.py crear
```
Crea los tamaños iniciales del sistema.

---

### Script: `mega_crear_todo.py`

Script maestro que ejecuta todos los scripts de creación.

```bash
python Scripts/mega_crear_todo.py
```
Ejecuta automáticamente la creación de categorías, estados, ingredientes y tamaños en el orden correcto.

## Estructura de Archivos Esperada

```
Backend/
├── media/
│   ├── categorias/          # Imágenes de categorías (.png)
│   │   ├── hamburguesas.png
│   │   ├── pizzas.png
│   │   ├── bebidas.png
│   │   └── ...
│   └── ingredientes/        # Imágenes de ingredientes (.png)
│       ├── carne.png
│       ├── quesoamarillo.png
│       ├── pepinillo.png
│       └── ...
└── Scripts/
    ├── categorias.py
    ├── estados.py
    ├── ingredientes.py
    ├── tamanios.py
    ├── mega_crear_todo.py
    └── README.md
```

## Orden Recomendado de Ejecución

1. **Estados** (primero, son base para otros modelos)
2. **Categorías** con imágenes
3. **Ingredientes** con imágenes  
4. **Tamaños**

O simplemente ejecutar el mega script:
```bash
python Scripts/mega_crear_todo.py
```