import { Component, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { PublicidadService } from '../../services/publicidad.service';
import { CatalogoService } from '../../services/catalogo.service';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';

@Component({
  selector: 'app-carrito-compra',
  standalone: true,
  imports: [
    CommonModule,
    PublicidadSectionComponent
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

    console.log('✅ Finalizando pedido...');
    console.log('📋 Productos:', this.cantidadProductos);
    console.log('💰 Total:', this.totalPedido);

    // ✅ TODO: Aquí irá la lógica para finalizar el pedido
    // Por ahora solo mostrar un alert
    alert(`¡Pedido finalizado!\nProductos: ${this.cantidadProductos}\nTotal: $${this.totalPedido.toFixed(2)}`);
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
    const productos = this.productosCarrito; // ✅ SIN paréntesis
    const item = productos[index];
    if (item) {
      const nombreProducto = this.obtenerNombreProducto(item);
      const confirmacion = confirm(`¿Eliminar ${nombreProducto} del carrito?`);
      if (confirmacion) {
        console.log(`🗑️ Eliminando producto: ${nombreProducto}`);
        this.pedidoService.eliminarProducto(index);
      }
    }
  }

  // ✅ CORREGIR: Cantidad de productos en el footer
  get cantidadProductosFooter(): number {
    return this.pedidoService.cantidadItems() || 0;
  }

  // ✅ AGREGAR: Método temporal para verificar datos
  verificarDatos(): void {
    console.log('🔍 VERIFICACIÓN COMPLETA:');
    console.log('   - Detalles raw:', this.pedidoService.detalles());
    console.log('   - Productos carrito:', this.productosCarrito); // ✅ SIN paréntesis
    console.log('   - Cantidad productos:', this.cantidadProductos);
    console.log('   - Total pedido:', this.totalPedido);
    console.log('   - Cantidad items servicio:', this.pedidoService.cantidadItems());
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
}
