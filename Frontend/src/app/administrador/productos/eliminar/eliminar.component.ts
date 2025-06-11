import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { CommonModule } from '@angular/common';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';
import { CatalogoService } from '../../../services/catalogo.service';
import { Producto, Categoria, Estado } from '../../../models/catalogo.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-eliminar',
  standalone: true,
  imports: [
    CommonModule,
    FooterAdminComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    HeaderAdminComponent,
    FormsModule
  ],
  templateUrl: './eliminar.component.html',
  styleUrls: ['./eliminar.component.scss']
})
export class EliminarComponent implements OnInit {
  private dialog = inject(MatDialog);
  private catalogoService = inject(CatalogoService);
  private router = inject(Router);

  displayedColumns: string[] = ['nombre', 'categoria', 'precio', 'estado', 'acciones'];
  productos: Producto[] = [];
  productosFiltrados: Producto[] = []; // Nueva propiedad
  loading = false;
  eliminando = false;
  filtroCategoria: string = ''; // Nueva propiedad
  categorias: Categoria[] = []; // Agregar esta propiedad

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  cargarCategorias(): void {
    this.catalogoService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      }
    });
  }

  cargarProductos(): void {
    this.loading = true;
    console.log('🔄 Cargando productos desde la base de datos...');

    this.catalogoService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.productosFiltrados = productos; // Inicializar filtrados
        this.loading = false;
        console.log('✅ Productos cargados:', productos.length);
        console.log('📦 Productos:', productos);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.loading = false;
        alert('❌ Error al cargar los productos. Por favor, intenta de nuevo.');
      }
    });
  }

  // Método para obtener el nombre de la categoría por ID
  getNombreCategoria(categoriaId: number): string {
    const categoria = this.categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nombre : 'Sin categoría';
  }

  // Filtrar por nombre de categoría
  filtrarPorCategoria(): void {
    if (!this.filtroCategoria.trim()) {
      this.productosFiltrados = this.productos;
    } else {
      this.productosFiltrados = this.productos.filter(producto => {
        const nombreCategoria = this.getNombreCategoria(producto.categoria);
        return nombreCategoria.toLowerCase().includes(this.filtroCategoria.toLowerCase());
      });
    }
  }

  abrirDialogoEliminar(producto: any): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        itemType: 'producto',
      } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🗑️ Confirmado eliminar producto:', producto.nombre);
        this.eliminarProducto(producto);
      } else {
        console.log('🚫 Eliminación cancelada');
      }
    });
  }

  eliminarProducto(producto: Producto): void {
    this.eliminando = true;
    console.log('🗑️ Eliminando producto:', producto.nombre, 'ID:', producto.id);

    this.catalogoService.eliminarProducto(producto.id).subscribe({
      next: (response) => {
        console.log('✅ Producto eliminado exitosamente:', response);

        // Remover el producto de la lista local
        this.productos = this.productos.filter(p => p.id !== producto.id);
        this.eliminando = false;

        this.mostrarDialogExito(
          'PRODUCTO ELIMINADO',
          `El producto "${producto.nombre}" ha sido eliminado exitosamente del sistema`,
          'Continuar'
        );
      },
      error: (error) => {
        console.error('❌ Error al eliminar producto:', error);
        this.eliminando = false;

        // Mostrar mensaje de error más específico
        let mensajeError = '❌ Error al eliminar el producto.';
        if (error.status === 404) {
          mensajeError = '❌ El producto no existe o ya fue eliminado.';
        } else if (error.status === 403) {
          mensajeError = '❌ No tienes permisos para eliminar este producto.';
        } else if (error.error?.message) {
          mensajeError = `❌ ${error.error.message}`;
        }

        alert(mensajeError);

        // Recargar productos por si hubo cambios
        this.cargarProductos();
      }
    });
  }

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
      // Opcional: recargar la lista después de cerrar dialog
      // this.cargarProductos();
    });
  }
}