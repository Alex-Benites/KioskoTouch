# 🍔 KioskoTouch - Análisis Completo de Base de Datos

## 📋 Tabla de Contenidos
- [🎯 Resumen Ejecutivo](#-resumen-ejecutivo)
- [🛒 Flujo de Compra Completo](#-flujo-de-compra-completo)
- [📦 Flujo de Registro de Productos](#-flujo-de-registro-de-productos)
- [🔍 Análisis Profundo de Integridad](#-análisis-profundo-de-integridad)
- [🚀 Sugerencias de Mejora](#-sugerencias-de-mejora)

---

## 🎯 **Resumen Ejecutivo**

### **Stack Tecnológico**
- **Backend:** Django 5.1.7 + Django REST Framework 3.16.0
- **Base de Datos:** MySQL con mysqlclient 2.2.7
- **Autenticación:** JWT con djangorestframework_simplejwt 5.5.0
- **Media:** Pillow 11.2.1 para manejo de imágenes

### **Arquitectura de Base de Datos**
- ✅ **47 tablas** organizadas en 6 módulos principales
- ✅ **Integridad referencial** completa con foreign keys
- ✅ **Soft deletes** implementados con estados
- ✅ **Multimedia centralizada** en tabla de imágenes
- ✅ **Personalización avanzada** de productos con ingredientes

---

## 🛒 **Flujo de Compra Completo**

### **1️⃣ INICIO DE SESIÓN EN KIOSKO**
```sql
-- Cliente se acerca al kiosko
INSERT INTO appKiosko_PedidoSessions (
    kiosko_touch_id, 
    fecha_inicio_pedido
) VALUES (1, NOW());

-- Estado: Sesión iniciada, pedido_id = NULL (aún no hay pedido)
```

### **2️⃣ NAVEGACIÓN POR CATEGORÍAS**
```sql
-- Cliente ve categorías disponibles
SELECT c.*, COUNT(p.id) as productos_disponibles
FROM appKiosko_Categorias c
LEFT JOIN appKiosko_Productos p ON c.id = p.categoria_id
INNER JOIN appKiosko_Estados e ON p.estado_id = e.id
WHERE e.is_active = TRUE AND e.is_eliminated = FALSE
GROUP BY c.id;

-- Cliente ve productos de una categoría
SELECT p.*, c.nombre as categoria_nombre
FROM appKiosko_Productos p
INNER JOIN appKiosko_Categorias c ON p.categoria_id = c.id  
INNER JOIN appKiosko_Estados e ON p.estado_id = e.id
WHERE c.id = 1 AND e.is_active = TRUE;
```

### **3️⃣ VER DETALLES DEL PRODUCTO Y PERSONALIZACIÓN**
```sql
-- Cliente selecciona hamburguesa clásica
SELECT p.*, 
       GROUP_CONCAT(CONCAT(i.nombre, ' (', 
           CASE WHEN pi.es_base THEN 'incluido' ELSE 'extra +$', i.precio_adicional END, 
           ')')) as ingredientes
FROM appKiosko_Productos p
LEFT JOIN appKiosko_Productos_Ingredientes pi ON p.id = pi.producto_id
LEFT JOIN appKiosko_Ingredientes i ON pi.ingrediente_id = i.id
WHERE p.id = 1
GROUP BY p.id;

-- Ingredientes base del producto
SELECT i.*, pi.es_base, pi.permite_extra
FROM appKiosko_Ingredientes i
INNER JOIN appKiosko_Productos_Ingredientes pi ON i.id = pi.ingrediente_id
WHERE pi.producto_id = 1;
```

### **4️⃣ PERSONALIZACIÓN Y CARRITO**
```sql
-- Cliente personaliza: quita lechuga, agrega queso extra
-- (Se guarda temporalmente en el frontend hasta confirmar pedido)

-- Datos del carrito temporal:
-- Producto: Hamburguesa Clásica - $8.99
-- Modificaciones: 
--   - Quitar lechuga (precio: $0.00)
--   - Agregar queso extra (precio: +$1.50)
-- Total item: $10.49
```

### **5️⃣ CREACIÓN DEL PEDIDO**
```sql
-- Cliente confirma compra - se crea el pedido
INSERT INTO appKiosko_Pedidos (
    invoice_number,
    tipo_entrega,
    total,
    numero_mesa,
    cliente_id,
    valor_descuento,
    tipo_pago_id,
    fecha_pago,
    estado_id
) VALUES (
    'INV-2025-001234',
    'mesa',
    10.49,
    5,
    NULL, -- cliente anónimo
    0.00,
    1, -- efectivo
    NOW(),
    1  -- estado: en preparación
);

-- Obtener ID del pedido recién creado
SET @pedido_id = LAST_INSERT_ID();
```

### **6️⃣ DETALLES DEL PEDIDO**
```sql
-- Agregar producto al detalle del pedido
INSERT INTO appKiosko_DetallePedido (
    pedido_id,
    producto_id,
    menu_id,
    cantidad,
    precio_unitario,
    subtotal
) VALUES (
    @pedido_id,
    1, -- hamburguesa clásica
    NULL,
    1,
    8.99,
    8.99
);

-- Registrar personalizaciones del cliente
INSERT INTO appKiosko_Pedido_Producto_Ingredientes (
    pedido_id,
    producto_id,
    ingrediente_id,
    accion,
    precio_aplicado
) VALUES 
(@pedido_id, 1, 6, 'quitar', 0.00), -- quitar lechuga
(@pedido_id, 1, 4, 'extra', 1.50);  -- queso extra
```

### **7️⃣ ACTUALIZAR SESIÓN Y FINALIZAR**
```sql
-- Vincular pedido con la sesión del kiosko
UPDATE appKiosko_PedidoSessions 
SET pedido_id = @pedido_id,
    fecha_fin_pedido = NOW()
WHERE id = @session_id;

-- Enviar pedido a pantalla de cocina
-- (Mediante WebSocket o polling desde el frontend de cocina)
```

### **8️⃣ FLUJO EN COCINA** 
```sql
-- Cocina ve pedidos pendientes
SELECT p.*, 
       p.numero_mesa,
       p.invoice_number,
       GROUP_CONCAT(
           CONCAT(pr.nombre, ' x', dp.cantidad, 
                  CASE WHEN ppi.accion IS NOT NULL 
                       THEN CONCAT(' (', ppi.accion, ' ', i.nombre, ')') 
                       ELSE '' END)
       ) as items_pedido
FROM appKiosko_Pedidos p
INNER JOIN appKiosko_DetallePedido dp ON p.id = dp.pedido_id
INNER JOIN appKiosko_Productos pr ON dp.producto_id = pr.id
LEFT JOIN appKiosko_Pedido_Producto_Ingredientes ppi ON p.id = ppi.pedido_id AND pr.id = ppi.producto_id
LEFT JOIN appKiosko_Ingredientes i ON ppi.ingrediente_id = i.id
INNER JOIN appKiosko_Estados e ON p.estado_id = e.id
WHERE e.nombre = 'En Preparación'
GROUP BY p.id
ORDER BY p.created_at;
```

---

## 📦 **Flujo de Registro de Productos**

### **1️⃣ CREAR CATEGORÍA (si no existe)**
```sql
-- Administrador crea categoría "Hamburguesas"
INSERT INTO appKiosko_Categorias (nombre) 
VALUES ('Hamburguesas');

SET @categoria_id = LAST_INSERT_ID();
```

### **2️⃣ CREAR ESTADO ACTIVO (si no existe)**
```sql
-- Verificar que existe estado activo
SELECT id FROM appKiosko_Estados 
WHERE nombre = 'Activo' AND is_active = TRUE;

-- Si no existe, crearlo
INSERT INTO appKiosko_Estados (nombre, is_active, is_eliminated, is_inactive) 
VALUES ('Activo', TRUE, FALSE, FALSE);
```

### **3️⃣ REGISTRAR PRODUCTO BASE**
```sql
-- Crear producto "Hamburguesa BBQ Deluxe"
INSERT INTO appKiosko_Productos (
    nombre,
    descripcion,
    precio,
    categoria_id,
    estado_id
) VALUES (
    'Hamburguesa BBQ Deluxe',
    'Jugosa hamburguesa con carne de res, queso cheddar, cebolla caramelizada, lechuga, tomate y salsa BBQ especial. Servida con papas fritas.',
    12.99,
    @categoria_id,
    1  -- estado activo
);

SET @producto_id = LAST_INSERT_ID();
```

### **4️⃣ REGISTRAR INGREDIENTES**
```sql
-- Crear ingredientes base (si no existen)
INSERT INTO appKiosko_Ingredientes (nombre, precio_adicional, estado_id) VALUES
('Pan de hamburguesa premium', 0.00, 1),
('Carne de res 150gr', 0.00, 1),
('Queso cheddar', 0.00, 1),
('Lechuga iceberg', 0.00, 1),
('Tomate fresco', 0.00, 1),
('Cebolla caramelizada', 0.00, 1),
('Salsa BBQ casera', 0.00, 1),
('Pepinillos', 1.00, 1), -- ingrediente extra
('Bacon ahumado', 2.50, 1), -- ingrediente extra
('Carne extra', 3.00, 1); -- ingrediente extra
```

### **5️⃣ ASOCIAR INGREDIENTES AL PRODUCTO**
```sql
-- Ingredientes base (vienen incluidos)
INSERT INTO appKiosko_Productos_Ingredientes (
    producto_id, 
    ingrediente_id, 
    es_base, 
    permite_extra
) VALUES
(@producto_id, 1, TRUE, FALSE), -- pan (base, no permite extra)
(@producto_id, 2, TRUE, TRUE),  -- carne (base, permite extra)
(@producto_id, 3, TRUE, FALSE), -- queso (base, no permite extra)
(@producto_id, 4, TRUE, FALSE), -- lechuga (base, no permite extra)
(@producto_id, 5, TRUE, FALSE), -- tomate (base, no permite extra)
(@producto_id, 6, TRUE, FALSE), -- cebolla (base, no permite extra)
(@producto_id, 7, TRUE, FALSE); -- salsa BBQ (base, no permite extra)

-- Ingredientes solo como extras
INSERT INTO appKiosko_Productos_Ingredientes (
    producto_id, 
    ingrediente_id, 
    es_base, 
    permite_extra
) VALUES
(@producto_id, 8, FALSE, FALSE), -- pepinillos (solo extra)
(@producto_id, 9, FALSE, FALSE), -- bacon (solo extra)
(@producto_id, 10, FALSE, FALSE); -- carne extra (solo extra)
```

### **6️⃣ SUBIR IMÁGENES DEL PRODUCTO**
```sql
-- Registrar imagen principal del producto
INSERT INTO appKiosko_Imagen (
    nombre,
    ruta,
    categoria_imagen,
    entidad_relacionada_id
) VALUES (
    'hamburguesa_bbq_deluxe_principal.jpg',
    '/media/productos/hamburguesa_bbq_deluxe_principal.jpg',
    'producto',
    @producto_id
);

-- Registrar imágenes adicionales
INSERT INTO appKiosko_Imagen (
    nombre,
    ruta,
    categoria_imagen,
    entidad_relacionada_id
) VALUES 
('hamburguesa_bbq_deluxe_detalle1.jpg', '/media/productos/hamburguesa_bbq_deluxe_detalle1.jpg', 'producto', @producto_id),
('hamburguesa_bbq_deluxe_detalle2.jpg', '/media/productos/hamburguesa_bbq_deluxe_detalle2.jpg', 'producto', @producto_id);
```

### **7️⃣ CREAR MENÚ CON EL PRODUCTO (opcional)**
```sql
-- Crear menú "Combo BBQ Deluxe"
INSERT INTO appKiosko_Menus (
    nombre,
    descripcion,
    precio,
    tipo_menu,
    estado_id
) VALUES (
    'Combo BBQ Deluxe',
    'Hamburguesa BBQ Deluxe + Papas fritas grandes + Gaseosa 500ml',
    15.99,
    'combo',
    1
);

SET @menu_id = LAST_INSERT_ID();

-- Asociar productos al menú
INSERT INTO appKiosko_MenuProductos (
    producto_id,
    menu_id,
    cantidad
) VALUES 
(@producto_id, @menu_id, 1), -- 1 hamburguesa BBQ
(25, @menu_id, 1), -- 1 papas grandes (asumiendo ID 25)
(30, @menu_id, 1); -- 1 gaseosa (asumiendo ID 30)
```

### **8️⃣ VALIDACIÓN Y TESTING**
```sql
-- Verificar que el producto quedó bien configurado
SELECT 
    p.nombre as producto,
    p.precio,
    c.nombre as categoria,
    e.nombre as estado,
    COUNT(pi.ingrediente_id) as total_ingredientes,
    COUNT(img.id) as total_imagenes
FROM appKiosko_Productos p
INNER JOIN appKiosko_Categorias c ON p.categoria_id = c.id
INNER JOIN appKiosko_Estados e ON p.estado_id = e.id
LEFT JOIN appKiosko_Productos_Ingredientes pi ON p.id = pi.producto_id
LEFT JOIN appKiosko_Imagen img ON p.id = img.entidad_relacionada_id AND img.categoria_imagen = 'producto'
WHERE p.id = @producto_id
GROUP BY p.id;

-- Ver detalle de ingredientes del producto
SELECT 
    i.nombre as ingrediente,
    i.precio_adicional,
    pi.es_base,
    pi.permite_extra,
    CASE 
        WHEN pi.es_base = TRUE THEN 'Incluido'
        ELSE 'Solo extra'
    END as tipo
FROM appKiosko_Ingredientes i
INNER JOIN appKiosko_Productos_Ingredientes pi ON i.id = pi.ingrediente_id
WHERE pi.producto_id = @producto_id
ORDER BY pi.es_base DESC, i.nombre;
```

---

## 🔍 **Análisis Profundo de Integridad**

### **🎯 Validaciones críticas del flujo:**

#### **1. Reglas de Negocio Implementadas**
- ✅ **Personalización de ingredientes:** Cliente puede quitar todos excepto 1
- ✅ **Precios dinámicos:** Ingredientes extra se calculan correctamente
- ✅ **Soft deletes:** Estados permiten ocultar en lugar de eliminar
- ✅ **Trazabilidad completa:** Cada pedido tiene su sesión de kiosko
- ✅ **Multimedia centralizada:** Imágenes y videos en tablas especializadas

#### **2. Integridad Referencial**
```sql
-- Ejemplos de constraints importantes:
FOREIGN KEY (cliente_id) REFERENCES appKiosko_clientes(id) ON DELETE SET NULL
FOREIGN KEY (pedido_id) REFERENCES appKiosko_Pedidos(id) ON DELETE CASCADE
UNIQUE KEY unique_empleado_establecimiento_activo (establecimiento_id, empleado_id, fecha_inicio_trabajo)
```

#### **3. Validaciones a Nivel de Aplicación (Django)**
```python
# Validación personalización de ingredientes
def validar_personalizacion_producto(producto_id, ingredientes_quitar):
    ingredientes_base = ProductosIngredientes.objects.filter(
        producto_id=producto_id, 
        es_base=True
    ).count()
    
    if len(ingredientes_quitar) >= ingredientes_base:
        raise ValidationError("Debe mantener al menos 1 ingrediente en el producto")
    
    return True

# Validación horarios de negocio
def validar_horario_pedido():
    now = timezone.now().time()
    if not (time(6, 0) <= now <= time(23, 0)):
        raise ValidationError("Pedidos solo permitidos de 6:00 AM a 11:00 PM")
```

### **🚨 Áreas que necesitan atención:**

#### **1. Gestión de Stock/Inventario**
- ❌ **Falta:** Control de inventario de ingredientes
- ❌ **Falta:** Validación de disponibilidad en tiempo real
- 💡 **Sugerencia:** Agregar tabla `appKiosko_Stock` para inventario

#### **2. Estados de Pedido más Granulares**
```sql
-- Estados sugeridos para pedidos:
INSERT INTO appKiosko_Estados (nombre) VALUES 
('Recibido'),           -- Pedido creado
('En Cola'),            -- Esperando preparación  
('En Preparación'),     -- Cocinando
('Listo'),              -- Terminado, esperando entrega
('Entregado'),          -- Cliente recibió pedido
('Cancelado');          -- Pedido cancelado
```

#### **3. Validaciones de Horarios**
```sql
-- Agregar campos útiles a productos
ALTER TABLE appKiosko_Productos 
ADD COLUMN tiempo_preparacion INT DEFAULT 10,
ADD COLUMN disponible_desde TIME DEFAULT '06:00:00',
ADD COLUMN disponible_hasta TIME DEFAULT '23:00:00';
```

---

## 🚀 **Sugerencias de Mejora**

### **📊 1. Métricas y Analytics**
```sql
-- Tabla para tracking de analytics
CREATE TABLE IF NOT EXISTS appKiosko_Analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    evento VARCHAR(50) NOT NULL,
    kiosko_touch_id INT,
    producto_id INT,
    metadata JSON,
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kiosko_touch_id) REFERENCES appKiosko_KioskosTouch(id),
    FOREIGN KEY (producto_id) REFERENCES appKiosko_Productos(id)
);
```

### **📱 2. Notificaciones Push**
```sql
-- Tabla para gestionar notificaciones
CREATE TABLE IF NOT EXISTS appKiosko_Notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    pedido_id INT,
    enviado BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES appKiosko_Pedidos(id)
);
```

### **🔧 3. Configuraciones Dinámicas**
```sql
-- Tabla para configuraciones del sistema
CREATE TABLE IF NOT EXISTS appKiosko_Configuraciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    establecimiento_id INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (establecimiento_id) REFERENCES appKiosko_Establecimientos(id)
);

-- Configuraciones ejemplo
INSERT INTO appKiosko_Configuraciones (clave, valor, descripcion, tipo) VALUES
('horario_apertura', '06:00', 'Hora de apertura del establecimiento', 'string'),
('horario_cierre', '23:00', 'Hora de cierre del establecimiento', 'string'),
('tiempo_inactividad_kiosko', '300', 'Segundos antes de resetear kiosko por inactividad', 'integer'),
('permitir_pedidos_anonimos', 'true', 'Permitir pedidos sin registro de cliente', 'boolean');
```

### **💳 4. Integración con Pasarelas de Pago**
```sql
-- Tabla para transacciones de pago
CREATE TABLE IF NOT EXISTS appKiosko_TransaccionesPago (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'qr') NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    estado_transaccion ENUM('pendiente', 'aprobada', 'rechazada', 'reembolsada') NOT NULL,
    referencia_externa VARCHAR(100),
    datos_respuesta JSON,
    fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES appKiosko_Pedidos(id)
);
```

### **📈 5. Queries de Reportes Útiles**
```sql
-- Productos más vendidos
SELECT p.nombre, COUNT(dp.id) as veces_vendido, SUM(dp.subtotal) as ingresos_total
FROM appKiosko_Productos p
INNER JOIN appKiosko_DetallePedido dp ON p.id = dp.producto_id
INNER JOIN appKiosko_Pedidos ped ON dp.pedido_id = ped.id
WHERE ped.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.id
ORDER BY veces_vendido DESC
LIMIT 10;

-- Ingredientes más quitados
SELECT i.nombre, COUNT(ppi.id) as veces_quitado
FROM appKiosko_Ingredientes i
INNER JOIN appKiosko_Pedido_Producto_Ingredientes ppi ON i.id = ppi.ingrediente_id
WHERE ppi.accion = 'quitar'
AND ppi.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY i.id
ORDER BY veces_quitado DESC;

-- Ventas por hora
SELECT 
    HOUR(created_at) as hora,
    COUNT(*) as cantidad_pedidos,
    SUM(total) as ingresos
FROM appKiosko_Pedidos
WHERE DATE(created_at) = CURDATE()
GROUP BY HOUR(created_at)
ORDER BY hora;
```

---

## 🎯 **Conclusiones**

### **✅ Fortalezas del Diseño Actual**
1. **Arquitectura sólida** con separación clara de responsabilidades
2. **Flexibilidad en personalización** de productos e ingredientes
3. **Trazabilidad completa** del flujo de pedidos
4. **Multimedia centralizada** para fácil gestión
5. **Soft deletes** implementados correctamente
6. **Soporte completo** para menús y promociones

### **🔄 Áreas de Mejora Prioritarias**
1. **Gestión de inventario** para ingredientes
2. **Estados de pedido más granulares** para mejor tracking
3. **Validaciones de horarios** de operación
4. **Sistema de notificaciones** para cocina y clientes
5. **Analytics y reportes** para toma de decisiones

### **🚀 Tecnologías Recomendadas para Implementación**
- **WebSockets:** Para actualizaciones en tiempo real (Django Channels)
- **Redis:** Para caché y sessions temporales
- **Celery:** Para tareas asíncronas (envío de notificaciones)
- **Docker:** Para containerización y deploy
- **Nginx:** Para servir archivos estáticos y balanceo

---

**📝 Documento generado el:** `29 de Mayo, 2025`  
**🔄 Última actualización:** `v2.1.0`  
**👨‍💻 Revisado por:** GitHub Copilot