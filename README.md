# 🍔 KioskoTouch

**Sistema de pedidos de comida en línea con pantalla táctil**

Un sistema completo de gestión de pedidos para restaurantes y kioskos que permite a los clientes realizar pedidos de forma autónoma a través de una interfaz táctil intuitiva, con módulos especializados para cocina y administración.

---

## 🎯 **Características Principales**

### 👥 **Múltiples Roles de Usuario**
- **🍽️ Clientes:** Navegación y pedidos a través de interfaz táctil
- **👨‍🍳 Chef:** Gestión de pedidos en cocina y estado de preparación
- **👨‍💼 Administrador:** Panel completo de gestión y configuración

### 🔐 **Sistema de Autenticación y Permisos**
- Login seguro con JWT (JSON Web Tokens)
- Sistema de permisos granular por roles
- Sesiones persistentes y logout automático
- Guards de rutas para proteger accesos

### 🎨 **Interfaz de Usuario**
- Diseño responsive optimizado para pantallas táctiles
- Componentes modales con Angular Material
- Experiencia de usuario intuitiva y moderna
- Navegación fluida entre módulos

### 📊 **Gestión Administrativa Completa**
- **Usuarios:** Creación, edición y eliminación de empleados
- **Roles:** Gestión de permisos por grupos
- **Productos:** CRUD completo con imágenes
- **Categorías:** Organización del catálogo
- **Menús:** Gestión de menús activos
- **Establecimientos:** Configuración multi-sucursal
- **Promociones:** Sistema de ofertas y descuentos
- **Pantallas Cocina:** Gestión de displays
- **Kioscos Touch:** Configuración de terminales
- **Publicidad:** Gestión de contenido promocional
- **IVA:** Configuración de impuestos

### 💰 **Sistema de Ventas**
- Carrito de compras interactivo
- Cálculo automático de totales e impuestos
- Confirmación de pedidos
- Integración con pasarelas de pago

---

## 🛠️ **Tecnologías Utilizadas**

### **Frontend**
- **Angular 19** - Framework principal
- **TypeScript** - Lenguaje de programación
- **Angular Material** - Componentes UI
- **SCSS** - Estilos avanzados
- **RxJS** - Programación reactiva

### **Backend**
- **Django 5.1.7** - Framework web de Python
- **Django REST Framework** - API REST
- **JWT Authentication** - Autenticación segura
- **Python** - Lenguaje del servidor
- **Pillow** - Procesamiento de imágenes

### **Base de Datos**
- **MySQL** - Sistema de gestión de base de datos
- **Django ORM** - Mapeo objeto-relacional

### **Herramientas de Desarrollo**
- **Git** - Control de versiones
- **VSCode** - Editor de código
- **Angular CLI** - Herramientas de Angular
- **Django Admin** - Panel administrativo
- **PowerShell** - Terminal de desarrollo (Windows)

---

## 📁 **Estructura del Proyecto**

