import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatError } from '@angular/material/form-field';

import { RolesService } from '../../../services/roles.service';
import { GruposResponse, Grupo } from '../../../models/roles.model'; // Import Grupo

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
    MatError,
  ],
  templateUrl: './editar-eliminar-rol.component.html',
  styleUrls: ['./editar-eliminar-rol.component.scss']
})
export class EditarEliminarRolComponent implements OnInit {
  roles: Grupo[] = [];
  filteredRoles: Grupo[] = [];
  searchTerm: string = '';
  loading: boolean = true;

  rolAEliminar: Grupo | null = null;
  eliminando: boolean = false;

  constructor(
    private rolesService: RolesService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.loading = true;
    this.rolesService.getRoles().subscribe({
      next: (response: GruposResponse) => {
        // Ensure 'usuarios_count' is handled, defaulting if necessary
        this.roles = (response.grupos || []).map(g => ({
          ...g,
          permisos_count: g.permisos_count || 0 // Default to 0 if undefined
        }));
        this.filtrarRoles();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
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
        rol.name.toLowerCase().includes(lowerSearchTerm) // Use rol.name
      );
    }
  }

  editarRol(rol: Grupo): void {
    this.router.navigate(['/administrador/usuarios/crear-rol'], { queryParams: { editarId: rol.id } });
  }

  confirmarEliminarRol(rol: Grupo): void {
    // usuarios_count should now be available on the rol (Grupo) object
    this.rolAEliminar = rol;
  }

  cancelarEliminarRol(): void {
    this.rolAEliminar = null;
  }

  procederEliminarRol(): void {
    if (!this.rolAEliminar) return;

    this.eliminando = true;
    this.rolesService.eliminarRol(this.rolAEliminar.id).subscribe({
      next: () => {
        this.snackBar.open(`Rol "${this.rolAEliminar?.name}" eliminado exitosamente.`, 'Cerrar', { // Use .name
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.cargarRoles(); // Refresh the list
        this.cancelarEliminarRol(); // Close dialog
      },
      error: (error) => {
        console.error('Error al eliminar rol:', error);
        const errorMessage = error.error?.error || 'No se pudo eliminar el rol.';
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 7000,
          panelClass: ['error-snackbar']
        });
      }
    }).add(() => {
      this.eliminando = false;
    });
  }
}