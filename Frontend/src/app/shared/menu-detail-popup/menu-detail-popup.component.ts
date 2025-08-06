import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Menu } from '../../models/catalogo.model';

export interface MenuDetailPopupData {
  menu: Menu & {
    imagenUrl: string;
    productosLista?: string[];
    productosDetalle?: Array<{
      id: number;
      nombre: string;
      imagenUrl?: string;
      cantidad: number;
      tamano_codigo?: string;
      tamano_nombre?: string;
    }>;
  };
  getFullImageUrl: (imageUrl: string) => string;
}

export interface MenuDetailPopupResult {
  accion: 'cerrar';
}

@Component({
  selector: 'app-menu-detail-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './menu-detail-popup.component.html',
  styleUrl: './menu-detail-popup.component.scss'
})
export class MenuDetailPopupComponent {

  constructor(
    public dialogRef: MatDialogRef<MenuDetailPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MenuDetailPopupData
  ) {}

  cancelar(): void {
    const resultado: MenuDetailPopupResult = {
      accion: 'cerrar'
    };
    this.dialogRef.close(resultado);
  }

  obtenerImagenProducto(producto: any): string {
    if (producto.imagenUrl) {
      return this.data.getFullImageUrl(producto.imagenUrl);
    }
    if (producto.imagen_url) {
      return this.data.getFullImageUrl(producto.imagen_url);
    }
    return 'assets/placeholder-producto.png';
  }
}