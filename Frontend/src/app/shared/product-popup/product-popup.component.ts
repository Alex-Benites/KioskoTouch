import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ProductPopupData {
  producto: {
    id: number;
    nombre: string;
    precio: number;
    imagenUrl?: string;
    categoria?: number;
    descripcion?: string;
  };
  imagenUrl: string;
  permitirPersonalizacion?: boolean;
}

export interface ProductPopupResult {
  accion: 'agregar' | 'personalizar' | 'cancelar';
  cantidad: number;
}

@Component({
  selector: 'app-product-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './product-popup.component.html',
  styleUrls: ['./product-popup.component.scss']
})
export class ProductPopupComponent implements OnInit {
  cantidad = 1;
  precioTotal = 0;

  constructor(
    public dialogRef: MatDialogRef<ProductPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductPopupData
  ) {}

  ngOnInit(): void {
    this.calcularTotal();
  }

  // ✅ Aumentar cantidad
  aumentarCantidad(): void {
    this.cantidad++;
    this.calcularTotal();
  }

  // ✅ Disminuir cantidad
  disminuirCantidad(): void {
    if (this.cantidad > 1) {
      this.cantidad--;
      this.calcularTotal();
    }
  }

  // ✅ Calcular precio total
  private calcularTotal(): void {
    this.precioTotal = this.data.producto.precio * this.cantidad;
  }

  // ✅ Agregar al carrito
  agregarAlCarrito(): void {
    const resultado: ProductPopupResult = {
      accion: 'agregar',
      cantidad: this.cantidad
    };
    this.dialogRef.close(resultado);
  }

  // ✅ Personalizar producto (opcional)
  personalizarProducto(): void {
    const resultado: ProductPopupResult = {
      accion: 'personalizar',
      cantidad: this.cantidad
    };
    this.dialogRef.close(resultado);
  }

  // ✅ Cerrar popup
  cerrarPopup(): void {
    const resultado: ProductPopupResult = {
      accion: 'cancelar',
      cantidad: 0
    };
    this.dialogRef.close(resultado);
  }

  // ✅ Verificar si debe mostrar botón personalizar
  get mostrarPersonalizar(): boolean {
    return this.data.permitirPersonalizacion || false;
  }
}
