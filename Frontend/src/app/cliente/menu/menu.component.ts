import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { CatalogoService } from '../../services/catalogo.service';
import { Producto, Categoria, Menu } from '../../models/catalogo.model'; // Asegúrate de importar Menu
import { catchError, forkJoin, of } from 'rxjs';

// ✅ Interfaz extendida para productos con badges promocionales
interface ProductoConBadge extends Producto {
  promoBadge?: string;
  promoBadgeClass?: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit, OnDestroy {

  // ✅ Signals para datos del backend
  private categorias = signal<Categoria[]>([]);
  private productos = signal<ProductoConBadge[]>([]);
  private menus = signal<Menu[]>([]);

  // ✅ Estados de carga y error
  cargandoCategorias = signal<boolean>(true);
  cargandoProductos = signal<boolean>(true);
  cargandoMenus = signal<boolean>(true);
  errorCarga = signal<string | null>(null);

  // ✅ Estado del componente con signals
  categoriaSeleccionada = signal<number | null>(null);
  mostrarPopupLogin = signal<boolean>(false);
  idioma = signal<string>('es');

  // ✅ Inject moderno Angular 19
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private pedidoService = inject(PedidoService);
  private catalogoService = inject(CatalogoService);

  // ✅ Computed signals
  categoriaActualObj = computed(() =>
    this.categorias().find(cat => cat.id === this.categoriaSeleccionada())
  );

  productosFiltrados = computed(() => {
    const categoriaId = this.categoriaSeleccionada();
    if (!categoriaId) return [];

    const categoriaActual = this.categorias().find(cat => cat.id === categoriaId);

    // Si la categoría es "Combos", mostrar solo menús
    if (categoriaActual && categoriaActual.nombre?.toLowerCase() === 'combos') {
      return this.menus().filter(m => m.estado === 1); // Solo menús activos
    }

    // Para otras categorías, solo productos
    return this.productos().filter(p =>
      p.categoria === categoriaId && p.estado === 1
    );
  });

  // ✅ Estado de carga general
  cargando = computed(() =>
    this.cargandoCategorias() || this.cargandoProductos()
  );

  // ✅ Getters para el template
  get categoriasLista() { return this.categorias(); }
  get categoriaActual() { return this.categoriaActualObj(); }
  get productosActuales() { return this.productosFiltrados(); }
  get mostrarLogin() { return this.mostrarPopupLogin(); }
  get idiomaActual() { return this.idioma(); }
  get estaCargando() { return this.cargando(); }
  get hayError() { return this.errorCarga(); }

  // ✅ Acceso a signals del servicio con valores seguros
  get totalPedidoSeguro(): number {
    return this.pedidoService.total() || 0;
  }

  get cantidadItemsSeguro(): number {
    return this.pedidoService.cantidadItems() || 0;
  }

  get puedeontinuar(): boolean {
    return this.cantidadItemsSeguro > 0;
  }

  // ✅ Acceso directo a signals del servicio
  tipoPedido = this.pedidoService.tipoEntrega;
  resumenPedido = this.pedidoService.resumenPedido;
  totalPedido = this.pedidoService.total;
  cantidadItems = this.pedidoService.cantidadItems;

  ngOnInit() {
    this.renderer.addClass(document.body, 'fondo-home');
    this.cargarDatos();

    console.log('🍽️ MenuComponent inicializado');
    console.log('📝 Tipo de pedido:', this.tipoPedido());
    console.log('📄 Resumen:', this.resumenPedido());
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'fondo-home');
  }

  // ✅ Método para cargar datos del backend
  private cargarDatos(): void {
    this.errorCarga.set(null);

    forkJoin({
      categorias: this.catalogoService.getCategorias().pipe(
        catchError(error => {
          console.error('❌ Error cargando categorías:', error);
          return of([]);
        })
      ),
      productos: this.catalogoService.getProductos().pipe(
        catchError(error => {
          console.error('❌ Error cargando productos:', error);
          return of([]);
        })
      ),
      menus: this.catalogoService.getMenus().pipe(
        catchError(error => {
          console.error('❌ Error cargando menús:', error);
          return of([]);
        })
      )
    }).subscribe({
      next: ({ categorias, productos, menus }) => {
        console.log('✅ Datos cargados:', { categorias: categorias.length, productos: productos.length });

        // Actualizar categorías
        this.categorias.set(categorias);
        this.cargandoCategorias.set(false);

        // Mapea imagen_url a imagenUrl en productos
        const productosConBadges = this.procesarProductosConBadges(
          productos.map(p => ({
            ...p,
            imagenUrl: (p as any).imagenUrl || (p as any).imagen_url || '',
            precio: Number((p as any).precio) || 0
          }))
        );
        this.productos.set(productosConBadges);
        this.cargandoProductos.set(false);

        // Mapea imagen_url a imagenUrl en menús
        const menusConImagen = menus.map(m => ({
          ...m,
          imagenUrl: (m as any).imagenUrl || (m as any).imagen_url || '',
          precio: Number((m as any).precio) || 0
        }));
        this.menus.set(menusConImagen);
        this.cargandoMenus.set(false);

        // Seleccionar primera categoría si hay categorías disponibles
        if (categorias.length > 0 && !this.categoriaSeleccionada()) {
          this.categoriaSeleccionada.set(categorias[0].id);
          console.log('📂 Primera categoría seleccionada:', categorias[0].nombre);
        }
      },
      error: (error) => {
        console.error('❌ Error general cargando datos:', error);
        this.errorCarga.set('Error al cargar los datos del menú');
        this.cargandoCategorias.set(false);
        this.cargandoProductos.set(false);
        this.cargandoMenus.set(false);
      }
    });
  }

