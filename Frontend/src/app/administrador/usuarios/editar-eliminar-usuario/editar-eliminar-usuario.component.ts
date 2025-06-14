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
import { PermissionDeniedDialogComponent } from '../../../shared/permission-denied-dialog/permission-denied-dialog.component'; // ← NUEVO

// Services
import { UsuariosService } from '../../../services/usuarios.service';
import { AuthService } from '../../../services/auth.service'; // ← NUEVO

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
  private authService = inject(AuthService); // ← NUEVO
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

  // ✅ MÉTODO MEJORADO - Valida permisos antes de editar
  editarUsuario(usuario: EmpleadoDisplay): void {
    console.log('🔧 Intentando editar usuario:', usuario);
    
    // 🔒 Validar permisos
    if (!this.authService.hasPermission('auth.change_user')) {
      console.log('❌ Sin permisos para editar usuarios');
      this.mostrarDialogoSinPermisos();
      return;
    }

    // ✅ Tiene permisos, proceder con la edición
    console.log('✅ Permisos validados, redirigiendo a edición');
    this.router.navigate(['/administrador/gestion-usuarios/crear-usuario', usuario.id]);
  }

  // ✅ MÉTODO MEJORADO - Valida permisos antes de eliminar
  abrirDialogoEliminar(usuario: EmpleadoDisplay): void {
    console.log('🗑️ Intentando eliminar usuario:', usuario);
    
    // 🔒 Validar permisos
    if (!this.authService.hasPermission('auth.delete_user')) {
      console.log('❌ Sin permisos para eliminar usuarios');
      this.mostrarDialogoSinPermisos();
      return;
    }

    // ✅ Tiene permisos, mostrar confirmación
    console.log('✅ Permisos validados, mostrando confirmación');
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: { itemType: 'usuario' }  // ← SOLO ESTO, como está definido
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Confirmado eliminar usuario:', usuario.username);
        this.eliminarUsuario(usuario);
      } else {
        console.log('❌ Eliminación cancelada');
      }
    });
  }

  private eliminarUsuario(usuario: EmpleadoDisplay): void {
    console.log('🗑️ Eliminando usuario:', usuario);
    
    this.loading = true;
    
    this.usuariosService.eliminarEmpleado(usuario.id).subscribe({
      next: (response) => {
        console.log('✅ Usuario eliminado exitosamente');
        this.mostrarExito(response.message);
        this.cargarUsuarios(); // Recargar lista
      },
      error: (error) => {
        console.error('❌ Error al eliminar usuario:', error);
        const mensaje = error.error?.error || 'Error al eliminar el usuario';
        this.mostrarError(mensaje);
        this.loading = false;
      }
    });
  }

  // 🆕 MÉTODO PARA MOSTRAR DIÁLOGO DE PERMISOS
  private mostrarDialogoSinPermisos(): void {
    console.log('🔒 Mostrando diálogo de sin permisos');
    this.dialog.open(PermissionDeniedDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'permission-denied-dialog-panel'
    });
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

  // ✅ Métodos auxiliares para validar permisos (para uso en template si es necesario)
  get puedeEditar(): boolean {
    return this.authService.hasPermission('auth.change_user');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasPermission('auth.delete_user');
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