import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { CatalogoService } from '../../services/catalogo.service';
import { PublicidadService } from '../../services/publicidad.service'; // <-- Agrega esto
import { Producto, Categoria, Menu } from '../../models/catalogo.model'; // Asegúrate de importar Menu
import { catchError, forkJoin, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ProductPopupComponent, ProductPopupData, ProductPopupResult } from '../../shared/product-popup/product-popup.component';

// ✅ Interfaz extendida para productos con badges promocionales
interface ProductoConBadge extends Producto {
  promoBadge?: string;
  promoBadgeClass?: string;
}

// ✅ Interfaz extendida para menús con badges promocionales
interface ItemConBadge extends Menu {
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
  private publicidadService = inject(PublicidadService); // <-- Agrega esto
  private dialog = inject(MatDialog);

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

  // ✅ NUEVO: Propiedad para manejar productos seleccionados
  productosSeleccionados = signal<Set<number>>(new Set());

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

    // Primero obtenemos los estados
    this.catalogoService.getEstados().pipe(
      catchError(error => of([]))
    ).subscribe(estados => {
      const estadoActivado = estados.find((e: any) => e.nombre === 'Activado');
      const idEstadoActivado = estadoActivado ? estadoActivado.id : null;

      forkJoin({
        categorias: this.catalogoService.getCategorias().pipe(
          catchError(error => of([]))
        ),
        productos: this.catalogoService.getProductos().pipe(
          catchError(error => of([]))
        ),
        menus: this.catalogoService.getMenus().pipe(
          catchError(error => of([]))
        ),
        promociones: this.publicidadService.getPromociones().pipe(
          catchError(error => of([]))
        )
      }).subscribe({
        next: ({ categorias, productos, menus, promociones }) => {
          console.log('✅ Datos cargados:', { categorias: categorias.length, productos: productos.length });

          // Actualizar categorías
          this.categorias.set(categorias);
          this.cargandoCategorias.set(false);

          // Filtra solo promociones activas por id
          const promocionesActivas = (promociones as any[]).filter((p: any) => p.estado === idEstadoActivado);
          console.log('🔴 Promociones activas:', promocionesActivas);

          // Procesar productos con badges de promociones activas
          const productosConBadges = this.procesarProductosConBadges(
            productos.map(p => ({
              ...p,
              imagenUrl: (p as any).imagenUrl || (p as any).imagen_url || '',
              precio: Number((p as any).precio) || 0
            })),
            promocionesActivas
          );
          this.productos.set(productosConBadges);
          this.cargandoProductos.set(false);

          // Mapea imagen_url a imagenUrl en menús y agrega productosLista
          const menusConImagen = menus.map(m => ({
            ...m,
            imagenUrl: (m as any).imagenUrl || (m as any).imagen_url || '',
            precio: Number((m as any).precio) || 0,
            productosLista: this.getProductosLista(m)
          }));

          // Procesar menús con badge si están en promoción activa
          const menusConBadge: ItemConBadge[] = menusConImagen.map((menu) => {
            const promosMenu = promocionesActivas.filter((p: any) =>
              Array.isArray(p.menus_detalle) &&
              p.menus_detalle.some((m: any) =>
                (m.menu && m.menu.id === menu.id) ||
                (m.menu_id === menu.id) ||
                (m.id === menu.id) // por si viene como id directo
              )
            );

            if (promosMenu.length > 0) {
              const mayorDescuento = Math.max(...promosMenu.map((p: any) => Number(p.valor_descuento) || 0));
              console.log(`🟢 Menú con promo: ${menu.nombre} (ID: ${menu.id}) - Descuento: ${mayorDescuento}%`);
              return {
                ...menu,
                promoBadge: `-${mayorDescuento}%`,
                promoBadgeClass: 'discount'
              };
            }
            return menu;
          });

          this.menus.set(menusConBadge);
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
    });
  }

  // Copia este método del admin para formatear la lista de productos de un menú
  getProductosLista(menu: any): string[] {
    if (!menu.productos_detalle || !Array.isArray(menu.productos_detalle)) return [];
    return menu.productos_detalle.map((p: any) => {
      const cantidad = p.cantidad || 1;
      const nombre = p.nombre || p.producto_nombre || (p.producto?.nombre ?? '');
      let tamano = '';
      if (p.tamano_codigo) {
        tamano = `(${p.tamano_codigo})`;
      } else if (p.tamano_nombre) {
        tamano = `(${p.tamano_nombre.charAt(0).toUpperCase()})`;
      }
      let cantidadStr = cantidad > 1 ? `(x${cantidad})` : '';
      return `- ${nombre} ${cantidadStr}${tamano}`.trim();
    });
  }

  // ✅ Método para procesar productos y agregar badges promocionales
  private procesarProductosConBadges(productos: Producto[], promocionesActivas: any[]): ProductoConBadge[] {
    return productos.map(producto => {
      const productoConBadge: ProductoConBadge = { ...producto };

      // Buscar TODAS las promociones activas que incluyan este producto
      const promosProducto = promocionesActivas.filter((p: any) =>
        Array.isArray(p.productos_detalle) &&
        p.productos_detalle.some((prod: any) =>
          (prod.producto && prod.producto.id === producto.id) ||
          (prod.producto_id === producto.id) // por si viene como producto_id
        )
      );

      if (promosProducto.length > 0) {
        const mayorDescuento = Math.max(...promosProducto.map((p: any) => Number(p.valor_descuento) || 0));
        productoConBadge.promoBadge = `-${mayorDescuento}%`;
        productoConBadge.promoBadgeClass = 'discount';
        console.log(`🟢 Producto con promo: ${producto.nombre} (ID: ${producto.id}) - Descuento: ${mayorDescuento}%`);
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

  // ✅ SEPARAR: Método para solo seleccionar visualmente (sin agregar al carrito)
  seleccionarProducto(producto: ProductoConBadge | Menu): void {
    const productosSeleccionadosActuales = new Set(this.productosSeleccionados());

    if (productosSeleccionadosActuales.has(producto.id)) {
      // Si ya está seleccionado, deseleccionarlo
      productosSeleccionadosActuales.delete(producto.id);
    } else {
      // Si no está seleccionado, seleccionarlo
      productosSeleccionadosActuales.add(producto.id);
    }

    this.productosSeleccionados.set(productosSeleccionadosActuales);
  }

  // ✅ RESTAURAR: El método agregarProducto solo para agregar al carrito
  agregarProducto(producto: ProductoConBadge | Menu, event?: Event): void {
    // Prevenir que el clic se propague al contenedor padre
    if (event) {
      event.stopPropagation();
    }

    // ✅ NUEVO: Mostrar popup antes de agregar al carrito
    this.mostrarPopupProducto(producto);
  }

  // ✅ NUEVO: Método para mostrar popup de producto
  private mostrarPopupProducto(producto: ProductoConBadge | Menu): void {
    const imagenUrl = this.obtenerImagenProducto(producto);

    // Determinar si debe permitir personalización (solo para ciertos productos)
    const permitirPersonalizacion = this.debePermitirPersonalizacion(producto);

    const dialogData: ProductPopupData = {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagenUrl: imagenUrl,
        categoria: (producto as ProductoConBadge).categoria,
        descripcion: (producto as ProductoConBadge).descripcion
      },
      imagenUrl: imagenUrl,
      permitirPersonalizacion: permitirPersonalizacion
    };

    const dialogRef = this.dialog.open(ProductPopupComponent, {
      data: dialogData,
      disableClose: false,
      panelClass: 'product-popup-dialog',
      maxWidth: '450px',
      width: '90%'
    });

    dialogRef.afterClosed().subscribe((resultado: ProductPopupResult) => {
      if (resultado) {
        this.procesarResultadoPopup(producto, resultado);
      }
    });
  }

  // ✅ NUEVO: Procesar resultado del popup
  private procesarResultadoPopup(producto: ProductoConBadge | Menu, resultado: ProductPopupResult): void {
    switch (resultado.accion) {
      case 'agregar':
        this.agregarProductoAlCarrito(producto, resultado.cantidad);
        break;

      case 'personalizar':
        this.irAPersonalizar(producto, resultado.cantidad);
        break;

      case 'cancelar':
        // No hacer nada
        break;
    }
  }

  // ✅ NUEVO: Agregar producto al carrito con cantidad específica
  private agregarProductoAlCarrito(producto: ProductoConBadge | Menu, cantidad: number): void {
    if (this.esMenu(producto)) {
      this.pedidoService.agregarProducto(producto.id, producto.precio, cantidad);
    } else {
      if (producto.aplica_tamanos && producto.tamanos_detalle && producto.tamanos_detalle.length > 1) {
        // Para productos con múltiples tamaños, usar el primer tamaño por ahora
        // Podrías expandir esto para permitir seleccionar tamaño en el popup
        const tamanoDefault = producto.tamanos_detalle[0];
        this.pedidoService.agregarProducto(producto.id, tamanoDefault.precio, cantidad);
      } else {
        const precio = this.calcularPrecioFinal(producto);
        this.pedidoService.agregarProducto(producto.id, precio, cantidad);
      }
    }
  }

  // ✅ NUEVO: Ir a personalizar producto
  private irAPersonalizar(producto: ProductoConBadge | Menu, cantidad: number): void {
    console.log(`🎨 Navegando a personalizar ${producto.nombre} con cantidad ${cantidad}`);

    // Navegar al componente personalizar-producto
    this.router.navigate(['/cliente/personalizar-producto', producto.id], {
      queryParams: {
        cantidad: cantidad,
        // Datos adicionales útiles para la personalización
        nombre: producto.nombre,
        precio: producto.precio,
        categoria: (producto as ProductoConBadge).categoria || null
      }
    });
  }

  // ✅ NUEVO: Determinar si un producto permite personalización
  private debePermitirPersonalizacion(producto: ProductoConBadge | Menu): boolean {
    // Si es menú, no permitir personalización
    if (this.esMenu(producto)) {
      return false;
    }

    // Permitir personalización para ciertas categorías
    const categoriasPersonalizables = ['Hamburguesa', 'Pizza', 'Ensalada'];
    const categoriaActual = this.categorias().find(cat => cat.id === (producto as ProductoConBadge).categoria);

    return categoriaActual ? categoriasPersonalizables.includes(categoriaActual.nombre) : false;
  }

  // ✅ AGREGAR: Método para verificar si está seleccionado
  estaSeleccionado(producto: ProductoConBadge | Menu): boolean {
    return this.productosSeleccionados().has(producto.id);
  }
}
