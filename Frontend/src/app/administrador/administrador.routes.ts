import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth.guard';
import { loginGuard } from '../guards/login.guard';
import { permissionGuard } from '../guards/permission.guard';

// 🏠 Componentes básicos
import { LoginComponent } from './login/login.component';
import { RestablecerContrasenaComponent } from './restablecer-contrasena/restablecer-contrasena.component';
import { HomeComponent } from './home/home.component';
import { UnauthorizedComponent } from '../shared/unauthorized/unauthorized.component';

// 👥 Componentes de usuarios
import { UsuariosComponent } from './usuarios/usuarios.component';
import { CrearUsuarioComponent } from './usuarios/crear-usuario/crear-usuario.component';
import { EditarEliminarUsuarioComponent } from './usuarios/editar-eliminar-usuario/editar-eliminar-usuario.component';
import { CrearRolComponent } from './usuarios/crear-rol/crear-rol.component';
import { EditarEliminarRolComponent } from './usuarios/editar-eliminar-rol/editar-eliminar-rol.component';

// 🍔 Componentes de productos
import { ProductosComponent } from './productos/productos.component';
import { CrearComponent } from './productos/crear/crear.component';
import { EditarComponent } from './productos/editar/editar.component';
import { EliminarComponent } from './productos/eliminar/eliminar.component';

// 🥬 Componentes de ingredientes
import { IngredientesComponent } from './ingredientes/ingredientes.component';
import { CrearIngredienteComponent } from './ingredientes/crear-ingrediente/crear-ingrediente.component';
import { EditarEliminarIngredienteComponent } from './ingredientes/editar-eliminar-ingrediente/editar-eliminar-ingrediente.component';

// 🍽️ Componentes de menús
import { MenusComponent } from './menus/menus.component';
import { CrearMenuComponent } from './menus/crear-menu/crear-menu.component';
import { EditarEliminarMenuComponent } from './menus/editar-eliminar-menu/editar-eliminar-menu.component';

// 🎯 Componentes de promociones
import { PromocionesComponent } from './promociones/promociones.component';
import { CrearPromocionComponent } from './promociones/crear-promocion/crear-promocion.component';
import { EditarEliminarPromocionComponent } from './promociones/editar-eliminar-promocion/editar-eliminar-promocion.component';
import { EstadisticasPromocionComponent } from './promociones/estadisticas-promocion/estadisticas-promocion.component';

// 🍳 Componentes de pantallas cocina
import { PantallasCocinaComponent } from './pantallas-cocina/pantallas-cocina.component';
import { CrearPantallaCocinaComponent } from './pantallas-cocina/crear-pantalla-cocina/crear-pantalla-cocina.component';
import { EditarEliminarPantallaCocinaComponent } from './pantallas-cocina/editar-eliminar-pantalla-cocina/editar-eliminar-pantalla-cocina.component';

// 🏢 Componentes de establecimientos
import { EstablecimientosComponent } from './establecimientos/establecimientos.component';
import { CrearEstablecimientoComponent } from './establecimientos/crear-establecimiento/crear-establecimiento.component';
import { EditarEliminarEstablecimientoComponent } from './establecimientos/editar-eliminar-establecimiento/editar-eliminar-establecimiento.component';

// 📺 Componentes de publicidad
import { PublicidadComponent } from './publicidad/publicidad.component';
import { CrearPublicidadComponent } from './publicidad/crear-publicidad/crear-publicidad.component';
import { EditarEliminarPublicidadComponent } from './publicidad/editar-eliminar-publicidad/editar-eliminar-publicidad.component';

// 📱 Componentes de kiosko touch
import { KioskoTouchComponent } from './kiosko-touch/kiosko-touch.component';
import { CrearKioskoTouchComponent } from './kiosko-touch/crear-kiosko-touch/crear-kiosko-touch.component';
import { EditarEliminarKioskoTouchComponent } from './kiosko-touch/editar-eliminar-kiosko-touch/editar-eliminar-kiosko-touch.component';