  // ✅ Método para procesar productos y agregar badges promocionales
  private procesarProductosConBadges(productos: Producto[]): ProductoConBadge[] {
    return productos.map(producto => {
      const productoConBadge: ProductoConBadge = { ...producto };

      // Lógica para agregar badges promocionales basada en ciertos criterios
      // Puedes personalizar esta lógica según tus necesidades
      if (this.deberíaTenerDescuento(producto)) {
        const descuento = this.calcularDescuento(producto);
        productoConBadge.promoBadge = `${descuento}%`;
        productoConBadge.promoBadgeClass = 'discount';
      }

      return productoConBadge;
    });
  }

  // ✅ Lógica personalizable para determinar si un producto debe tener descuento
  private deberíaTenerDescuento(producto: Producto): boolean {
    // Ejemplo: productos con precio > $5 tienen 10% descuento
    // productos con precio > $8 tienen 15% descuento
    // productos con precio > $10 tienen 20% descuento
    return producto.precio > 5;
  }

  // ✅ Lógica para calcular el porcentaje de descuento
  private calcularDescuento(producto: Producto): number {
    if (producto.precio > 10) return 20;
    if (producto.precio > 8) return 15;
    if (producto.precio > 5) return 10;
    return 0;
  }

  // ✅ Método para recargar datos
  recargarDatos(): void {
    this.cargandoCategorias.set(true);
    this.cargandoProductos.set(true);
    this.cargarDatos();
  }

  seleccionarCategoria(categoria: Categoria): void {
    this.categoriaSeleccionada.set(categoria.id);
    console.log('📂 Categoría seleccionada:', categoria.nombre);
    console.log('🛍️ Productos filtrados:', this.productosFiltrados().length);
  }

  abrirLoginPopup(): void {
    this.mostrarPopupLogin.set(true);
  }

  cerrarPopupLogin(): void {
    this.mostrarPopupLogin.set(false);
  }

  cambiarIdioma(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.idioma.set(target.value);
    console.log('🌐 Idioma cambiado a:', target.value);
  }

  agregarProducto(producto: ProductoConBadge | Menu): void {
    console.log('🛒 Agregando producto o menú:', producto.nombre);

    // Usa el precio correcto según el tipo
    const precio = 'precio' in producto ? producto.precio : 0;

    this.pedidoService.agregarProducto(
      producto.id,
      precio,
      1
    );

    console.log('✅ Producto o menú agregado. Total actual:', this.totalPedidoSeguro);
  }

  // ✅ MÉTODO AGREGADO: limpiarPedido
  limpiarPedido(): void {
    this.pedidoService.limpiarPedido();
    console.log('🗑️ Pedido cancelado desde MenuComponent');
  }

  continuar(): void {
    const total = this.totalPedidoSeguro;
    const cantidad = this.cantidadItemsSeguro;

    if (cantidad > 0) {
      console.log(`🚀 Continuando con ${cantidad} productos, total: $${total}`);
      this.router.navigate(['/cliente/carrito']);
    } else {
      console.log('⚠️ No hay productos en el pedido');
    }
  }

  // Cambia el método para obtener la imagen de menú o producto
  obtenerImagenProducto(producto: ProductoConBadge | Menu): string {
    if ('imagenUrl' in producto && producto.imagenUrl) {
      return this.catalogoService.getFullImageUrl(producto.imagenUrl);
    }
    return 'assets/placeholder-producto.png';
  }

  obtenerImagenCategoria(categoria: Categoria): string {
    // Usar el método del servicio para obtener la URL completa de la imagen
    if (categoria.imagen_url) {
      return this.catalogoService.getFullImageUrl(categoria.imagen_url);
    }
    return 'assets/placeholder-categoria.png';
  }

  tienePromoBadge(obj: any): obj is ProductoConBadge {
    return 'promoBadge' in obj && !!obj.promoBadge;
  }
}
