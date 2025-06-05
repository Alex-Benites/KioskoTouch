import { Component,OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { Menu, Estado } from '../../../models/catalogo.model';
import { CatalogoService } from '../../../services/catalogo.service';
import { Router } from '@angular/router';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-editar-eliminar-menu',
  standalone: true,
  imports: [CommonModule,FormsModule,HeaderAdminComponent,FooterAdminComponent],
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

   editarMenu(Menu: any): void {
    console.log('🔧 Editando Menu:', Menu);
    // Navegar al formulario de edición con el ID del Menu
    this.router.navigate(['/administrador/gestion-menus/crear', Menu.id]);
  }

  loadMenuImages(): void {
    this.menus.forEach(Menu => {
      if (Menu.id) {
        this.catalogoService.getMenuImagen(Menu.id).subscribe(response => {
          Menu.imagenUrl = response.imagen_url;
        });
      }
    });
  }

  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) return '';
    return `http://127.0.0.1:8000${imagenUrl}`;
  }
  abrirDialogoEliminar(menu: any): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        itemType: 'menu',
        itemName: menu.nombre,
        message: `¿Estás seguro de que deseas eliminar el menu "${menu.nombre}"?`  // 🔧 Mensaje personalizado
      } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🗑️ Confirmado eliminar menu:', menu.nombre);
        this.eliminarMenu(menu);

      } else {
        console.log('🚫 Eliminación cancelada');
      }
    });
  }

    eliminarMenu(menu: Menu): void {
      this.eliminando = true;
      console.log('🗑️ Eliminando menu:', menu.nombre, 'ID:', menu.id);

      this.catalogoService.eliminarMenu(menu.id).subscribe({
        next: (response) => {
          console.log('✅ menu eliminado exitosamente:', response);

          // Remover el menu de la lista local
          this.menus = this.menus.filter(p => p.id !== menu.id);

          this.eliminando = false;

          // Mostrar mensaje de éxito
          alert(`✅ menu "${menu.nombre}" eliminado exitosamente`);
        },
        error: (error) => {
          console.error('❌ Error al eliminar menu:', error);
          this.eliminando = false;

          // Mostrar mensaje de error más específico
          let mensajeError = '❌ Error al eliminar el menu.';
          if (error.status === 404) {
            mensajeError = '❌ El menu no existe o ya fue eliminado.';
          } else if (error.status === 403) {
            mensajeError = '❌ No tienes permisos para eliminar este menu.';
          } else if (error.error?.message) {
            mensajeError = `❌ ${error.error.message}`;
          }

          alert(mensajeError);

          // Recargar menus por si hubo cambios
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
}
