import { Component, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { PublicidadService } from '../../services/publicidad.service';
import { CatalogoService } from '../../services/catalogo.service';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';
// ✅ AGREGAR: Imports para el diálogo
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TurnoConfirmationDialogComponent } from '../../shared/turno-confirmation-dialog/turno-confirmation-dialog.component';
// ✅ AGREGAR: Import del ConfirmationDialog
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-carrito-compra',
  standalone: true,
  imports: [
    CommonModule,
    PublicidadSectionComponent,
    MatDialogModule // ✅ AGREGAR
  ],
  templateUrl: './carrito-compra.component.html',
  styleUrl: './carrito-compra.component.scss'
})
export class CarritoCompraComponent implements OnInit, OnDestroy {

  // ✅ Inject de servicios
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private pedidoService = inject(PedidoService);
  private publicidadService = inject(PublicidadService);
  // ✅ AGREGAR: Inject del CatalogoService
  private catalogoService = inject(CatalogoService);
  // ✅ AGREGAR: Inject del diálogo
  private dialog = inject(MatDialog);

  // ✅ AGREGAR: Propiedad computed para obtener productos del carrito
  // productosCarrito = computed(() => {
  //   return this.pedidoService.obtenerProductosParaCarrito();
  // });

  // ✅ NUEVO: Getter normal (más simple)
  get productosCarrito(): any[] {
    const productos = this.pedidoService.obtenerProductosParaCarrito();
    console.log('🛒 Obteniendo productos carrito:', productos);
    return productos;
  }

  // ✅ Propiedades para el template
  get totalPedido(): number {
    return this.pedidoService.total() || 0;
  }

  // ✅ CAMBIAR: Usar el nuevo método del servicio
  get cantidadProductos(): number {
    return this.productosCarrito.length; // ✅ SIN paréntesis
  }

  private productosInfo: Map<number, any> = new Map();

