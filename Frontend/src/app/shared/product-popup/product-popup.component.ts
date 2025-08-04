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
      precio_original?: number; // ✅ AGREGAR: precio original sin descuento
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

    // ✅ SELECCIONAR primer tamaño si tiene tamaños
    if (this.tieneTamanos && this.data.producto.tamanos_detalle && this.data.producto.tamanos_detalle.length > 0) {
      const primerTamano = this.data.producto.tamanos_detalle[0];
      
      // ✅ CONVERTIR precio a número y crear objeto del tamaño
      this.tamanoSeleccionado = {
        ...primerTamano,
        precio: parseFloat(primerTamano.precio.toString()) || 0
      };
      
      console.log('🎯 Tamaño seleccionado por defecto:', this.tamanoSeleccionado);
    } else {
      console.log('🏷️ Producto sin tamaños, usando precio base:', this.data.producto.precio);
    }

    // ✅ INICIALIZAR precio total
    this.precioTotal = 0;
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

  // ✅ MEJORAR: Método para obtener precio actual
  getPrecioActual(): number {
    console.log('💰 getPrecioActual - Estado:', {
      tieneTamanos: this.tieneTamanos,
      tamanoSeleccionado: this.tamanoSeleccionado,
      precioProducto: this.data.producto.precio
    });

    if (this.tieneTamanos && this.tamanoSeleccionado) {
      // Producto con tamaños - usar precio del tamaño seleccionado
      const precioTamano = parseFloat(this.tamanoSeleccionado.precio.toString()) || 0;
      console.log('📏 Usando precio de tamaño:', precioTamano);
      return precioTamano;
    }
    
    // Producto sin tamaños - usar precio base del producto
    const precioBase = parseFloat(this.data.producto.precio.toString()) || 0;
    console.log('🏷️ Usando precio base:', precioBase);
    return precioBase;
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

  // ✅ MEJORAR: Calcular precio total
  private calcularTotal(): void {
    const precioUnitario = this.getPrecioActual();
    this.precioTotal = precioUnitario * this.cantidad;
    
    console.log('💰 calcularTotal:', {
      precioUnitario: precioUnitario,
      cantidad: this.cantidad,
      precioTotal: this.precioTotal
    });
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

  // ✅ MEJORADO: Método para verificar si un tamaño tiene descuento
  tamanoTieneDescuento(tamano: any): boolean {
    // Verificar que ambos precios existan
    if (!tamano.precio_original || !tamano.precio) {
      return false;
    }

    const precioOriginal = parseFloat(tamano.precio_original.toString());
    const precioActual = parseFloat(tamano.precio.toString());
    
    // Comparar con tolerancia para evitar problemas de precisión decimal
    if (Math.abs(precioOriginal - precioActual) > 0.01) {
      const descuento = ((precioOriginal - precioActual) / precioOriginal) * 100;
      return Math.abs(descuento) > 0.01; // Considerar descuento si es mayor a 0.01%
    }
    
    return false;
  }

  // ✅ MEJORADO: Método para obtener precio original de un tamaño
  obtenerPrecioOriginalTamano(tamano: any): number {
    // Si hay precio_original definido, usarlo; sino usar el precio actual
    const precioOriginal = tamano.precio_original ? 
      parseFloat(tamano.precio_original.toString()) : 
      parseFloat(tamano.precio.toString());
    
    return precioOriginal;
  }

  // ✅ MEJORADO: Método para debugging - mostrar información del tamaño
  debugTamano(tamano: any): void {
    const tieneDescuento = this.tamanoTieneDescuento(tamano);
    const precioOriginal = this.obtenerPrecioOriginalTamano(tamano);
    const descuentoPorcentaje = tieneDescuento ? 
      ((precioOriginal - tamano.precio) / precioOriginal * 100).toFixed(1) : 0;
    
    console.log(`🏷️ POPUP - Tamaño ${tamano.codigo_tamano}:`, {
      precio_actual: tamano.precio,
      precio_original: precioOriginal,
      tiene_descuento: tieneDescuento,
      descuento_porcentaje: `${descuentoPorcentaje}%`
    });
  }
  
}
