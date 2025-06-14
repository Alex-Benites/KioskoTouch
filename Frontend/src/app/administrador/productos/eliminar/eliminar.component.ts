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
import { PermissionDeniedDialogComponent } from '../../../shared/permission-denied-dialog/permission-denied-dialog.component'; // ✅ AGREGADO
import { CatalogoService } from '../../../services/catalogo.service';
import { AuthService } from '../../../services/auth.service'; // ✅ AGREGADO
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
  private authService = inject(AuthService); // ✅ AGREGADO
  private router = inject(Router);

  displayedColumns: string[] = ['nombre', 'categoria', 'precio', 'estado', 'acciones'];
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  loading = false;
  eliminando = false;
  filtroCategoria: string = '';
  categorias: Categoria[] = [];

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
        console.log('📦 Productos recibidos:', productos);
        
        // ✅ DEBUG: Mostrar estructura de productos
        if (productos.length > 0) {
          console.log('🔍 Ejemplo de producto completo:', productos[0]);
          console.log('🔍 Campos disponibles:', Object.keys(productos[0]));
        }
        
        this.productos = productos;
        this.productosFiltrados = productos;
        this.loading = false;
        
        // ✅ DEBUG: Analizar todos los productos
        this.debugProductos();
        
        console.log('✅ Productos cargados:', productos.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.loading = false;
        alert('❌ Error al cargar los productos. Por favor, intenta de nuevo.');
      }
    });
  }

  getNombreCategoria(categoriaId: number): string {
    const categoria = this.categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nombre : 'Sin categoría';
  }

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
    console.log('🗑️ Intentando eliminar producto:', producto.nombre);
    
    // ✅ AGREGADO: Validación de permisos para eliminar
    if (!this.authService.hasPermission('catalogo.delete_appkioskoproductos')) {
      console.log('❌ Sin permisos para eliminar productos');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, mostrando confirmación');
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
        this.filtrarPorCategoria(); // Actualizar filtrados
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

        let mensajeError = '❌ Error al eliminar el producto.';
        if (error.status === 404) {
          mensajeError = '❌ El producto no existe o ya fue eliminado.';
        } else if (error.status === 403) {
          mensajeError = '❌ No tienes permisos para eliminar este producto.';
        } else if (error.error?.message) {
          mensajeError = `❌ ${error.error.message}`;
        }

        alert(mensajeError);
        this.cargarProductos();
      }
    });
  }

  // ✅ AGREGADO: Método para mostrar diálogo sin permisos
  private mostrarDialogoSinPermisos(): void {
    console.log('🔒 Mostrando diálogo de sin permisos');
    this.dialog.open(PermissionDeniedDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'permission-denied-dialog-panel'
    });
  }

  // ✅ AGREGADO: Método para verificar permisos desde template
  tienePermisoEliminar(): boolean {
    return this.authService.hasPermission('catalogo.delete_appkioskoproductos');
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

  // En eliminar.component.ts

  // ✅ VERSIÓN COMPLETA QUE MANEJA AMBOS CASOS
  getPrecioFormateado(producto: any): string {
    console.log('🔍 Formateando precio para producto:', producto.nombre);
    console.log('📊 Datos del producto:', {
      precio: producto.precio,
      tamanos_detalle: producto.tamanos_detalle,
      aplica_tamanos: producto.aplica_tamanos
    });

    // Caso 1: Producto CON tamaños
    if (producto.tamanos_detalle && producto.tamanos_detalle.length > 0) {
      console.log('✅ Producto CON tamaños');
      const precios = producto.tamanos_detalle.map((t: any) => parseFloat(t.precio));
      const minPrecio = Math.min(...precios);
      const maxPrecio = Math.max(...precios);
      
      if (minPrecio !== maxPrecio) {
        return `$${minPrecio.toFixed(2)} - $${maxPrecio.toFixed(2)}`;
      } else {
        return `$${minPrecio.toFixed(2)}`;
      }
    }
    
    // Caso 2: Producto SIN tamaños (precio único)
    else {
      console.log('✅ Producto SIN tamaños, usando precio base');
      const precioBase = parseFloat(producto.precio || 0);
      return `$${precioBase.toFixed(2)}`;
    }
  }

  // ✅ VERSIÓN COMPLETA PARA ESTADOS
  getEstadoInfo(producto: any): { texto: string, clase: string } {
    console.log('🔍 Obteniendo estado para producto:', producto.nombre);
    console.log('📊 Datos de estado:', {
      activo: producto.activo,
      estado_nombre: producto.estado_nombre,
      estado: producto.estado
    });

    // Prioridad 1: Usar estado_nombre del backend si existe
    if (producto.estado_nombre) {
      const isActivo = producto.activo === true || producto.activo === 1;
      return {
        texto: producto.estado_nombre,
        clase: isActivo ? 'estado-activo' : 'estado-inactivo'
      };
    }
    
    // Prioridad 2: Usar campo 'activo' del backend
    else if (producto.activo !== undefined) {
      const isActivo = producto.activo === true || producto.activo === 1;
      return {
        texto: isActivo ? 'Activo' : 'Inactivo',
        clase: isActivo ? 'estado-activo' : 'estado-inactivo'
      };
    }
    
    // Prioridad 3: Fallback para compatibilidad (estado como número)
    else {
      const isActivo = producto.estado === 1 || producto.estado === 4; // Asumiendo que 1 o 4 son activos
      return {
        texto: isActivo ? 'Activo' : 'Inactivo',
        clase: isActivo ? 'estado-activo' : 'estado-inactivo'
      };
    }
  }

  // ✅ MÉTODO PARA DEBUG - Ver qué productos tienen qué estructura
  debugProductos(): void {
    console.log('🔍 DEBUG: Analizando estructura de productos');
    
    this.productos.forEach((producto: any, index: number) => {
      console.log(`📦 Producto ${index + 1}: ${producto.nombre}`);
      console.log('   - Precio base:', producto.precio);
      console.log('   - Aplica tamaños:', producto.aplica_tamanos);
      console.log('   - Tamaños detalle:', producto.tamanos_detalle?.length || 0);
      console.log('   - Estado activo:', producto.activo);
      console.log('   - Estado nombre:', producto.estado_nombre);
      console.log('   - Estado ID:', producto.estado);
      console.log('   ---');
    });
  }

  // ✅ MÉTODO PARA OBTENER INFORMACIÓN DETALLADA
  getDetalleProducto(producto: any): string {
    let detalle = producto.nombre;
    
    // Si tiene tamaños, agregarlos al detalle
    if (producto.tamanos_detalle && producto.tamanos_detalle.length > 0) {
      detalle += ' (Tamaños: ';
      const tamanos = producto.tamanos_detalle.map((t: any) =>
        `${t.nombre_tamano}: $${parseFloat(t.precio).toFixed(2)}`
      ).join(', ');
      detalle += tamanos + ')';
    } else {
      // Producto sin tamaños
      detalle += ` (Precio único: $${parseFloat(producto.precio || 0).toFixed(2)})`;
    }
    
    return detalle;
  }

  // ✅ MÉTODO PARA VERIFICAR SI UN PRODUCTO TIENE TAMAÑOS
  tieneTamanos(producto: any): boolean {
    return producto.tamanos_detalle && producto.tamanos_detalle.length > 0;
  }
}