```
KioskoTouch/
├── 📂 Frontend/                    # Aplicación Angular
│   ├── 📂 src/
│   │   ├── 📂 app/
│   │   │   ├── 📂 cliente/         # Módulo de clientes
│   │   │   │   ├── 📂 menu/        # Catálogo de productos
│   │   │   │   ├── 📂 carrito/     # Carrito de compras
│   │   │   │   └── 📂 checkout/    # Proceso de pago
│   │   │   ├── 📂 chef/            # Módulo de chef
│   │   │   │   ├── 📂 pedidos/     # Gestión de pedidos
│   │   │   │   └── 📂 dashboard/   # Panel de control
│   │   │   ├── 📂 administrador/   # Módulo de administración
│   │   │   │   ├── 📂 usuarios/    # Gestión de usuarios
│   │   │   │   ├── 📂 productos/   # CRUD de productos
│   │   │   │   ├── 📂 categorias/  # Gestión de categorías
│   │   │   │   ├── 📂 menus/       # Gestión de menús
│   │   │   │   ├── 📂 establecimientos/  # Multi-sucursal
│   │   │   │   ├── 📂 promociones/ # Sistema de ofertas
│   │   │   │   ├── 📂 pantallas-cocina/ # Displays
│   │   │   │   ├── 📂 kiosko-touch/ # Terminales
│   │   │   │   ├── 📂 publicidad/  # Contenido promocional
│   │   │   │   ├── 📂 gestion-iva/ # Configuración de impuestos
│   │   │   │   └── 📂 ventas/      # Reportes y análisis
│   │   │   ├── 📂 shared/          # Componentes compartidos
│   │   │   │   ├── 📂 header-admin/ # Header administrativo
│   │   │   │   ├── 📂 footer-admin/ # Footer administrativo
│   │   │   │   ├── 📂 confirmation-dialog/ # Diálogos de confirmación
│   │   │   │   ├── 📂 success-dialog/ # Diálogos de éxito
│   │   │   │   └── 📂 permission-denied-dialog/ # Diálogos de permisos
│   │   │   ├── 📂 services/        # Servicios Angular
│   │   │   │   ├── 📄 auth.service.ts     # Autenticación
│   │   │   │   ├── 📄 usuario.service.ts  # Gestión de usuarios
│   │   │   │   ├── 📄 producto.service.ts # Gestión de productos
│   │   │   │   ├── 📄 categoria.service.ts # Gestión de categorías
│   │   │   │   ├── 📄 menu.service.ts     # Gestión de menús
│   │   │   │   ├── 📄 pedido.service.ts   # Gestión de pedidos
│   │   │   │   └── 📄 catalogo.service.ts # Servicios del catálogo
│   │   │   ├── 📂 models/          # Modelos TypeScript
│   │   │   ├── 📂 guards/          # Guards de rutas
│   │   │   │   ├── 📄 auth.guard.ts       # Protección de rutas
│   │   │   │   └── 📄 permission.guard.ts # Permisos específicos
│   │   │   └── 📂 interceptors/    # Interceptores HTTP
│   │   │       └── 📄 auth.interceptor.ts # JWT automático
│   │   └── 📂 assets/             # Recursos estáticos
│   │       ├── 📂 admin/          # Imágenes del admin
│   │       ├── 📂 cliente/        # Imágenes del cliente
│   │       └── 📂 shared/         # Recursos compartidos
│   ├── 📄 angular.json           # Configuración Angular
│   ├── 📄 package.json          # Dependencias Node.js
│   └── 📄 tsconfig.json         # Configuración TypeScript
├── 📂 Backend/                   # Aplicación Django
│   ├── 📂 KioskoTouch/          # Configuración principal
│   │   ├── 📄 settings.py       # Configuración Django
│   │   ├── 📄 urls.py           # URLs principales
│   │   └── 📄 wsgi.py           # WSGI para producción
│   ├── 📂 usuarios/             # App de usuarios y autenticación
│   ├── 📂 catalogo/             # App de productos y categorías
│   ├── 📂 categoria/            # App de categorías
│   ├── 📂 establecimientos/     # App de establecimientos
│   ├── 📂 marketing/            # App de promociones y publicidad
│   ├── 📂 comun/                # App de datos comunes
│   ├── 📂 ventas/               # App de ventas y pedidos
│   ├── 📂 main/                 # App principal
│   ├── 📂 media/                # Archivos multimedia
│   │   ├── 📂 productos/        # Imágenes de productos
│   │   ├── 📂 categorias/       # Imágenes de categorías
│   │   ├── 📂 establecimientos/ # Imágenes de establecimientos
│   │   ├── 📂 promociones/      # Imágenes de promociones
│   │   └── 📂 publicidad/       # Contenido publicitario
│   ├── 📂 static/               # Archivos estáticos
│   ├── 📂 staticfiles/          # Archivos estáticos compilados
│   ├── 📄 manage.py            # Comando Django
│   └── 📄 requirements.txt     # Dependencias Python
├── 📂 PinpadService/           # Servicio de terminal de pago (Java)
│   ├── 📄 pom.xml              # Configuración Maven
│   └── 📂 src/                 # Código fuente Java
└── 📄 README.md               # Este archivo
```

