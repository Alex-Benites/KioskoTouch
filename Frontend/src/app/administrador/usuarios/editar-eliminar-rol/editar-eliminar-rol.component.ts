import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { PermissionDeniedDialogComponent } from '../../../shared/permission-denied-dialog/permission-denied-dialog.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { RolesService } from '../../../services/roles.service';
import { AuthService } from '../../../services/auth.service'; // ← NUEVO
import { GruposResponse, Grupo } from '../../../models/roles.model';


@Component({
  selector: 'app-editar-eliminar-rol',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HeaderAdminComponent,
    FooterAdminComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule
  ],
  templateUrl: './editar-eliminar-rol.component.html',
  styleUrls: ['./editar-eliminar-rol.component.scss']
})
export class EditarEliminarRolComponent implements OnInit {

  private rolesService = inject(RolesService);
  private authService = inject(AuthService); // ← NUEVO
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog); // ← NUEVO

  roles: Grupo[] = [];
  filteredRoles: Grupo[] = [];
  searchTerm: string = '';
  loading: boolean = true;

  // Removemos estas variables del diálogo personalizado
  // rolAEliminar: Grupo | null = null;
  // eliminando: boolean = false;

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.loading = true;
    this.rolesService.getRoles().subscribe({
      next: (response: GruposResponse) => {
        this.roles = (response.grupos || []).map(g => ({
          ...g,
          permisos_count: g.permisos_count || 0
        }));
        this.filtrarRoles();
        this.loading = false;
        console.log('✅ Roles cargados:', this.roles);
      },
      error: (error) => {
        console.error('❌ Error al cargar roles:', error);
        this.snackBar.open('Error al cargar los roles. Intente más tarde.', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    });
  }

  filtrarRoles(): void {
    if (!this.searchTerm.trim()) {
      this.filteredRoles = [...this.roles];
    } else {
      const lowerSearchTerm = this.searchTerm.toLowerCase().trim();
      this.filteredRoles = this.roles.filter(rol =>
        rol.name.toLowerCase().includes(lowerSearchTerm)
      );
    }
  }

  // ✅ MÉTODO MEJORADO - Valida permisos antes de editar
  editarRol(rol: Grupo): void {
    console.log('🔧 Intentando editar rol:', rol.name);

    // 🔒 Validar permisos
    if (!this.authService.hasPermission('auth.change_group')) {
      console.log('❌ Sin permisos para editar roles');
      this.mostrarDialogoSinPermisos();
      return;
    }

    // ✅ Tiene permisos, proceder con la edición
    console.log('✅ Permisos validados, redirigiendo a edición');
    this.router.navigate(['/administrador/gestion-usuarios/crear-rol', rol.id]);
  }

  // ✅ MÉTODO MEJORADO - Valida permisos antes de eliminar
  confirmarEliminarRol(rol: Grupo): void {
    console.log('🗑️ Intentando eliminar rol:', rol.name);

    // 🔒 Validar permisos
    if (!this.authService.hasPermission('auth.delete_group')) {
      console.log('❌ Sin permisos para eliminar roles');
      this.mostrarDialogoSinPermisos();
      return;
    }

    // ✅ Tiene permisos, mostrar confirmación
    console.log('✅ Permisos validados, mostrando confirmación');
    const dialogData: ConfirmationDialogData = {
      itemType: 'rol',
      action: 'delete'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        console.log('✅ Confirmado eliminar rol:', rol.name);
        // ✅ CAMBIO: Llamar directamente a procesarEliminacion
        this.procesarEliminacion(rol);
      } else {
        console.log('❌ Eliminación cancelada');
      }
    });
  }

  // ✅ MANTENER ESTE MÉTODO - Es el que hace el trabajo real
  private procesarEliminacion(rol: Grupo): void {
    this.loading = true;

    this.rolesService.eliminarRol(rol.id).subscribe({
      next: (response) => {
        console.log('✅ Rol eliminado exitosamente:', response);
        this.loading = false;

        // ✅ MOSTRAR SUCCESS-DIALOG
        this.mostrarDialogExito(
          'Rol Eliminado',
          `El rol "${rol.name}" ha sido eliminado exitosamente.`,
          'Continuar'
        );

        // Recargar la lista de roles
        this.cargarRoles();
      },
      error: (error) => {
        console.error('❌ Error eliminando rol:', error);
        this.loading = false;

        let mensajeError = 'Error al eliminar el rol. ';
        if (error.error?.detail) {
          mensajeError += error.error.detail;
        } else if (error.error?.message) {
          mensajeError += error.error.message;
        } else if (error.error?.error) {
          mensajeError += error.error.error;
        } else {
          mensajeError += 'Por favor, intente nuevamente.';
        }

        this.mostrarError(mensajeError);
      }
    });
  }

  // ✅ NUEVO: Método para mostrar diálogo de éxito
  private mostrarDialogExito(title: string, message: string, buttonText: string = 'Continuar'): void {
    const dialogData: SuccessDialogData = {
      title,
      message,
      buttonText
    };

    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(() => {
      // El usuario cierra el diálogo, no necesita navegar a ningún lado
      // Se queda en la misma vista para seguir editando/eliminando roles
      console.log('✅ Diálogo de éxito cerrado');
    });
  }

  // ✅ MODIFICAR: Método mostrarError para usar snackbar (para errores sí está bien)
  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
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

  // ✅ Métodos auxiliares para validar permisos (para uso en template si es necesario)
  get puedeEditar(): boolean {
    return this.authService.hasPermission('auth.change_group');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasPermission('auth.delete_group');
  }

  // ✅ NUEVO: Getters para información adicional de roles (opcional)
  get rolesConPermisos(): number {
    return this.roles.filter(rol => rol.permisos_count && rol.permisos_count > 0).length;
  }

  get rolesSinPermisos(): number {
    return this.roles.filter(rol => !rol.permisos_count || rol.permisos_count === 0).length;
  }

  get promedioPermisosPorRol(): number {
    if (this.roles.length === 0) return 0;
    const totalPermisos = this.roles.reduce((sum, rol) => sum + (rol.permisos_count || 0), 0);
    return Math.round((totalPermisos / this.roles.length) * 10) / 10; // Redondear a 1 decimal
  }
}