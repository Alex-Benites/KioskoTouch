# Scripts de Gestión de Categorías y Estados

Este repositorio contiene scripts para la gestión inicial de **categorías** y **estados** dentro de un sistema Django.

## Requisitos

- Python 3.x
- Django
- Acceso a los modelos `AppkioskoCategorias` y `AppkioskoEstados`
- Estar dentro de un proyecto Django con las configuraciones adecuadas (`config.settings`)
- Hacer las migraciones pendientes

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
