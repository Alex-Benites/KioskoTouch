import { Component, OnInit } from '@angular/core';
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
import { CatalogoService } from '../../../services/catalogo.service'; 
import { Producto, Categoria, Estado } from '../../../models/catalogo.model'; 

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
    HeaderAdminComponent
  ],
  templateUrl: './eliminar.component.html',
  styleUrls: ['./eliminar.component.scss']
})

export class EliminarComponent implements OnInit{
  displayedColumns: string[] = ['nombre', 'categoria', 'precio', 'estado', 'acciones'];
  productos: Producto[] = [];
  loading = false;
  eliminando = false;

  constructor(
    private dialog: MatDialog,
    private catalogoService: CatalogoService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.cargarProductos();
  }

    cargarProductos(): void {
    this.loading = true;
    console.log('🔄 Cargando productos desde la base de datos...');

    this.catalogoService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
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

  editarProducto(producto: any): void {
    console.log('Editar producto:', producto);
    // Aquí puedes redirigir a un formulario de edición o abrir un modal
    this.router.navigate(['/administrador/gestion-productos/crear', producto.id]);
  }

    abrirDialogoEliminar(producto: any): void {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: { 
          itemType: 'producto',
          itemName: producto.nombre,  // 🔧 Agregar nombre del producto
          message: `¿Estás seguro de que deseas eliminar el producto "${producto.nombre}"?`  // 🔧 Mensaje personalizado
        } as ConfirmationDialogData
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('🗑️ Confirmado eliminar producto:', producto.nombre);
          this.eliminarProducto(producto);
          // 🔧 REMOVER esta línea duplicada: this.productos = this.productos.filter(p => p !== producto);
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
        
        // Mostrar mensaje de éxito
        alert(`✅ Producto "${producto.nombre}" eliminado exitosamente`);
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
}