---

## 🚀 **Instalación y Configuración**

### **📋 Prerrequisitos**
- **Node.js** (v18 o superior)
- **Python** (v3.9 o superior)
- **MySQL** (v8.0 o superior)
- **Git**

### **🔧 Configuración del Backend**

1. **Clonar el repositorio**
```bash
git clone https://github.com/Alex-Benites/KioskoTouch.git
cd KioskoTouch
```

2. **Configurar entorno virtual de Python**
```bash
cd Backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar base de datos MySQL**
```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE kioskoTouch;
```

5. **Configurar variables de entorno**
```python
# Backend/KioskoTouch/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'kioskoTouch',
        'USER': 'tu_usuario',
        'PASSWORD': 'tu_contraseña',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

6. **Ejecutar migraciones**
```bash
python manage.py makemigrations
python manage.py migrate
```

7. **Crear superusuario**
```bash
python manage.py createsuperuser
```

8. **Iniciar servidor de desarrollo**
```bash
python manage.py runserver
```

El backend estará disponible en: `http://localhost:8000/`

### **🎨 Configuración del Frontend**

1. **Instalar Node.js y Angular CLI**
```bash
npm install -g @angular/cli
```

2. **Instalar dependencias del proyecto**
```bash
cd Frontend
npm install
```

3. **Iniciar servidor de desarrollo**
```bash
ng serve
```

El frontend estará disponible en: `http://localhost:4200/`

---

## 🔑 **Usuarios por Defecto**

Después de ejecutar las migraciones y crear el superusuario, puedes acceder con:

- **Administrador:** El superusuario que creaste
- **Empleados:** Se crean desde el panel de administración

---

## 📱 **Módulos del Sistema**

### **👨‍💼 Panel de Administración**
- **Dashboard:** Resumen general del sistema
- **Usuarios:** Gestión de empleados y roles
- **Productos:** CRUD completo con carga de imágenes
- **Categorías:** Organización del catálogo
- **Menús:** Gestión de menús activos por establecimiento
- **Establecimientos:** Configuración multi-sucursal
- **Promociones:** Sistema de descuentos y ofertas
- **Pantallas de Cocina:** Gestión de displays
- **Kioscos Touch:** Configuración de terminales
- **Publicidad:** Gestión de contenido promocional
- **IVA:** Configuración de impuestos
- **Ventas:** Reportes y análisis

### **🍽️ Interfaz de Cliente**
- **Menú:** Navegación por categorías y productos
- **Carrito:** Gestión de pedidos
- **Checkout:** Proceso de pago
- **Confirmación:** Resumen del pedido

### **👨‍🍳 Panel de Chef**
- **Pedidos Activos:** Lista de pedidos en preparación
- **Estados:** Cambio de estado de pedidos
- **Dashboard:** Métricas de cocina

---

## 🛡️ **Seguridad y Permisos**

El sistema implementa un robusto sistema de permisos basado en:

- **Autenticación JWT:** Tokens seguros para sesiones
- **Permisos granulares:** Control específico por funcionalidad
- **Guards de rutas:** Protección del frontend
- **Interceptores:** Manejo automático de autenticación
- **Validación de permisos:** Verificación tanto en frontend como backend

---

## 👨‍💻 **Desarrolladores del Proyecto**

### **Equipo de Desarrollo**

**👨‍💻 [Johann Ramírez](https://github.com/Johrespi)** | 📧 johrespi@espol.edu.ec  

**👨‍💻 [Nehemias Lindao](https://github.com/NLindao2004)** | 📧 nlindao@espol.edu.ec  

**👨‍💻 [Alex Benites](https://github.com/Alex-Benites)** | 📧 albesegu@espol.edu.ec  

---

**🚀 ¡Gracias por usar KioskoTouch! 🍔✨**

*Sistema desarrollado con ❤️ por estudiantes de ESPOL*
