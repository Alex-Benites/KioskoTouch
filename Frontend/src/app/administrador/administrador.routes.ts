import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { RestablecerContrasenaComponent } from './restablecer-contrasena/restablecer-contrasena.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { CrearUsuarioComponent } from './usuarios/crear-usuario/crear-usuario.component';
import { EditarEliminarUsuarioComponent } from './usuarios/editar-eliminar-usuario/editar-eliminar-usuario.component';
import { CrearRolComponent } from './usuarios/crear-rol/crear-rol.component';
import { EditarEliminarRolComponent } from './usuarios/editar-eliminar-rol/editar-eliminar-rol.component';
import { ProductosComponent } from './productos/productos.component';
import { CrearComponent } from './productos/crear/crear.component';
import { EditarComponent } from './productos/editar/editar.component';
import { EliminarComponent } from './productos/eliminar/eliminar.component';
import { MenusComponent } from './menus/menus.component';
import { CrearMenuComponent } from './menus/crear-menu/crear-menu.component';
import { EditarEliminarMenuComponent } from './menus/editar-eliminar-menu/editar-eliminar-menu.component';
import { PromocionesComponent } from './promociones/promociones.component';
import { CrearPromocionComponent } from './promociones/crear-promocion/crear-promocion.component';
import { EditarEliminarPromocionComponent } from './promociones/editar-eliminar-promocion/editar-eliminar-promocion.component';
import { EstadisticasPromocionComponent } from './promociones/estadisticas-promocion/estadisticas-promocion.component';
import { PantallasCocinaComponent } from './pantallas-cocina/pantallas-cocina.component';
import { CrearPantallaCocinaComponent } from './pantallas-cocina/crear-pantalla-cocina/crear-pantalla-cocina.component';
import { EditarEliminarPantallaCocinaComponent } from './pantallas-cocina/editar-eliminar-pantalla-cocina/editar-eliminar-pantalla-cocina.component';
import { EstablecimientosComponent } from './establecimientos/establecimientos.component';
import { CrearEstablecimientoComponent } from './establecimientos/crear-establecimiento/crear-establecimiento.component'; // Agregar
import { EditarEliminarEstablecimientoComponent } from './establecimientos/editar-eliminar-establecimiento/editar-eliminar-establecimiento.component'; // Agregar
import { PublicidadComponent } from './publicidad/publicidad.component';
import { KioskoTouchComponent } from './kiosko-touch/kiosko-touch.component';
import { CrearKioskoTouchComponent } from './kiosko-touch/crear-kiosko-touch/crear-kiosko-touch.component'; // Agregar
import { EditarEliminarKioskoTouchComponent } from './kiosko-touch/editar-eliminar-kiosko-touch/editar-eliminar-kiosko-touch.component'; // Agregar
import { UnauthorizedComponent } from '../shared/unauthorized/unauthorized.component';
import { loginGuard } from '../guards/login.guard';
import { authGuard } from '../guards/auth.guard';
import { permissionGuard } from '../guards/permission.guard';
import { IngredientesComponent } from './ingredientes/ingredientes.component';
import { CrearIngredienteComponent } from './ingredientes/crear-ingrediente/crear-ingrediente.component';
import { EditarEliminarIngredienteComponent } from './ingredientes/editar-eliminar-ingrediente/editar-eliminar-ingrediente.component';
import { CrearPublicidadComponent } from './publicidad/crear-publicidad/crear-publicidad.component';
import { EditarEliminarPublicidadComponent } from './publicidad/editar-eliminar-publicidad/editar-eliminar-publicidad.component';