export const administradorRoutes: Routes = [
  // 🔓 Rutas públicas
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard]
  },
  {
    path: 'restablecer-contrasena',
    component: RestablecerContrasenaComponent
  },

  // 🔐 Rutas protegidas básicas
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard]
  },

  // 👥 GESTIÓN DE USUARIOS - Solo validar VER
  {
    path: 'gestion-usuarios',
    component: UsuariosComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_user'])]
  },
  {
    path: 'gestion-usuarios/crear-usuario',
    component: CrearUsuarioComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_user'])]
  },
  {
    path: 'gestion-usuarios/crear-usuario/:id',
    component: CrearUsuarioComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_user'])]
  },
  {
    path: 'gestion-usuarios/editar-eliminar-usuario',
    component: EditarEliminarUsuarioComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_user'])]
  },

  // 🔐 GESTIÓN DE ROLES - Solo validar VER
  {
    path: 'gestion-usuarios/crear-rol',
    component: CrearRolComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_group'])]
  },
  {
    path: 'gestion-usuarios/crear-rol/:id',
    component: CrearRolComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_group'])]
  },
  {
    path: 'gestion-usuarios/editar-eliminar-rol',
    component: EditarEliminarRolComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_group'])]
  },

  // 🍔 GESTIÓN DE PRODUCTOS - Solo validar VER
  {
    path: 'gestion-productos',
    component: ProductosComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoproductos'])]
  },
  {
    path: 'gestion-productos/crear',
    component: CrearComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoproductos'])]
  },
  {
    path: 'gestion-productos/editar',
    component: EditarComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoproductos'])]
  },
  {
    path: 'gestion-productos/crear/:id',
    component: CrearComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoproductos'])]
  },
  {
    path: 'gestion-productos/eliminar',
    component: EliminarComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoproductos'])]
  },

  // 🥬 GESTIÓN DE INGREDIENTES - Solo validar VER
  {
    path: 'gestion-ingredientes',
    component: IngredientesComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoingredientes'])]
  },
  {
    path: 'gestion-ingredientes/crear',
    component: CrearIngredienteComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoingredientes'])]
  },
  {
    path: 'gestion-ingredientes/editar-eliminar',
    component: EditarEliminarIngredienteComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoingredientes'])]
  },

  // 🍽️ GESTIÓN DE MENÚS - Solo validar VER
  {
    path: 'gestion-menus',
    component: MenusComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskomenus'])]
  },
  {
    path: 'gestion-menus/crear',
    component: CrearMenuComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskomenus'])]
  },
  {
    path: 'gestion-menus/crear/:id',
    component: CrearMenuComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskomenus'])]
  },
  {
    path: 'gestion-menus/editar-eliminar',
    component: EditarEliminarMenuComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskomenus'])]
  },

  // 🎯 GESTIÓN DE PROMOCIONES - Solo validar VER
  {
    path: 'gestion-promociones',
    component: PromocionesComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones'])]
  },
  {
    path: 'gestion-promociones/crear',
    component: CrearPromocionComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones'])]
  },
  {
    path: 'gestion-promociones/crear/:id',
    component: CrearPromocionComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones'])]
  },
  {
    path: 'gestion-promociones/editar-eliminar',
    component: EditarEliminarPromocionComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones'])]
  },
  {
    path: 'gestion-promociones/estadisticas',
    component: EstadisticasPromocionComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones'])]
  },

  // 🍳 GESTIÓN DE PANTALLAS COCINA - Solo validar VER
  {
    path: 'gestion-pantallas-cocina',
    component: PantallasCocinaComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskopantallascocina'])]
  },
  {
    path: 'gestion-pantallas-cocina/crear',
    component: CrearPantallaCocinaComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskopantallascocina'])]
  },
  {
    path: 'gestion-pantallas-cocina/crear/:id',
    component: CrearPantallaCocinaComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskopantallascocina'])]
  },
  {
    path: 'gestion-pantallas-cocina/editar-eliminar',
    component: EditarEliminarPantallaCocinaComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskopantallascocina'])]
  },

  // 🏢 GESTIÓN DE ESTABLECIMIENTOS - Solo validar VER
  {
    path: 'gestion-establecimientos',
    component: EstablecimientosComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskoestablecimientos'])]
  },
  {
    path: 'gestion-establecimientos/crear',
    component: CrearEstablecimientoComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskoestablecimientos'])]
  },
  {
    path: 'gestion-establecimientos/crear/:id',
    component: CrearEstablecimientoComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskoestablecimientos'])]
  },
  {
    path: 'gestion-establecimientos/editar-eliminar',
    component: EditarEliminarEstablecimientoComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskoestablecimientos'])]
  },

  // 📺 GESTIÓN DE PUBLICIDAD - Solo validar VER
  {
    path: 'gestion-publicidad',
    component: PublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopublicidades'])]
  },
  {
    path: 'gestion-publicidad/crear',
    component: CrearPublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopublicidades'])]
  },
  {
    path: 'gestion-publicidad/editar-eliminar',
    component: EditarEliminarPublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopublicidades'])]
  },
  {
    path: 'gestion-publicidad/crear/:id',
    component: CrearPublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopublicidades'])]
  },

  // 📱 GESTIÓN DE KIOSKO TOUCH - Solo validar VER
  {
    path: 'gestion-kiosko-touch',
    component: KioskoTouchComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskokioskostouch'])]
  },
  {
    path: 'gestion-kiosko-touch/crear',
    component: CrearKioskoTouchComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskokioskostouch'])]
  },
  {
    path: 'gestion-kiosko-touch/crear/:id',
    component: CrearKioskoTouchComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskokioskostouch'])]
  },
  {
    path: 'gestion-kiosko-touch/editar-eliminar',
    component: EditarEliminarKioskoTouchComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskokioskostouch'])]
  },

  // ❌ Página de no autorizado
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  }
];