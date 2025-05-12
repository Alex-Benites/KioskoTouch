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
import { MenusComponent } from './menus/menus.component';
import { PromocionesComponent } from './promociones/promociones.component';
import { PantallasCocinaComponent } from './pantallas-cocina/pantallas-cocina.component';
import { EstablecimientosComponent } from './establecimientos/establecimientos.component';
import { PublicidadComponent } from './publicidad/publicidad.component';
import { KioskoTouchComponent } from './kiosko-touch/kiosko-touch.component';
import { EliminarComponent } from './productos/eliminar/eliminar.component';
import { EditarComponent } from './productos/editar/editar.component';
import { CrearComponent } from './productos/crear/crear.component';
import { CrearMenuComponent } from './menus/crear-menu/crear-menu.component';
import { EditarEliminarMenuComponent } from './menus/editar-eliminar-menu/editar-eliminar-menu.component';
import { CrearPromocionComponent } from './promociones/crear-promocion/crear-promocion.component';
import { EditarEliminarPromocionComponent } from './promociones/editar-eliminar-promocion/editar-eliminar-promocion.component';
import { EstadisticasPromocionComponent } from './promociones/estadisticas-promocion/estadisticas-promocion.component';
import { CrearPantallaCocinaComponent } from './pantallas-cocina/crear-pantalla-cocina/crear-pantalla-cocina.component';
import { EditarEliminarPantallaCocinaComponent } from './pantallas-cocina/editar-eliminar-pantalla-cocina/editar-eliminar-pantalla-cocina.component';


export const administradorRoutes: Routes = [
  { path: 'login', component: LoginComponent },

  { path: 'home',component: HomeComponent },

  { path: 'restablecer-contrasena', component: RestablecerContrasenaComponent },

  { path: 'gestion-usuarios', component: UsuariosComponent },

  { path: 'gestion-usuarios/crear-usuario', component: CrearUsuarioComponent },
  { path: 'gestion-usuarios/editar-eliminar-usuario', component: EditarEliminarUsuarioComponent },
  { path: 'gestion-usuarios/crear-rol', component: CrearRolComponent },
  { path: 'gestion-usuarios/editar-eliminar-rol', component: EditarEliminarRolComponent },

  { path: 'gestion-productos', component: ProductosComponent },
  { path: 'gestion-productos/crear', component: CrearComponent },
  { path: 'gestion-productos/editar', component: EditarComponent },
  { path: 'gestion-productos/eliminar', component: EliminarComponent },

  { path: 'gestion-menus', component: MenusComponent },
  { path: 'gestion-menus/crear', component: CrearMenuComponent },
  { path: 'gestion-menus/editar-eliminar', component: EditarEliminarMenuComponent },

  { path: 'gestion-promociones', component: PromocionesComponent },
  { path: 'gestion-promociones/crear', component: CrearPromocionComponent },
  { path: 'gestion-promociones/editar-eliminar', component: EditarEliminarPromocionComponent },
  { path: 'gestion-promociones/estadisticas', component: EstadisticasPromocionComponent },
  

  { path: 'gestion-pantallas-cocina', component: PantallasCocinaComponent },
  { path: 'gestion-pantallas-cocina/crear', component: CrearPantallaCocinaComponent },
  { path: 'gestion-pantallas-cocina/editar-eliminar', component: EditarEliminarPantallaCocinaComponent },
  
  { path: 'gestion-establecimientos', component: EstablecimientosComponent },

  { path: 'gestion-publicidad', component: PublicidadComponent },

  { path: 'gestion-kiosko-touch', component: KioskoTouchComponent },

];