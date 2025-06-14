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
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    RouterLink
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
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: { itemType: 'rol' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Confirmado eliminar rol:', rol.name);
        this.eliminarRol(rol);
      } else {
        console.log('❌ Eliminación cancelada');
      }
    });
  }

  private eliminarRol(rol: Grupo): void {
    console.log('🗑️ Eliminando rol:', rol.name);
    
    this.loading = true;
    
    this.rolesService.eliminarRol(rol.id).subscribe({
      next: () => {
        console.log('✅ Rol eliminado exitosamente');
        this.snackBar.open(`Rol "${rol.name}" eliminado exitosamente.`, 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.cargarRoles(); // Recargar lista
      },
      error: (error) => {
        console.error('❌ Error al eliminar rol:', error);
        const errorMessage = error.error?.error || 'No se pudo eliminar el rol.';
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 7000,
          panelClass: ['error-snackbar']
        });
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

  // ✅ Métodos auxiliares para validar permisos (para uso en template si es necesario)
  get puedeEditar(): boolean {
    return this.authService.hasPermission('auth.change_group');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasPermission('auth.delete_group');
  }
}