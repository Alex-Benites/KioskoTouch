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
    console.log('🔄 Cargando menus desde la base de datos...');

    this.catalogoService.getMenus().subscribe({
      next: (menus) => {
        this.menus = menus;
        this.loading = false;
        console.log('✅ Menus cargados:', menus.length);
        console.log('📦 Menus:', menus);
      },
      error: (error) => {
        console.error('❌ Error al cargar menus:', error);
        this.loading = false;
        alert('❌ Error al cargar los menus. Por favor, intenta de nuevo.');
      }
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
            itemName: menu.nombre,  // 🔧 Agregar nombre del menu
            message: `¿Estás seguro de que deseas eliminar el menu "${menu.nombre}"?`  // 🔧 Mensaje personalizado
          } as ConfirmationDialogData
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            console.log('🗑️ Confirmado eliminar menu:', menu.nombre);
            this.eliminarMenu(menu);
            // 🔧 REMOVER esta línea duplicada: this.menus = this.menus.filter(p => p !== menu);
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
}
