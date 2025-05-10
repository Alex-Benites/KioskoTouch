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

  { path: 'gestion-menus', component: MenusComponent },

  { path: 'gestion-promociones', component: PromocionesComponent },

  { path: 'gestion-pantallas-cocina', component: PantallasCocinaComponent },
  
  { path: 'gestion-establecimientos', component: EstablecimientosComponent },

  { path: 'gestion-publicidad', component: PublicidadComponent },

  { path: 'gestion-kiosko-touch', component: KioskoTouchComponent },

];