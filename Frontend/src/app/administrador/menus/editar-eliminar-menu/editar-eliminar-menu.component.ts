import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { PermissionDeniedDialogComponent } from '../../../shared/permission-denied-dialog/permission-denied-dialog.component';

import { Menu, Estado } from '../../../models/catalogo.model';
import { CatalogoService } from '../../../services/catalogo.service';
import { AuthService } from '../../../services/auth.service';
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
    private authService: AuthService,
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
        this.menus.forEach(menu => {
          this.catalogoService.getMenuImagen(menu.id).subscribe(response => {
            menu.imagenUrl = response.imagen_url;
          });
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

  // Formatea la lista de productos con cantidad y tamaño
  getProductosLista(menu: any): string[] {
    if (!menu.productos_detalle || !Array.isArray(menu.productos_detalle)) return [];
    return menu.productos_detalle.map((p: any) => {
      const cantidad = p.cantidad || 1;
      const nombre = p.nombre || p.producto_nombre || (p.producto?.nombre ?? '');
      let tamano = '';
      if (p.tamano_codigo) {
        tamano = `(${p.tamano_codigo})`;
      } else if (p.tamano_nombre) {
        tamano = `(${p.tamano_nombre.charAt(0).toUpperCase()})`;
      }
      let cantidadStr = cantidad > 1 ? `(x${cantidad})` : '';
      return `- ${nombre} ${cantidadStr}${tamano}`.trim();
    });
  }

  editarMenu(menu: any): void {
    if (!this.authService.hasPermission('catalogo.change_appkioskomenus')) {
      this.mostrarDialogoSinPermisos();
      return;
    }
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

  abrirDialogoEliminar(menu: any): void {
    if (!this.authService.hasPermission('catalogo.delete_appkioskomenus')) {
      this.mostrarDialogoSinPermisos();
      return;
    }
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { itemType: 'menu' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eliminarMenu(menu);
      }
    });
  }

  eliminarMenu(menu: Menu): void {
    this.eliminando = true;
    this.catalogoService.eliminarMenu(menu.id).subscribe({
      next: (response) => {
        this.eliminando = false;
        this.cargarMenus();
        this.filtrarMenus();
      },
      error: (error) => {
        this.eliminando = false;
        let mensajeError = '❌ Error al eliminar el menú.';
        if (error.status === 404) {
          mensajeError = '❌ El menú no existe o ya fue eliminado.';
        } else if (error.status === 403) {
          mensajeError = '❌ No tienes permisos para eliminar este menú.';
        } else if (error.error?.message) {
          mensajeError = `❌ ${error.error.message}`;
        }
        alert(mensajeError);
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

  private mostrarDialogoSinPermisos(): void {
    this.dialog.open(PermissionDeniedDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'permission-denied-dialog-panel'
    });
  }
}
