# 🍔 KioskoTouch

**Sistema de pedidos de comida en línea con pantalla táctil**

Un sistema completo de gestión de pedidos para restaurantes y kioskos que permite a los clientes realizar pedidos de forma autónoma a través de una interfaz táctil intuitiva.

---

## 🎯 **Características Principales**

### 👥 **Múltiples Roles de Usuario**
- **🍽️ Clientes:** Navegación y pedidos a través de interfaz táctil
- **👨‍🍳 Chef:** Gestión de pedidos en cocina y estado de preparación
- **👨‍💼 Administrador:** Panel completo de gestión y configuración

### 🔐 **Sistema de Autenticación**
- Login seguro con JWT (JSON Web Tokens)
- Gestión de permisos por roles
- Sesiones persistentes y logout automático

### 🎨 **Interfaz de Usuario**
- Diseño responsive optimizado para pantallas táctiles
- Experiencia de usuario intuitiva y moderna
- Navegación fluida entre módulos

### 📊 **Gestión Administrativa**
- Panel de control para administradores
- Gestión de usuarios y empleados
- Configuración del sistema

---

## 🛠️ **Tecnologías Utilizadas**

### **Frontend**
- **Angular 19** - Framework principal
- **TypeScript** - Lenguaje de programación
- **SCSS** - Estilos avanzados
- **RxJS** - Programación reactiva

### **Backend**
- **Django 5.1.7** - Framework web de Python
- **Django REST Framework** - API REST
- **JWT Authentication** - Autenticación segura
- **Python** - Lenguaje del servidor

### **Base de Datos**
- **MySQL** - Sistema de gestión de base de datos
- **Django ORM** - Mapeo objeto-relacional

### **Herramientas de Desarrollo**
- **Git** - Control de versiones
- **VSCode** - Editor de código
- **Angular CLI** - Herramientas de Angular
- **Django Admin** - Panel administrativo

---

## 📁 **Estructura del Proyecto**

```
KioskoTouch/
├── 📂 Frontend/                 # Aplicación Angular
│   ├── 📂 src/
│   │   ├── 📂 app/
│   │   │   ├── 📂 cliente/      # Módulo de clientes
│   │   │   ├── 📂 chef/         # Módulo de chef
│   │   │   ├── 📂 administrador/ # Módulo de admin
│   │   │   ├── 📂 shared/       # Componentes compartidos
│   │   │   ├── 📂 services/     # Servicios Angular
│   │   │   ├── 📂 models/       # Modelos TypeScript
│   │   │   ├── 📂 guards/       # Guards de rutas
│   │   │   └── 📂 interceptors/ # Interceptores HTTP
│   │   └── 📂 assets/           # Recursos estáticos
│   └── 📄 angular.json          # Configuración Angular
├── 📂 Backend/                  # Aplicación Django
│   ├── 📂 KioskoTouch/         # Configuración principal
│   ├── 📂 usuarios/            # App de usuarios
│   ├── 📄 manage.py            # Comando Django
│   └── 📄 requirements.txt     # Dependencias Python
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
git clone https://github.com/tu-usuario/KioskoTouch.git
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

---

### **🔧 Desarrolladores del Proyecto**

👨‍💻 **[Johann Ramírez](https://github.com/Johrespi)** | 📧 johrespi@espol.edu.ec

👨‍💻 **[Nehemias Lindao](https://github.com/NLindao2004)** | 📧 nlindao@espol.edu.ec

👨‍💻 **[Nombre 3](https://github.com/usuario3)**   
📧 email3@ejemplo.com 

👨‍💻 **[Nombre 4](https://github.com/usuario4)**   
📧 email4@ejemplo.com 

---

**¡Gracias por usar KioskoTouch! 🍔✨**
