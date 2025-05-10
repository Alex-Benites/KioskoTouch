import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Agrega esto
import { LoginComponent } from './login/login.component'; // Asegúrate de declarar el componente
import { HomeComponent } from './home/home.component';
import { RestablecerContrasenaComponent } from './restablecer-contrasena/restablecer-contrasena.component';
import { CrearUsuarioComponent } from './usuarios/crear-usuario/crear-usuario.component';
import { EditarEliminarUsuarioComponent } from './usuarios/editar-eliminar-usuario/editar-eliminar-usuario.component';
import { CrearRolComponent } from './usuarios/crear-rol/crear-rol.component';
import { EditarEliminarRolComponent } from './usuarios/editar-eliminar-rol/editar-eliminar-rol.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
@NgModule({
  declarations: [
    LoginComponent,
    RestablecerContrasenaComponent, 
    HomeComponent,
    UsuariosComponent,
    CrearUsuarioComponent,
    EditarEliminarUsuarioComponent,
    CrearRolComponent,
    EditarEliminarRolComponent
  ],
  imports: [
    CommonModule,
    FormsModule // <-- Agrega esto para que ngModel funcione
  ]
})
export class AdministradorModule { }

