import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { CommonModule } from '@angular/common';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-eliminar',
  standalone: true,
  imports: [
    CommonModule,
    FooterAdminComponent,
    MatTableModule,
    HeaderAdminComponent
  ],
  templateUrl: './eliminar.component.html',
  styleUrls: ['./eliminar.component.scss']
})
export class EliminarComponent {
  displayedColumns: string[] = ['nombre', 'categoria', 'precio', 'estado', 'acciones'];
  productos = [
    { nombre: 'Cheese Burger', categoria: 'Hamburguesa', precio: 5.0, estado: 'Activo' },
    { nombre: 'Vegetable Burger', categoria: 'Hamburguesa', precio: 5.0, estado: 'Activo' },
    { nombre: 'Meet Burger', categoria: 'Hamburguesa', precio: 5.0, estado: 'Inactivo' },
    { nombre: 'Bacon Burger', categoria: 'Hamburguesa', precio: 5.0, estado: 'Inactivo' },
    { nombre: 'Chicken Burger', categoria: 'Hamburguesa', precio: 5.0, estado: 'Activo' }
  ];

  constructor(private dialog: MatDialog) {}

  editarProducto(producto: any): void {
    console.log('Editar producto:', producto);
    // Aquí puedes redirigir a un formulario de edición o abrir un modal
  }

  abrirDialogoEliminar(producto: any): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { itemType: 'producto' } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Producto eliminado:', producto);
        // Aquí puedes implementar la lógica para eliminar el producto
        this.productos = this.productos.filter(p => p !== producto);
      } else {
        console.log('Eliminación cancelada');
      }
    });
  }
}
