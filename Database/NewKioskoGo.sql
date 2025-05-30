use kiosko_db;

-- =====================================================
-- PRIMERA PARTE: Tablas base sin dependencias
-- =====================================================

-- Estados (tabla base)
CREATE TABLE IF NOT EXISTS appKiosko_Estados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) DEFAULT 'Estado Desconocido',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_eliminated BOOLEAN NOT NULL DEFAULT FALSE,
    is_inactive BOOLEAN NOT NULL DEFAULT FALSE,
    is_order_preparing BOOLEAN NOT NULL DEFAULT FALSE,
    is_order_finished BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Empleados
CREATE TABLE IF NOT EXISTS appKiosko_Empleados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cedula VARCHAR(10) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    telefono VARCHAR(10),
    sexo VARCHAR(50),
    turno_trabajo VARCHAR(20),
    user_id INT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ Establecimientos SIN image_URL
CREATE TABLE IF NOT EXISTS appKiosko_Establecimientos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    telefono VARCHAR(15),
    tipo_establecimiento VARCHAR(50),
    correo VARCHAR(100),
    estado_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estado_id) REFERENCES appKiosko_Estados(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- EstablecimientosUsuarios
CREATE TABLE IF NOT EXISTS appKiosko_EstablecimientosUsuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    establecimiento_id INT, 
    empleado_id INT,
    fecha_inicio_trabajo DATETIME(6) NOT NULL,
    fecha_fin_trabajo DATETIME(6),
    estado_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_empleado_establecimiento_activo (establecimiento_id, empleado_id, fecha_inicio_trabajo),
    FOREIGN KEY (establecimiento_id) REFERENCES appKiosko_Establecimientos(id) ON DELETE CASCADE,
    FOREIGN KEY (empleado_id) REFERENCES appKiosko_Empleados(id) ON DELETE CASCADE,
    FOREIGN KEY (estado_id) REFERENCES appKiosko_Estados(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PantallasCocina
CREATE TABLE IF NOT EXISTS appKiosko_PantallasCocina (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    estado_id INT,
    token VARCHAR(255),
    establecimiento_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estado_id) REFERENCES appKiosko_Estados(id) ON DELETE SET NULL,
    FOREIGN KEY (establecimiento_id) REFERENCES appKiosko_Establecimientos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- KioskosTouch
CREATE TABLE IF NOT EXISTS appKiosko_KioskosTouch (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    estado_id INT,
    token VARCHAR(255),
    establecimiento_id INT,
    pantallas_cocina_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estado_id) REFERENCES appKiosko_Estados(id) ON DELETE SET NULL,
    FOREIGN KEY (establecimiento_id) REFERENCES appKiosko_Establecimientos(id) ON DELETE CASCADE,
    FOREIGN KEY (pantallas_cocina_id) REFERENCES appKiosko_PantallasCocina(id) ON DELETE SET NULL 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Clientes
CREATE TABLE IF NOT EXISTS appKiosko_clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cedula VARCHAR(10) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(10),
    sexo VARCHAR(50),
    user_id INT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- SEGUNDA PARTE: Catálogo de productos
-- =====================================================

-- Categorias
CREATE TABLE IF NOT EXISTS appKiosko_Categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Productos
CREATE TABLE IF NOT EXISTS appKiosko_Productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion LONGTEXT,
    precio DECIMAL(10,2) NOT NULL,
    categoria_id INT,
    estado_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES appKiosko_Categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (estado_id) REFERENCES appKiosko_Estados(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Menus
CREATE TABLE IF NOT EXISTS appKiosko_Menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion LONGTEXT,
    precio DECIMAL(10,2) NOT NULL,
    tipo_menu VARCHAR(50),
    estado_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estado_id) REFERENCES appKiosko_Estados(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ MenuProductos CON ID único
CREATE TABLE IF NOT EXISTS appKiosko_MenuProductos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT,
    menu_id INT,
    cantidad INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_producto_menu (producto_id, menu_id),
    FOREIGN KEY (producto_id) REFERENCES appKiosko_Productos(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES appKiosko_Menus(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TERCERA PARTE: Promociones y marketing  
-- =====================================================

-- ✅ Promociones CORREGIDAS
CREATE TABLE IF NOT EXISTS appKiosko_Promociones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(100),
    valor_descuento INT NOT NULL, 
    fecha_inicio_promo DATETIME(6) NOT NULL,
    fecha_fin_promo DATETIME(6), -- ✅ NULLABLE
    tipo_promocion VARCHAR(50),
    codigo_promocional VARCHAR(50),
    limite_uso_usuario INT,
    estado_id INT,
    limite_uso_total INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estado_id) REFERENCES appKiosko_Estados(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ PromocionProductos CON ID
CREATE TABLE IF NOT EXISTS appKiosko_PromocionProductos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT,
    promocion_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_producto_promocion (producto_id, promocion_id),
    FOREIGN KEY (producto_id) REFERENCES appKiosko_Productos(id) ON DELETE CASCADE,
    FOREIGN KEY (promocion_id) REFERENCES appKiosko_Promociones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ PromocionMenu CON ID (UNA SOLA DEFINICIÓN)
CREATE TABLE IF NOT EXISTS appKiosko_PromocionMenu (
    id INT PRIMARY KEY AUTO_INCREMENT,
    menu_id INT,
    promocion_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_menu_promocion (menu_id, promocion_id),
    FOREIGN KEY (menu_id) REFERENCES appKiosko_Menus(id) ON DELETE CASCADE,
    FOREIGN KEY (promocion_id) REFERENCES appKiosko_Promociones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ Publicidades SIN imagen_or_video_URL
CREATE TABLE IF NOT EXISTS appKiosko_Publicidades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion LONGTEXT,
    tipo_publicidad VARCHAR(100),
    fecha_inicio_publicidad DATETIME(6),
    fecha_fin_publicidad DATETIME(6),
    estado_id INT,
    promocion_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estado_id) REFERENCES appKiosko_Estados(id) ON DELETE SET NULL,
    FOREIGN KEY (promocion_id) REFERENCES appKiosko_Promociones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ PublicidadEstablecimiento CON ID
CREATE TABLE IF NOT EXISTS appKiosko_PublicidadEstablecimiento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    establecimiento_id INT,
    publicidad_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_establecimiento_publicidad (establecimiento_id, publicidad_id),
    FOREIGN KEY (establecimiento_id) REFERENCES appKiosko_Establecimientos(id) ON DELETE CASCADE,
    FOREIGN KEY (publicidad_id) REFERENCES appKiosko_Publicidades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ PublicidadKioskoTouch CON ID y naming corregido
CREATE TABLE IF NOT EXISTS appKiosko_PublicidadKioskoTouch (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kiosko_touch_id INT, 
    publicidad_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_kiosko_publicidad (kiosko_touch_id, publicidad_id),
    FOREIGN KEY (kiosko_touch_id) REFERENCES appKiosko_KioskosTouch(id) ON DELETE CASCADE,
    FOREIGN KEY (publicidad_id) REFERENCES appKiosko_Publicidades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Video
CREATE TABLE IF NOT EXISTS appKiosko_Video (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    ruta VARCHAR(500) NOT NULL,
    duracion INT NOT NULL,
    publicidad_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (publicidad_id) REFERENCES appKiosko_Publicidades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- CUARTA PARTE: Ventas y pagos
-- =====================================================

-- TipoPago
CREATE TABLE IF NOT EXISTS appKiosko_TipoPago (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cupon
CREATE TABLE IF NOT EXISTS appKiosko_Cupon (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descuento DECIMAL(5,2) NOT NULL, 
    fecha_creacion_cupon DATETIME(6),
    fecha_fin_cupon DATETIME(6),
    estado_id INT,
    cliente_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estado_id) REFERENCES appKiosko_Estados(id) ON DELETE SET NULL,
    FOREIGN KEY (cliente_id) REFERENCES appKiosko_clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ Pedidos CORREGIDOS
CREATE TABLE IF NOT EXISTS appKiosko_Pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) NOT NULL,
    tipo_entrega VARCHAR(50),
    total DECIMAL(10, 2) NOT NULL,
    numero_mesa INT,
    cliente_id INT,
    valor_descuento DECIMAL(5, 2) DEFAULT 0.00,
    cupon_id INT,
    tipo_pago_id INT,
    fecha_pago DATETIME(6),
    is_facturado BOOLEAN DEFAULT FALSE, 
    estado_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES appKiosko_clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (cupon_id) REFERENCES appKiosko_Cupon(id) ON DELETE SET NULL,
    FOREIGN KEY (tipo_pago_id) REFERENCES appKiosko_TipoPago(id) ON DELETE SET NULL,
    FOREIGN KEY (estado_id) REFERENCES appKiosko_Estados(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ DetallePedido CORREGIDO (reemplaza PedidosProductos)
CREATE TABLE IF NOT EXISTS appKiosko_DetallePedido (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT,
    producto_id INT,
    menu_id INT, -- ✅ Soporte para menús
    cantidad INT NOT NULL, -- ✅ INT
    precio_unitario DECIMAL(10,2) NOT NULL, -- ✅ DECIMAL(10,2)
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES appKiosko_Pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES appKiosko_Productos(id) ON DELETE SET NULL,
    FOREIGN KEY (menu_id) REFERENCES appKiosko_Menus(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ PedidoSessions 
CREATE TABLE IF NOT EXISTS appKiosko_PedidoSessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kiosko_touch_id INT NOT NULL,
    pedido_id INT, 
    promocion_id INT,
    fecha_inicio_pedido DATETIME(6) NOT NULL,
    fecha_fin_pedido DATETIME(6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kiosko_touch_id) REFERENCES appKiosko_KioskosTouch(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES appKiosko_Pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (promocion_id) REFERENCES appKiosko_Promociones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- QUINTA PARTE: Facturación
-- =====================================================

-- Facturas
CREATE TABLE IF NOT EXISTS appKiosko_Facturas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_cliente VARCHAR(100) NOT NULL,
    email_cliente VARCHAR(100),
    cedula_cliente VARCHAR(10),
    telefono_cliente VARCHAR(10),
    pedido_id INT UNIQUE,
    cliente_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES appKiosko_Pedidos(id) ON DELETE SET NULL,
    FOREIGN KEY (cliente_id) REFERENCES appKiosko_clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ DetalleFacturaProducto
CREATE TABLE IF NOT EXISTS appKiosko_DetalleFacturaProducto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    factura_id INT,
    producto_id INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    iva DECIMAL(5,2) NOT NULL DEFAULT 0.00, 
    descuento DECIMAL(5,2) DEFAULT 0.00, 
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    fecha_emision_factura DATETIME(6) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_factura_producto (factura_id, producto_id),
    FOREIGN KEY (factura_id) REFERENCES appKiosko_Facturas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES appKiosko_Productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- SEXTA PARTE: Multimedia e ingredientes
-- =====================================================

-- Imagen
CREATE TABLE IF NOT EXISTS appKiosko_Imagen (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ruta VARCHAR(500) NOT NULL,
    categoria_imagen VARCHAR(100),
    entidad_relacionada_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ingredientes
CREATE TABLE IF NOT EXISTS appKiosko_Ingredientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    precio_adicional DECIMAL(5,2) DEFAULT 0.00,
    estado_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estado_id) REFERENCES appKiosko_Estados(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Productos_Ingredientes
CREATE TABLE IF NOT EXISTS appKiosko_Productos_Ingredientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT,
    ingrediente_id INT,
    es_base BOOLEAN DEFAULT TRUE,        
    permite_extra BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_producto_ingrediente (producto_id, ingrediente_id),
    FOREIGN KEY (producto_id) REFERENCES appKiosko_Productos(id) ON DELETE CASCADE,
    FOREIGN KEY (ingrediente_id) REFERENCES appKiosko_Ingredientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para personalizaciones de pedidos
CREATE TABLE IF NOT EXISTS appKiosko_Pedido_Producto_Ingredientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT,
    producto_id INT,
    ingrediente_id INT,
    accion varchar(20) NOT NULL,
    precio_aplicado DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pedido_producto_ingrediente_accion (pedido_id, producto_id, ingrediente_id, accion),
    FOREIGN KEY (pedido_id) REFERENCES appKiosko_Pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES appKiosko_Productos(id) ON DELETE CASCADE,
    FOREIGN KEY (ingrediente_id) REFERENCES appKiosko_Ingredientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;