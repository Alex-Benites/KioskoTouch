import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

// Services
import { UsuariosService } from '../../../services/usuarios.service';

// Interfaces
interface EmpleadoDisplay {
  id: number;
  nombres: string;
  apellidos: string;
  username: string;
  email: string;
  roles: string;
  is_active: boolean;
  cedula: string;
}

@Component({
  selector: 'app-editar-eliminar-usuario',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  templateUrl: './editar-eliminar-usuario.component.html',
  styleUrls: ['./editar-eliminar-usuario.component.scss']
})
export class EditarEliminarUsuarioComponent implements OnInit {
  
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['nombres', 'apellidos', 'username', 'email', 'roles', 'estado', 'acciones'];
  usuarios: EmpleadoDisplay[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.loading = true;
    this.error = '';

    this.usuariosService.obtenerEmpleados().subscribe({
      next: (response) => {
        console.log('✅ Empleados obtenidos:', response);
        
        // Mapear la respuesta del backend a formato para la tabla
        this.usuarios = response.empleados.map((empleado: any) => ({
          id: empleado.user_id || empleado.id,
          nombres: empleado.nombres,
          apellidos: empleado.apellidos,
          username: empleado.username,
          email: empleado.email,
          roles: empleado.roles.map((rol: any) => rol.name).join(', ') || 'Sin rol',
          is_active: empleado.is_active,
          cedula: empleado.cedula
        }));

        this.loading = false;
        console.log('📊 Usuarios procesados:', this.usuarios);
      },
      error: (error) => {
        console.error('❌ Error al cargar empleados:', error);
        this.error = 'Error al cargar los usuarios';
        this.loading = false;
        this.mostrarError('Error al cargar la lista de usuarios');
      }
    });
  }

  editarUsuario(usuario: EmpleadoDisplay): void {
    console.log('🔧 Editar usuario:', usuario);
    // Navegar al componente de crear-usuario en modo edición
    this.router.navigate(['/administrador/gestion-usuarios/crear-usuario', usuario.id]);
  }

   abrirDialogoEliminar(usuario: EmpleadoDisplay): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'usuario',
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eliminarUsuario(usuario);
      } else {
        console.log('❌ Eliminación cancelada');
      }
    });
  }

  private eliminarUsuario(usuario: EmpleadoDisplay): void {
    console.log('🗑️ Eliminando usuario:', usuario);
    
    // TODO: Implementar endpoint de eliminación en UsuariosService
    // this.usuariosService.eliminarEmpleado(usuario.id).subscribe({...});
    
    // Por ahora simulamos la eliminación
    this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
    this.mostrarExito(`Usuario ${usuario.nombres} ${usuario.apellidos} eliminado exitosamente`);
  }

  // 🔄 Método para recargar la lista
  recargarLista(): void {
    this.cargarUsuarios();
  }

  // 🎨 Método para obtener clase CSS según estado
  getEstadoClass(isActive: boolean): string {
    return isActive ? 'estado-activo' : 'estado-inactivo';
  }

  // 🎨 Método para obtener texto del estado
  getEstadoTexto(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}