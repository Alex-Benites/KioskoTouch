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
  const todosLosProductos = this.productos();
  
  console.log('🔍 DEBUG FILTRADO:');
  console.log('  - Categoría seleccionada ID:', categoriaId);
  console.log('  - Total productos:', todosLosProductos.length);
  console.log('  - Productos con campo activo:', todosLosProductos.map(p => ({ 
    id: p.id, 
    nombre: p.nombre, 
    categoria: p.categoria, 
    estado: p.estado,
    activo: (p as any).activo  // ✅ Verificar el nuevo campo
  })));
  
  if (!categoriaId) return [];

  const categoriaActual = this.categorias().find(cat => cat.id === categoriaId);

  // Si la categoría es "Combos", mostrar solo menús
  if (categoriaActual && categoriaActual.nombre?.toLowerCase() === 'combos') {
    const menusFiltrados = this.menus().filter(m => (m as any).activo !== false);
    console.log('  - Menús filtrados:', menusFiltrados.length);
    return menusFiltrados;
  }

  // Para otras categorías, solo productos
  const productosFiltrados = todosLosProductos.filter(p => {
    const coincideCategoria = p.categoria === categoriaId;
    const estaActivo = (p as any).activo !== false; // ✅ Usar campo activo
    console.log(`  - Producto ${p.nombre}: categoria=${p.categoria}, activo=${(p as any).activo}, coincide=${coincideCategoria}, pasa=${coincideCategoria && estaActivo}`);
    return coincideCategoria && estaActivo;
  });
  
  console.log('  - Productos filtrados finales:', productosFiltrados.length);
  return productosFiltrados;
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

  limpiarPedido(): void {
    this.pedidoService.limpiarPedido();
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

  // ✅ Método para obtener el precio a mostrar
  obtenerPrecioMostrar(producto: ProductoConBadge): number {
    // Si tiene precio_base (productos con tamaños), usar ese
    if ((producto as any).precio_base !== undefined) {
      return (producto as any).precio_base;
    }
    // Si no, usar precio normal
    return producto.precio;
  }

  // ✅ Método para obtener texto de precio de PRODUCTOS
  obtenerTextoPrecio(item: ProductoConBadge | Menu): string {
    // Si es un menú, devolver precio simple
    if (this.esMenu(item)) {
      return `$${item.precio.toFixed(2)}`;
    }
    
    // Si es producto, usar lógica de tamaños
    const producto = item as ProductoConBadge;
    if (producto.aplica_tamanos && producto.tamanos_detalle && producto.tamanos_detalle.length > 0) {
      const precioMin = Math.min(...producto.tamanos_detalle.map(t => t.precio));
      const precioMax = Math.max(...producto.tamanos_detalle.map(t => t.precio));
      
      if (precioMin === precioMax) {
        return `$${precioMin.toFixed(2)}`;
      } else {
        return `Desde $${precioMin.toFixed(2)}`;
      }
    }
    
    return `$${this.obtenerPrecioMostrar(producto).toFixed(2)}`;
  }

  // ✅ NUEVO: Método para obtener texto de precio de MENÚS
  obtenerTextoPrecioMenu(menu: Menu): string {
    return `$${menu.precio.toFixed(2)}`;
  }

  // ✅ NUEVO: Método genérico que funciona para ambos
  obtenerTextoPrecioGenerico(item: ProductoConBadge | Menu): string {
    if (this.esMenu(item)) {
      return this.obtenerTextoPrecioMenu(item);
    } else {
      return this.obtenerTextoPrecio(item);
    }
  }

  // ✅ Método mejorado para agregar producto (SIN agregarMenu)
  agregarProducto(producto: ProductoConBadge | Menu): void {
    if (this.esMenu(producto)) {
      // ✅ TRATAR MENÚS COMO PRODUCTOS NORMALES
      this.pedidoService.agregarProducto(producto.id, producto.precio, 1);
    } else {
      // Para productos con tamaños, mostrar selector de tamaño
      if (producto.aplica_tamanos && producto.tamanos_detalle && producto.tamanos_detalle.length > 1) {
        this.mostrarSelectorTamano(producto);
      } else {
        // Producto simple o con un solo tamaño
        const precio = this.calcularPrecioFinal(producto);
        this.pedidoService.agregarProducto(producto.id, precio, 1);
      }
    }
  }

  // ✅ Método auxiliar para calcular precio final
  private calcularPrecioFinal(producto: ProductoConBadge): number {
    if (producto.aplica_tamanos && producto.tamanos_detalle && producto.tamanos_detalle.length === 1) {
      return producto.tamanos_detalle[0].precio;
    }
    return this.obtenerPrecioMostrar(producto);
  }

  // ✅ Nuevo método para mostrar selector de tamaño
  private mostrarSelectorTamano(producto: ProductoConBadge): void {
    // Aquí podrías abrir un modal/popup para seleccionar tamaño
    // Por ahora, agregar el tamaño más pequeño por defecto
    if (producto.tamanos_detalle && producto.tamanos_detalle.length > 0) {
      const tamanoDefault = producto.tamanos_detalle[0]; // El más pequeño (orden)
      this.pedidoService.agregarProducto(producto.id, tamanoDefault.precio, 1);
    }
  }

  // ✅ Método auxiliar para verificar si es menú
  private esMenu(item: ProductoConBadge | Menu): item is Menu {
    return 'tipo_menu' in item;
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
