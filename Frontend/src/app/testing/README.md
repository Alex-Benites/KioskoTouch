# Tests de Integración

Esta carpeta contiene tests de integración para la aplicación KioskoTouch. Los tests de integración verifican que diferentes partes de la aplicación funcionan correctamente juntas.

## Estructura de Archivos

- `pedido-flow.integration.spec.ts` - Test de flujo de pedido completo (menú → carrito → resumen)
- `admin-navigation.integration.spec.ts` - Test de navegación del módulo administrador
- `service-integration.integration.spec.ts` - Test de integración de servicios
- `auth-permission.integration.spec.ts` - Test de integración de autenticación y permisos (original)

## Cómo Ejecutar los Tests

Para ejecutar los tests de integración, usa el siguiente comando:

```bash
npm test -- --include="src/app/testing/**/*.spec.ts"
```

## Tests Disponibles

### 1. Flujo de Pedido Completo (`pedido-flow.integration.spec.ts`)
Verifica el flujo completo de un cliente:
- Navegación entre menú, carrito y resumen
- Gestión del carrito de compras
- Cálculo de totales
- Manejo de productos y menús

### 2. Navegación Administrador (`admin-navigation.integration.spec.ts`)
Verifica la navegación en el módulo administrador:
- Navegación entre diferentes secciones
- Volver al home desde diferentes páginas
- Manejo de rutas protegidas

### 3. Integración de Servicios (`service-integration.integration.spec.ts`)
Verifica que los servicios funcionan correctamente:
- AuthService (login/logout)
- PedidoService (gestión del carrito)
- Consistencia entre servicios

### 4. Autenticación y Permisos (`auth-permission.integration.spec.ts`)
Test original que verifica:
- Guards de autenticación
- Guards de permisos
- Interceptor de autenticación
- Manejo de errores HTTP

## Mejoras Implementadas

### Correcciones en `auth-permission.integration.spec.ts`:
1. **Removido `RouterModule`** - No es necesario para rutas standalone
2. **Agregado `standalone: true`** al componente dummy
3. **Simplificada configuración del router**
4. **Agregados tests adicionales** para el interceptor

## Próximos Tests a Implementar

- Test de integración con base de datos
- Test de integración con API externa
- Test de integración de pagos
- Test de integración de notificaciones

## Consideraciones

- Los tests de integración son más lentos que los unitarios
- Usan mocks para servicios externos
- Verifican flujos de usuario completos
- Ayudan a detectar problemas de integración temprano