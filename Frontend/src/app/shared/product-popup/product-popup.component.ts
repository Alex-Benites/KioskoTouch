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

        // ✅ AGREGAR información de tamaños
    aplica_tamanos?: boolean;
    tamanos_detalle?: Array<{
      id: number;
      tamano_nombre: string;
      codigo_tamano: string;
      precio: number;
    }>;
  };
  imagenUrl: string;
  permitirPersonalizacion?: boolean;
}

export interface ProductPopupResult {
  accion: 'agregar' | 'personalizar' | 'cancelar';
  cantidad: number;
    // ✅ AGREGAR tamaño seleccionado
  tamanoSeleccionado?: {
    id: number;
    nombre: string;
    codigo: string;
    precio: number;
  };
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

  // ✅ AGREGAR: Propiedades para manejar tamaños
  tamanoSeleccionado: any = null;
  tieneTamanos: boolean = false;
  
  constructor(
    public dialogRef: MatDialogRef<ProductPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductPopupData
  ) {
    console.log('🎯 ProductPopupComponent inicializado con data:', this.data);

    // ✅ VERIFICAR si tiene tamaños
    this.tieneTamanos = !!(
      this.data.producto.aplica_tamanos && 
      this.data.producto.tamanos_detalle && 
      this.data.producto.tamanos_detalle.length > 0
    );

    console.log('📏 Tiene tamaños:', this.tieneTamanos);
    console.log('📊 Tamaños disponibles:', this.data.producto.tamanos_detalle);

    // ✅ SELECCIONAR primer tamaño con conversión de precio
    if (this.tieneTamanos && this.data.producto.tamanos_detalle && this.data.producto.tamanos_detalle.length > 0) {
      const primerTamano = this.data.producto.tamanos_detalle[0];
      
      // ✅ CONVERTIR precio a número
      this.tamanoSeleccionado = {
        ...primerTamano,
        precio: parseFloat(primerTamano.precio.toString()) || 0
      };
      
      console.log('🎯 Tamaño seleccionado por defecto:', this.tamanoSeleccionado);
    }
  }

  ngOnInit(): void {
    this.calcularTotal();
  }

  // ✅ AGREGAR: Método para seleccionar tamaño
  seleccionarTamano(tamano: any): void {
    // ✅ CONVERTIR precio a número al seleccionar
    this.tamanoSeleccionado = {
      ...tamano,
      precio: parseFloat(tamano.precio.toString()) || 0
    };
    
    console.log('📏 Tamaño seleccionado:', this.tamanoSeleccionado);
    this.calcularTotal();
  }

  // ✅ AGREGAR: Método para obtener precio actual
  getPrecioActual(): number {
    if (this.tieneTamanos && this.tamanoSeleccionado) {
      // ✅ CONVERTIR string a number
      return parseFloat(this.tamanoSeleccionado.precio) || 0;
    }
    // ✅ ASEGURAR que sea número
    return parseFloat(this.data.producto.precio.toString()) || 0;
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

  // ✅ Calcular precio total usando precio actual
  private calcularTotal(): void {
    this.precioTotal = this.getPrecioActual() * this.cantidad;
  }

  // ✅ Agregar al carrito con tamaño
  agregarAlCarrito(): void {
    const resultado: ProductPopupResult = {
      accion: 'agregar',
      cantidad: this.cantidad
    };

    // Incluir tamaño si está seleccionado
    if (this.tieneTamanos && this.tamanoSeleccionado) {
      resultado.tamanoSeleccionado = {
        id: this.tamanoSeleccionado.id,
        nombre: this.tamanoSeleccionado.tamano_nombre,
        codigo: this.tamanoSeleccionado.codigo_tamano,
        precio: this.tamanoSeleccionado.precio
      };
    }

    console.log('✅ Resultado agregar:', resultado);
    this.dialogRef.close(resultado);
  }

  // ✅ Personalizar producto con tamaño
  personalizarProducto(): void {
    const resultado: ProductPopupResult = {
      accion: 'personalizar',
      cantidad: this.cantidad
    };

    // Incluir tamaño si está seleccionado
    if (this.tieneTamanos && this.tamanoSeleccionado) {
      resultado.tamanoSeleccionado = {
        id: this.tamanoSeleccionado.id,
        nombre: this.tamanoSeleccionado.tamano_nombre,
        codigo: this.tamanoSeleccionado.codigo_tamano,
        precio: this.tamanoSeleccionado.precio
      };
    }

    console.log('🎨 Resultado personalizar:', resultado);
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


  // ✅ AGREGAR: Método para formatear precio
  formatearPrecio(precio: any): string {
    return parseFloat(precio.toString()).toFixed(2);
  }
  
}