  ngOnInit(): void {
    // ✅ Aplicar mismo fondo que menu
    this.renderer.addClass(document.body, 'fondo-home');

    // ✅ CARGAR información de productos
    this.cargarInformacionProductos();

    console.log('🛒 CarritoCompraComponent inicializado');
    console.log('📋 Detalles del pedido (raw):', this.pedidoService.detalles());
    console.log('📋 Productos del carrito:', this.productosCarrito); // ✅ SIN paréntesis
    console.log('📋 Cantidad productos computed:', this.cantidadProductos);
    console.log('💰 Total del pedido:', this.totalPedido);
    console.log('🔢 Cantidad items del servicio:', this.pedidoService.cantidadItems());
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'fondo-home');
  }

  // ✅ Método para volver al menú
  volverAlMenu(): void {
    console.log('🔙 Volviendo al menú...');
    this.router.navigate(['/cliente/menu']);
  }

  // ✅ Método para finalizar pedido
  finalizarPedido(): void {
    if (this.cantidadProductos === 0) {
      console.log('⚠️ No hay productos para finalizar');
      return;
    }

    console.log('✅ Iniciando proceso de finalización...');
    console.log('📋 Productos:', this.cantidadProductos);
    console.log('💰 Total:', this.totalPedido);

    // ✅ NUEVO: Verificar el tipo de entrega
    const tipoEntrega = this.pedidoService.tipoEntrega();
    console.log('🏪 Tipo de entrega:', tipoEntrega);

    if (tipoEntrega === 'servir') {
      // ✅ COMER AQUÍ: Mostrar popup de turno
      console.log('🍽️ Pedido para comer aquí → Mostrando opción de turno');
      this.mostrarPopupTurno();
    } else if (tipoEntrega === 'llevar') {
      // ✅ PARA LLEVAR: Ir directo al resumen
      console.log('🥡 Pedido para llevar → Directo al resumen (sin turno)');
      this.irDirectoAlResumen();
    } else {
      // ✅ FALLBACK: Si no hay tipo definido, mostrar popup por defecto
      console.warn('⚠️ Tipo de entrega no definido, mostrando popup por defecto');
      this.mostrarPopupTurno();
    }
  }

  // ✅ NUEVO: Método privado para mostrar el popup de turno
  private mostrarPopupTurno(): void {
    console.log('🎯 Abriendo popup de confirmación de turno...');

    const dialogRef = this.dialog.open(TurnoConfirmationDialogComponent, {
      width: '450px',
      disableClose: true,
      panelClass: 'turno-dialog-panel',
      hasBackdrop: true,
      autoFocus: true,
      restoreFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('🎯 Respuesta del diálogo de turno:', result);

      if (result === true) {
        // ✅ Usuario seleccionó "Sí" → Ir a componente Turno
        console.log('✅ Usuario quiere tomar turno → Navegando a Turno');
        this.router.navigate(['/cliente/turno']);
      } else if (result === false) {
        // ✅ Usuario seleccionó "No" → Ir directo al resumen
        console.log('❌ Usuario NO quiere turno → Navegando a Resumen del Pedido');
        this.router.navigate(['/cliente/resumen-pedido']);
      } else {
        // ✅ Diálogo cerrado sin selección (no debería pasar con disableClose)
        console.log('⚠️ Diálogo cerrado sin selección');
      }
    });
  }

  // ✅ NUEVO: Método para ir directo al resumen (para llevar)
  private irDirectoAlResumen(): void {
    console.log('🎯 Navegando directo al resumen del pedido (sin turno)');
    this.router.navigate(['/cliente/resumen-pedido']);
  }

  // ✅ Handler para publicidad (igual que menu)
  onPublicidadCambio(publicidad: Publicidad): void {
    console.log('📺 Nueva publicidad mostrada:', publicidad.nombre);
  }

  // ✅ AGREGAR métodos para manejar los productos

  // ✅ NUEVO: Obtener imagen del producto
  obtenerImagenProducto(item: any): string {
    const id = item.producto_id || item.menu_id;
    const productoInfo = this.productosInfo.get(id);

    if (productoInfo && productoInfo.imagen_url) {
      return productoInfo.imagen_url.startsWith('http')
        ? productoInfo.imagen_url
        : `http://localhost:8000${productoInfo.imagen_url}`;
    }

    return 'assets/cliente/default-product.png';
  }

  // ✅ NUEVO: Obtener nombre del producto
  obtenerNombreProducto(item: any): string {
    const id = item.producto_id || item.menu_id;
    const productoInfo = this.productosInfo.get(id);

    if (productoInfo && productoInfo.nombre) {
      return productoInfo.nombre;
    }

    return `Producto ${id}`; // Fallback
  }

  // ✅ NUEVO: Verificar si tiene personalizaciones
  tienePersonalizaciones(item: any): boolean {
    return (item.personalizacion && item.personalizacion.length > 0) ||
           (item.productos && item.productos.length > 0); // Para menús
  }

  // ✅ NUEVO: Obtener ingredientes agregados
  obtenerIngredientesAgregados(item: any): any[] {
    if (item.personalizacion) {
      return item.personalizacion.filter((p: any) => p.accion === 'agregar');
    }
    return [];
  }

  // ✅ NUEVO: Obtener ingredientes removidos
  obtenerIngredientesRemovidos(item: any): any[] {
    if (item.personalizacion) {
      return item.personalizacion.filter((p: any) => p.accion === 'quitar');
    }
    return [];
  }

  // ✅ NUEVO: Calcular precio total del producto (cantidad × precio unitario)
  calcularPrecioTotalProducto(item: any): number {
    return item.subtotal || (item.precio_unitario * item.cantidad);
  }

  // ✅ NUEVO: Aumentar cantidad de un producto
  aumentarCantidad(index: number): void {
    console.log(`➕ Aumentando cantidad del producto en índice ${index}`);
    this.pedidoService.aumentarCantidadProducto(index);
  }

  // ✅ NUEVO: Disminuir cantidad de un producto
  disminuirCantidad(index: number): void {
    const productos = this.productosCarrito; // ✅ SIN paréntesis
    const item = productos[index];
    if (item && item.cantidad > 1) {
      console.log(`➖ Disminuyendo cantidad del producto en índice ${index}`);
      this.pedidoService.disminuirCantidadProducto(index);
    }
  }

  // ✅ NUEVO: Eliminar producto del carrito
  eliminarProducto(index: number): void {
    const productos = this.productosCarrito;
    const item = productos[index];

    if (!item) {
      console.error('❌ No se encontró el producto en el índice', index);
      return;
    }

    const nombreProducto = this.obtenerNombreProducto(item);
    console.log(`🗑️ Solicitando confirmación para eliminar: ${nombreProducto}`);

    // ✅ NUEVO: Abrir diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: nombreProducto, // ✅ Pasar el nombre del producto
        action: 'delete' // ✅ Acción de eliminar
      }
    });

    // ✅ NUEVO: Manejar la respuesta del diálogo
    dialogRef.afterClosed().subscribe(result => {
      console.log('🎯 Respuesta del diálogo de confirmación:', result);

      if (result === true) {
        // ✅ Usuario confirmó → Eliminar el producto
        console.log(`✅ Confirmado: Eliminando ${nombreProducto} del carrito`);
        this.pedidoService.eliminarProducto(index);

        // ✅ Opcional: Mostrar mensaje de éxito
        console.log(`🗑️ Producto eliminado exitosamente: ${nombreProducto}`);

      } else {
        // ✅ Usuario canceló → No hacer nada
        console.log(`❌ Cancelado: ${nombreProducto} permanece en el carrito`);
      }
    });
  }

  // ✅ CORREGIR: Cantidad de productos en el footer
  get cantidadProductosFooter(): number {
    return this.pedidoService.cantidadItems() || 0;
  }


  // ✅ CORREGIR: Método para cargar información de productos
  private cargarInformacionProductos(): void {
    const productos = this.productosCarrito;  // ✅ Sin paréntesis si es getter
    const idsUnicos = [...new Set(productos.map(p => p.producto_id || p.menu_id).filter(id => id))];

    console.log('📥 Cargando información de productos:', idsUnicos);

    idsUnicos.forEach(id => {
      const numeroId = Number(id);

      if (numeroId && !this.productosInfo.has(numeroId)) {
        this.catalogoService.obtenerProductoPorId(numeroId).subscribe({
          next: (producto) => {
            console.log(`✅ Información cargada para producto ${numeroId}:`, producto);
            this.productosInfo.set(numeroId, producto);
          },
          error: (error) => {
            console.error(`❌ Error cargando producto ${numeroId}:`, error);
            this.productosInfo.set(numeroId, {
              nombre: `Producto ${numeroId}`,
              imagen_url: null
            });
          }
        });
      }
    });
  }


  personalizarProducto(item: any, index: number): void {
    // ✅ VALIDAR que sea un producto, no un menú
    if (!item.producto_id) {
      console.log('⚠️ No se puede personalizar un menú');
      alert('Los menús no se pueden personalizar individualmente');
      return;
    }

    console.log('🎛️ Personalizando producto desde carrito:', item);

    // ✅ USAR ÍNDICE REAL del array de productos del carrito
    const productosCarrito = this.pedidoService.obtenerProductosParaCarrito();
    const productoReal = productosCarrito[index];

    if (!productoReal) {
      console.error('❌ No se encontró el producto en el índice', index);
      return;
    }

    // Guardar datos del producto actual para comparación
    const datosActuales = {
      producto_id: productoReal.producto_id,
      personalizacion: productoReal.personalizacion || [],
      precio_unitario: productoReal.precio_unitario,
      cantidad: productoReal.cantidad,
      carritoIndex: index,
      // ✅ IMPORTANTE: Usar los datos exactos del producto
      subtotal: productoReal.subtotal
    };

    // ✅ NAVEGAR correctamente igual que en el menú
    this.router.navigate(['/cliente/personalizar-producto', productoReal.producto_id], {
      queryParams: {
        modo: 'editar',
        carritoIndex: index,
        cantidad: productoReal.cantidad,
        precio: productoReal.precio_unitario,
        nombre: this.obtenerNombreProducto(productoReal)
      },
      state: {
        datosActuales: datosActuales
      }
    });
  }

}
