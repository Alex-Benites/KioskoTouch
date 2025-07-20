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

// 🏷️ Componentes de categorías
import { GestionCategoriasComponent } from './gestion-categorias/gestion-categorias.component';
import { CrearCategoriaComponent } from './gestion-categorias/crear-categoria/crear-categoria.component';
import { PerfilUsuarioComponent } from './perfil-usuario/perfil-usuario.component';

// ✅ AGREGAR: Componente de IVA
import { GestionIvaComponent } from './gestion-iva/gestion-iva.component';
import { WelcomeComponent } from './welcome/welcome.component';

export const administradorRoutes: Routes = [
  // 🔓 Rutas públicas
  {
    path: 'welcome',
    component: WelcomeComponent
  },
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

  // 👥 GESTIÓN DE USUARIOS
  {
    path: 'gestion-usuarios',
    component: UsuariosComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_user'])]
  },
  {
    path: 'gestion-usuarios/crear-usuario',
    component: CrearUsuarioComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_user', 'auth.add_user'])] // VER + CREAR
  },
  {
    path: 'gestion-usuarios/crear-usuario/:id',
    component: CrearUsuarioComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_user', 'auth.change_user'])] // VER + MODIFICAR
  },
  {
    path: 'gestion-usuarios/editar-eliminar-usuario',
    component: EditarEliminarUsuarioComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_user'])] // Solo VER (decide internamente)
  },

  // 🔐 GESTIÓN DE ROLES
  {
    path: 'gestion-usuarios/crear-rol',
    component: CrearRolComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_group', 'auth.add_group'])] // VER + CREAR
  },
  {
    path: 'gestion-usuarios/crear-rol/:id',
    component: CrearRolComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_group', 'auth.change_group'])] // VER + MODIFICAR
  },
  {
    path: 'gestion-usuarios/editar-eliminar-rol',
    component: EditarEliminarRolComponent,
    canActivate: [authGuard, permissionGuard(['auth.view_group'])] // Solo VER (decide internamente)
  },

  // 🍔 GESTIÓN DE PRODUCTOS
  {
    path: 'gestion-productos',
    component: ProductosComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoproductos'])]
  },
  {
    path: 'gestion-productos/crear',
    component: CrearComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoproductos', 'catalogo.add_appkioskoproductos'])] // VER + CREAR
  },
  {
    path: 'gestion-productos/editar',
    component: EditarComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoproductos'])] // Solo VER (decide internamente)
  },
  {
    path: 'gestion-productos/crear/:id',
    component: CrearComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoproductos', 'catalogo.change_appkioskoproductos'])] // VER + MODIFICAR
  },
  {
    path: 'gestion-productos/eliminar',
    component: EliminarComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoproductos'])] // Solo VER (decide internamente)
  },

  // 🥬 GESTIÓN DE INGREDIENTES
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
    path: 'gestion-ingredientes/crear/:id',
    component: CrearIngredienteComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskoingredientes'])]
  },

  // 🍽️ GESTIÓN DE MENÚS
  {
    path: 'gestion-menus',
    component: MenusComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskomenus'])]
  },
  {
    path: 'gestion-menus/crear',
    component: CrearMenuComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskomenus', 'catalogo.add_appkioskomenus'])] // VER + CREAR
  },
  {
    path: 'gestion-menus/crear/:id',
    component: CrearMenuComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskomenus', 'catalogo.change_appkioskomenus'])] // VER + MODIFICAR
  },
  {
    path: 'gestion-menus/editar-eliminar',
    component: EditarEliminarMenuComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskomenus'])] // Solo VER (decide internamente)
  },

  // 🎯 GESTIÓN DE PROMOCIONES
  {
    path: 'gestion-promociones',
    component: PromocionesComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones'])]
  },
  {
    path: 'gestion-promociones/crear',
    component: CrearPromocionComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones', 'marketing.add_appkioskopromociones'])] // VER + CREAR
  },
  {
    path: 'gestion-promociones/crear/:id',
    component: CrearPromocionComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones', 'marketing.change_appkioskopromociones'])] // VER + MODIFICAR
  },
  {
    path: 'gestion-promociones/editar-eliminar',
    component: EditarEliminarPromocionComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones'])] // Solo VER (decide internamente)
  },
  {
    path: 'gestion-promociones/estadisticas',
    component: EstadisticasPromocionComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopromociones'])] // Solo VER
  },

  // 🍳 GESTIÓN DE PANTALLAS COCINA
  {
    path: 'gestion-pantallas-cocina',
    component: PantallasCocinaComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskopantallascocina'])]
  },
  {
    path: 'gestion-pantallas-cocina/crear',
    component: CrearPantallaCocinaComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskopantallascocina', 'establecimientos.add_appkioskopantallascocina'])] // VER + CREAR
  },
  {
    path: 'gestion-pantallas-cocina/crear/:id',
    component: CrearPantallaCocinaComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskopantallascocina', 'establecimientos.change_appkioskopantallascocina'])] // VER + MODIFICAR
  },
  {
    path: 'gestion-pantallas-cocina/editar-eliminar',
    component: EditarEliminarPantallaCocinaComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskopantallascocina'])] // Solo VER (decide internamente)
  },

  // 🏢 GESTIÓN DE ESTABLECIMIENTOS
  {
    path: 'gestion-establecimientos',
    component: EstablecimientosComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskoestablecimientos'])]
  },
  {
    path: 'gestion-establecimientos/crear',
    component: CrearEstablecimientoComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskoestablecimientos', 'establecimientos.add_appkioskoestablecimientos'])] // VER + CREAR
  },
  {
    path: 'gestion-establecimientos/crear/:id',
    component: CrearEstablecimientoComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskoestablecimientos', 'establecimientos.change_appkioskoestablecimientos'])] // VER + MODIFICAR
  },
  {
    path: 'gestion-establecimientos/editar-eliminar',
    component: EditarEliminarEstablecimientoComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskoestablecimientos'])] // Solo VER (decide internamente)
  },

  // 📺 GESTIÓN DE PUBLICIDAD
  {
    path: 'gestion-publicidad',
    component: PublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopublicidades'])]
  },
  {
    path: 'gestion-publicidad/crear',
    component: CrearPublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopublicidades', 'marketing.add_appkioskopublicidades'])] // VER + CREAR
  },
  {
    path: 'gestion-publicidad/editar-eliminar',
    component: EditarEliminarPublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopublicidades'])] // Solo VER (decide internamente)
  },
  {
    path: 'gestion-publicidad/crear/:id',
    component: CrearPublicidadComponent,
    canActivate: [authGuard, permissionGuard(['marketing.view_appkioskopublicidades', 'marketing.change_appkioskopublicidades'])] // VER + MODIFICAR
  },

  // 📱 GESTIÓN DE KIOSKO TOUCH
  {
    path: 'gestion-kiosko-touch',
    component: KioskoTouchComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskokioskostouch'])]
  },
  {
    path: 'gestion-kiosko-touch/crear',
    component: CrearKioskoTouchComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskokioskostouch', 'establecimientos.add_appkioskokioskostouch'])] // VER + CREAR
  },
  {
    path: 'gestion-kiosko-touch/crear/:id',
    component: CrearKioskoTouchComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskokioskostouch', 'establecimientos.change_appkioskokioskostouch'])] // VER + MODIFICAR
  },
  {
    path: 'gestion-kiosko-touch/editar-eliminar',
    component: EditarEliminarKioskoTouchComponent,
    canActivate: [authGuard, permissionGuard(['establecimientos.view_appkioskokioskostouch'])] // Solo VER (decide internamente)
  },
  {
    path: 'gestion-categorias',
    component: GestionCategoriasComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskocategorias'])]
  },
  {
    path: 'gestion-categorias/crear',
    component: CrearCategoriaComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskocategorias'])]
  },
  {
    path: 'gestion-categorias/crear/:id',
    component: CrearCategoriaComponent,
    canActivate: [authGuard, permissionGuard(['catalogo.view_appkioskocategorias'])]
  },

  // ✅ AGREGAR: GESTIÓN DE IVA
  {
    path: 'gestion-iva',
    component: GestionIvaComponent,
    canActivate: [authGuard, permissionGuard(['comun.view_appkioskoiva'])]
  },

  {
    path: 'perfil',
    component: PerfilUsuarioComponent,
    canActivate: [authGuard]
  },

  // ❌ Página de no autorizado
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  }
];