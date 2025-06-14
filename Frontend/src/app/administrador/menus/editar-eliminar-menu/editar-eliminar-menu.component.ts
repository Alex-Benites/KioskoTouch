import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { PermissionDeniedDialogComponent } from '../../../shared/permission-denied-dialog/permission-denied-dialog.component'; // ← NUEVO

import { Menu, Estado } from '../../../models/catalogo.model';
import { CatalogoService } from '../../../services/catalogo.service';
import { AuthService } from '../../../services/auth.service'; // ← NUEVO
import { environment } from '../../../../environments/environment'; 

@Component({
  selector: 'app-editar-eliminar-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  templateUrl: './editar-eliminar-menu.component.html',
  styleUrl: './editar-eliminar-menu.component.scss'
})
export class EditarEliminarMenuComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'imagen', 'menus'];
  menus: Menu[] = [];
  menusFiltrados: Menu[] = [];
  search: string = '';
  loading = false;
  eliminando = false;

  constructor(
    private dialog: MatDialog,
    private catalogoService: CatalogoService,
    private authService: AuthService, // ← NUEVO
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarMenus();
  }

  cargarMenus(): void {
    this.loading = true;
    this.catalogoService.getMenus().subscribe({
      next: (menus) => {
        this.menus = menus;
        this.loading = false;
        // Cargar imágenes y productos para cada menú
        this.menus.forEach(menu => {
          // Imagen
          this.catalogoService.getMenuImagen(menu.id).subscribe(response => {
            menu.imagenUrl = response.imagen_url;
          });
          // Productos: usar productos_detalle del backend
          menu.productosLista = this.getProductosLista(menu);
        });
        this.menusFiltrados = [...this.menus];
      },
      error: (error) => {
        this.loading = false;
        alert('❌ Error al cargar los menus. Por favor, intenta de nuevo.');
      }
    });
  }

  // Helper para formatear la lista de productos
  getProductosLista(menu: any): string[] {
    if (!menu.productos_detalle || !Array.isArray(menu.productos_detalle)) return [];
    return menu.productos_detalle.map((p: any) => {
      const cantidad = p.cantidad || 1;
      const nombre = p.nombre || '';
      return cantidad > 1 ? `- ${nombre} (${cantidad})` : `- ${nombre}`;
    });
  }

  // ✅ MÉTODO MEJORADO - Valida permisos antes de editar
  editarMenu(menu: any): void {
    console.log('🔧 Intentando editar menú:', menu.nombre);
    
    // 🔒 Validar permisos
    if (!this.authService.hasPermission('catalogo.change_appkioskomenus')) {
      console.log('❌ Sin permisos para editar menús');
      this.mostrarDialogoSinPermisos();
      return;
    }

    // ✅ Tiene permisos, proceder con la edición
    console.log('✅ Permisos validados, redirigiendo a edición');
    this.router.navigate(['/administrador/gestion-menus/crear', menu.id]);
  }

  loadMenuImages(): void {
    this.menus.forEach(menu => {
      if (menu.id) {
        this.catalogoService.getMenuImagen(menu.id).subscribe(response => {
          menu.imagenUrl = response.imagen_url;
        });
      }
    });
  }

  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) return '';
    return `${environment.baseUrl}${imagenUrl}`;
  }

  // ✅ MÉTODO MEJORADO - Valida permisos antes de eliminar
  abrirDialogoEliminar(menu: any): void {
    console.log('🗑️ Intentando eliminar menú:', menu.nombre);
    
    // 🔒 Validar permisos
    if (!this.authService.hasPermission('catalogo.delete_appkioskomenus')) {
      console.log('❌ Sin permisos para eliminar menús');
      this.mostrarDialogoSinPermisos();
      return;
    }

    // ✅ Tiene permisos, mostrar confirmación
    console.log('✅ Permisos validados, mostrando confirmación');
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { itemType: 'menu' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🗑️ Confirmado eliminar menú:', menu.nombre);
        this.eliminarMenu(menu);
      } else {
        console.log('🚫 Eliminación cancelada');
      }
    });
  }

  eliminarMenu(menu: Menu): void {
    this.eliminando = true;
    console.log('🗑️ Eliminando menú:', menu.nombre, 'ID:', menu.id);

    this.catalogoService.eliminarMenu(menu.id).subscribe({
      next: (response) => {
        console.log('✅ Menú eliminado exitosamente:', response);
        this.eliminando = false;
        
        // ✅ Recargar la página automáticamente
        this.cargarMenus();
        
        // ✅ También actualizar la lista filtrada
        this.filtrarMenus();
      },
      error: (error) => {
        console.error('❌ Error al eliminar menú:', error);
        this.eliminando = false;

        // Mostrar mensaje de error más específico
        let mensajeError = '❌ Error al eliminar el menú.';
        if (error.status === 404) {
          mensajeError = '❌ El menú no existe o ya fue eliminado.';
        } else if (error.status === 403) {
          mensajeError = '❌ No tienes permisos para eliminar este menú.';
        } else if (error.error?.message) {
          mensajeError = `❌ ${error.error.message}`;
        }

        alert(mensajeError);

        // Recargar menús por si hubo cambios
        this.cargarMenus();
      }
    });
  }

  filtrarMenus(): void {
    const texto = this.search.trim().toLowerCase();
    if (!texto) {
      this.menusFiltrados = [...this.menus];
      return;
    }
    this.menusFiltrados = this.menus.filter(menu =>
      menu.nombre.toLowerCase().includes(texto)
    );
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
}