export const administradorRoutes: Routes = [
  // 🔓 Rutas públicas (sin autenticación)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard] // Previene acceso si ya está autenticado
  },
  {
    path: 'restablecer-contrasena',
    component: RestablecerContrasenaComponent
  },

  // 🔐 Rutas protegidas (requieren autenticación)
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard]
  },

  // 👥 Gestión de usuarios - Permisos: auth.user
  {
    path: 'gestion-usuarios',
    component: UsuariosComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_user'])]
  },
  {
    path: 'gestion-usuarios/crear-usuario',
    component: CrearUsuarioComponent,
    canActivate: [authGuard, permissionGuard(['auth.add_user'])]
  },
  {
  path: 'gestion-usuarios/crear-usuario/:id',
  component: CrearUsuarioComponent,
  canActivate: [authGuard, permissionGuard(['auth.change_user'])]
  },
  {
    path: 'gestion-usuarios/editar-eliminar-usuario',
    component: EditarEliminarUsuarioComponent,
    canActivate: [authGuard, permissionGuard(['auth.change_user', 'auth.delete_user'])]
  },

  // 🔐 Gestión de roles/grupos - Permisos: auth.group
  {
    path: 'gestion-usuarios/crear-rol',
    component: CrearRolComponent,
    canActivate: [authGuard, permissionGuard(['auth.add_group'])]
  },
  {
    path: 'gestion-usuarios/crear-rol/:id',
    component: CrearRolComponent,
    canActivate: [authGuard, permissionGuard(['auth.change_group'])]
  },
  {
    path: 'gestion-usuarios/editar-eliminar-rol',
    component: EditarEliminarRolComponent,
    canActivate: [authGuard, permissionGuard(['auth.change_group', 'auth.delete_group'])]
  },

  // 🍔 Gestión de productos - Permisos: catalogo.appkioskoproductos
  {
    path: 'gestion-productos',
    component: ProductosComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoproductos'])]
  },
  {
    path: 'gestion-productos/crear',
    component: CrearComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.add_appkioskoproductos'])]
  },
  {
    path: 'gestion-productos/editar',
    component: EditarComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.change_appkioskoproductos'])]
  },
  {
    path: 'gestion-productos/crear/:id',
    component: CrearComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.change_appkioskoproductos'])]
  },
  {
    path: 'gestion-productos/eliminar',
    component: EliminarComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.delete_appkioskoproductos'])]
  },

  // 🥬 Gestión de ingredientes - Permisos: catalogo.appkioskoingredientes
  {
    path: 'gestion-ingredientes',
    component: IngredientesComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoingredientes'])]
  },
  {
    path: 'gestion-ingredientes/crear',
    component: CrearIngredienteComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.add_appkioskoingredientes'])]
  },
  {
    path: 'gestion-ingredientes/editar-eliminar',
    component: EditarEliminarIngredienteComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.change_appkioskoingredientes', 'catalogo.delete_appkioskoingredientes'])]
  },

  // 📋 Gestión de menús - Permisos: catalogo.appkioskomenus
  {
    path: 'gestion-menus',
    component: MenusComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskomenus'])]
  },
  {
    path: 'gestion-menus/crear',
    component: CrearMenuComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.add_appkioskomenus'])]
  },
  {
    path: 'gestion-menus/crear/:id',
    component: CrearMenuComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.change_appkioskomenus'])]
  },
  {
    path: 'gestion-menus/editar-eliminar',
    component: EditarEliminarMenuComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.change_appkioskomenus', 'catalogo.delete_appkioskomenus'])]
  },

  // 🎉 Gestión de promociones - Permisos: marketing.appkioskopromociones
  {
    path: 'gestion-promociones',
    component: PromocionesComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones'])]
  },
  {
    path: 'gestion-promociones/crear',
    component: CrearPromocionComponent,
    canActivate: [authGuard, permissionGuard(['marketing.add_appkioskopromociones'])]
  },
  {
    path: 'gestion-promociones/editar-eliminar',
    component: EditarEliminarPromocionComponent,
    canActivate: [authGuard, permissionGuard(['marketing.change_appkioskopromociones', 'marketing.delete_appkioskopromociones'])]
  },
  {
    path: 'gestion-promociones/estadisticas',
    component: EstadisticasPromocionComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones'])]
  },

  // 👨‍🍳 Gestión de pantallas de cocina - Permisos: establecimientos.appkioskopantallascocina
  {
    path: 'gestion-pantallas-cocina',
    component: PantallasCocinaComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskopantallascocina'])]
  },
  {
    path: 'gestion-pantallas-cocina/crear',
    component: CrearPantallaCocinaComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.add_appkioskopantallascocina'])]
  },
  {
    path: 'gestion-pantallas-cocina/editar-eliminar',
    component: EditarEliminarPantallaCocinaComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.change_appkioskopantallascocina', 'establecimientos.delete_appkioskopantallascocina'])]
  },

  // 🏢 Gestión de establecimientos - Permisos: establecimientos.appkioskoestablecimientos
  {
    path: 'gestion-establecimientos',
    component: EstablecimientosComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskoestablecimientos'])]
  },
  {
    path: 'gestion-establecimientos/crear',
    component: CrearEstablecimientoComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.add_appkioskoestablecimientos'])]
  },
  {
    path: 'gestion-establecimientos/editar-eliminar',
    component: EditarEliminarEstablecimientoComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.change_appkioskoestablecimientos', 'establecimientos.delete_appkioskoestablecimientos'])]
  },

  // 📺 Gestión de publicidad - Permisos: marketing.appkioskopublicidades
  {
    path: 'gestion-publicidad',
    component: PublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopublicidades'])]
  },
  {
    path: 'gestion-publicidad/crear',
    component: CrearPublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.add_appkioskopublicidades'])]
  },

  {
    path: 'gestion-publicidad/editar-eliminar',
    component: EditarEliminarPublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.change_appkioskopublicidades', 'marketing.delete_appkioskopublicidades'])]
  },
  {
    path: 'gestion-publicidad/crear/:id',
    component: CrearPublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.change_appkioskopublicidades'])]
  },
  // 🖥️ Gestión de kiosko touch - Permisos: establecimientos.appkioskokioskostouch
  {
    path: 'gestion-kiosko-touch',
    component: KioskoTouchComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskokioskostouch'])]
  },
  {
    path: 'gestion-kiosko-touch/crear',
    component: CrearKioskoTouchComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.add_appkioskokioskostouch'])]
  },
  {
    path: 'gestion-kiosko-touch/editar-eliminar',
    component: EditarEliminarKioskoTouchComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.change_appkioskokioskostouch', 'establecimientos.delete_appkioskokioskostouch'])]
  },

  // 🚫 Página de acceso no autorizado
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
];
