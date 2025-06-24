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
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

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
  imports: [
    CommonModule,
     FormsModule,
     PublicidadSectionComponent
  ],
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

  // ✅ CAMBIAR: El botón siempre está habilitado para navegación
  get puedeContinuar(): boolean {
    return true; // ✅ SIEMPRE permitir navegación libre
  }

  // ✅ Acceso directo a signals del servicio
  tipoPedido = this.pedidoService.tipoEntrega;
  resumenPedido = this.pedidoService.resumenPedido;
  totalPedido = this.pedidoService.total;
  cantidadItems = this.pedidoService.cantidadItems;

  // ✅ NUEVO: Propiedad para manejar productos seleccionados
  productosSeleccionados = signal<number | null>(null); // Solo un producto seleccionado

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
          const promocionesActivas = (promociones as any[]).filter((p: any) =>
  p.estado === idEstadoActivado &&
  (!p.codigo_promocional || String(p.codigo_promocional).trim() === '')
);
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

  cancelarPedido(): void {
    console.log('🗑️ Solicitando confirmación para cancelar pedido completo...');

    // ✅ NUEVO: Abrir diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: 'PEDIDO COMPLETO',
        action: 'delete',
        context: 'pedido', // ✅ Contexto específico para pedido
      },
    });

    // ✅ NUEVO: Manejar la respuesta del diálogo
    dialogRef.afterClosed().subscribe((result) => {
      console.log('🎯 Respuesta del diálogo de cancelación:', result);

      if (result === true) {
        // ✅ Usuario confirmó → Cancelar pedido completo
        console.log('✅ Confirmado: Cancelando pedido completo...');
        console.log('🏠 Regresando al home...');

        // ✅ Regresar al home
        this.router.navigate(['/cliente/home']);
      } else {
        // ✅ Usuario canceló → No hacer nada
        console.log('❌ Cancelado: El pedido permanece activo');
      }
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

  // ✅ Método para obtener el precio a mostrar
  obtenerPrecioMostrar(producto: ProductoConBadge): number {
    // Si tiene precio_base (productos con tamaños), usar ese
    if ((producto as any).precio_base !== undefined) {
      return (producto as any).precio_base;
    }
    // Si no, usar precio normal
    return producto.precio;
  }

  // ✅ MEJORAR: Método obtenerTextoPrecio para mejor manejo de tamaños
  obtenerTextoPrecio(item: ProductoConBadge | Menu): string {
    // Si es un menú, devolver precio simple
    if (this.esMenu(item)) {
      return `$${item.precio.toFixed(2)}`;
    }

    // Si es producto, usar lógica de tamaños
    const producto = item as ProductoConBadge;

    // ✅ DEBUG: Log para verificar datos de tamaños
    if (producto.aplica_tamanos) {
      this.debugTamanos(producto);
    }

    if (producto.aplica_tamanos && producto.tamanos_detalle && producto.tamanos_detalle.length > 0) {
      const precios = producto.tamanos_detalle.map(t => t.precio);
      const precioMin = Math.min(...precios);
      const precioMax = Math.max(...precios);

      if (precioMin === precioMax) {
        return `$${precioMin.toFixed(2)}`;
      } else {
        return `$${precioMin.toFixed(2)} - $${precioMax.toFixed(2)}`;
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
 esMenu(item: ProductoConBadge | Menu): item is Menu {
    return 'tipo_menu' in item;
  }

  // ✅ CAMBIAR: Permitir navegación libre sin productos
  continuar(): void {

    // ✅ NUEVO: Navegación libre siempre permitida
    if (this.esUltimaCategoria()) {
      // Si es la última categoría y HAY productos, ir al carrito
      if (this.cantidadItemsSeguro > 0) {
        console.log('🛒 Hay productos, navegando al carrito');
        this.router.navigate(['/cliente/carrito']);
      } else {
        // Si es la última categoría pero NO hay productos, volver al inicio
        console.log('🏠 No hay productos, volviendo al menú principal (primera categoría)');
        const primeraCategoria = this.categorias()[0];
        if (primeraCategoria) {
          this.seleccionarCategoria(primeraCategoria);
        }
      }
    } else {
      // Si no es la última, ir a la siguiente categoría (SIEMPRE)
      const siguienteCategoria = this.obtenerSiguienteCategoria();

      if (siguienteCategoria) {
        console.log(`📂 Navegando a la siguiente categoría: ${siguienteCategoria.nombre}`);
        this.seleccionarCategoria(siguienteCategoria);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.log('🛒 Fallback: navegando al carrito');
        this.router.navigate(['/cliente/carrito']);
      }
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
    const productoActualSeleccionado = this.productosSeleccionados();

    if (productoActualSeleccionado === producto.id) {
      // Si el mismo producto ya está seleccionado, deseleccionarlo
      this.productosSeleccionados.set(null);
      console.log(`🔄 Deseleccionado: ${producto.nombre}`);
    } else {
      // Seleccionar el nuevo producto (automáticamente deselecciona el anterior)
      this.productosSeleccionados.set(producto.id);
      console.log(`✅ Seleccionado: ${producto.nombre} (deseleccionó el anterior)`);
    }
  }

  // ✅ RESTAURAR: El método agregarProducto solo para agregar al carrito
  private mostrarPopupProducto(producto: ProductoConBadge | Menu): void {
    const imagenUrl = this.obtenerImagenProducto(producto);
    const permitirPersonalizacion = this.debePermitirPersonalizacion(producto);

    const dialogData: ProductPopupData = {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagenUrl: imagenUrl,
        categoria: (producto as ProductoConBadge).categoria,
        descripcion: (producto as ProductoConBadge).descripcion,

        // ✅ CORREGIR: Usar campos correctos de ProductoTamano
        aplica_tamanos: (producto as ProductoConBadge).aplica_tamanos,
        tamanos_detalle: (producto as ProductoConBadge).tamanos_detalle?.map(t => ({
          id: t.id,
          tamano_nombre: t.nombre_tamano,        // ✅ USAR: tamano_nombre (ya existe)
          codigo_tamano: t.codigo_tamano,       // ✅ USAR: codigo_tamano (ya existe)
          precio: t.precio
        }))
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

  // ✅ MODIFICAR: Procesar resultado del popup con información de tamaño
  private procesarResultadoPopup(producto: ProductoConBadge | Menu, resultado: ProductPopupResult): void {
    switch (resultado.accion) {
      case 'agregar':
        this.agregarProductoAlCarrito(producto, resultado.cantidad, resultado.tamanoSeleccionado);
        break;

      case 'personalizar':
        this.irAPersonalizar(producto, resultado.cantidad, resultado.tamanoSeleccionado);
        break;

      case 'cancelar':
        // No hacer nada
        break;
    }
  }


  // ✅ MODIFICAR: Agregar producto al carrito con tamaño seleccionado
  private agregarProductoAlCarrito(producto: ProductoConBadge | Menu, cantidad: number, tamanoSeleccionado?: any): void {
    if (this.esMenu(producto)) {
      // Ahora usa agregarMenu
      this.pedidoService.agregarMenu(producto.id, producto.precio, cantidad, []);
      console.log(`🍽️ Menú agregado: ${producto.nombre} x${cantidad} - $${(producto.precio * cantidad).toFixed(2)}`);
    } else {
      let precio = producto.precio;
      let descripcionExtra = '';

      if (tamanoSeleccionado) {
        precio = tamanoSeleccionado.precio;
        descripcionExtra = ` (${tamanoSeleccionado.codigo})`;
        console.log(`📏 Producto con tamaño seleccionado: ${tamanoSeleccionado.codigo} - $${precio}`);
      }
      else if (producto.aplica_tamanos && producto.tamanos_detalle && producto.tamanos_detalle.length > 0) {
        const primerTamano = producto.tamanos_detalle[0];
        precio = primerTamano.precio;
        descripcionExtra = ` (${primerTamano.codigo_tamano})`;
        console.log(`📏 Usando primer tamaño por defecto: ${primerTamano.codigo_tamano} - $${precio}`);
      }
      else {
        precio = this.calcularPrecioFinal(producto);
        console.log(`💰 Usando precio base: $${precio}`);
      }

      this.pedidoService.agregarProducto(producto.id, precio, cantidad);
      console.log(`🛒 Producto agregado: ${producto.nombre}${descripcionExtra} x${cantidad} - $${(precio * cantidad).toFixed(2)}`);
    }

    // Mostrar el detalle del pedido en consola
    console.log('📝 Detalle actual del pedido:', this.pedidoService.detalles());
  }

  // ✅ MODIFICAR: Ir a personalizar con información de tamaño
  private irAPersonalizar(producto: ProductoConBadge | Menu, cantidad: number, tamanoSeleccionado?: any): void {
    console.log(`🎨 Navegando a personalizar ${producto.nombre} con cantidad ${cantidad}`);

    const queryParams: any = {
      cantidad: cantidad,
      nombre: producto.nombre,
      precio: producto.precio,
      categoria: (producto as ProductoConBadge).categoria || null
    };

    if (tamanoSeleccionado) {
      queryParams.tamano_id = tamanoSeleccionado.id;
      queryParams.tamano_codigo = tamanoSeleccionado.codigo;    // ✅ CAMBIAR: codigo_tamano → codigo
      queryParams.tamano_precio = tamanoSeleccionado.precio;
      console.log(`📏 Personalizando con tamaño: ${tamanoSeleccionado.codigo} - $${tamanoSeleccionado.precio}`);
    }

    this.router.navigate(['/cliente/personalizar-producto', producto.id], {
      queryParams: queryParams
    });
  }



  private debePermitirPersonalizacion(producto: ProductoConBadge | Menu): boolean {
    // Si es menú (combo), no permitir personalización
    if (this.esMenu(producto)) {
      return false;
    }

    // Excluir categorías no personalizables
    const categoriasNoPersonalizables = ['Bebidas', 'Extras', 'Postres'];
    const categoriaActual = this.categorias().find(cat => cat.id === (producto as ProductoConBadge).categoria);
    return categoriaActual ? !categoriasNoPersonalizables.includes(categoriaActual.nombre) : true;
  }

  // ✅ AGREGAR: Método para verificar si está seleccionado
  estaSeleccionado(producto: ProductoConBadge | Menu): boolean {
    return this.productosSeleccionados() === producto.id;
  }

  // ✅ NUEVO: Método para obtener la siguiente categoría en secuencia
  private obtenerSiguienteCategoria(): Categoria | null {
    const categoriasActuales = this.categorias();
    const categoriaActualId = this.categoriaSeleccionada();

    if (!categoriaActualId || categoriasActuales.length === 0) {
      return null;
    }

    // Encontrar el índice de la categoría actual
    const indiceActual = categoriasActuales.findIndex(cat => cat.id === categoriaActualId);

    if (indiceActual === -1) {
      return null;
    }

    // Si no es la última categoría, devolver la siguiente
    if (indiceActual < categoriasActuales.length - 1) {
      const siguienteCategoria = categoriasActuales[indiceActual + 1];
      console.log(`📂 Siguiente categoría: ${siguienteCategoria.nombre}`);
      return siguienteCategoria;
    }

    // Si es la última categoría, devolver null (para ir al carrito)
    console.log('🏁 Es la última categoría, ir al carrito');
    return null;
  }

  // ✅ NUEVO: Computed para saber si estamos en la última categoría
  esUltimaCategoria = computed(() => {
    const categoriasActuales = this.categorias();
    const categoriaActualId = this.categoriaSeleccionada();

    if (!categoriaActualId || categoriasActuales.length === 0) {
      return false;
    }

    const indiceActual = categoriasActuales.findIndex(cat => cat.id === categoriaActualId);
    return indiceActual === categoriasActuales.length - 1;
  });

  // ✅ MEJORAR: Texto del botón más inteligente
  textoBotoncontinuar = computed(() => {
    if (this.esUltimaCategoria()) {
      // En la última categoría
      return this.cantidadItemsSeguro > 0 ? 'Ir a Carrito' : 'Continuar';
    } else {
      // En categorías intermedias
      return 'Continuar';
    }
  });


  // ✅ AGREGAR: Método para obtener información de debug de tamaños
  private debugTamanos(producto: ProductoConBadge): void {
    console.log('🔍 DEBUG TAMAÑOS:', {
      nombre: producto.nombre,
      aplica_tamanos: producto.aplica_tamanos,
      tiene_tamanos_detalle: !!(producto.tamanos_detalle && producto.tamanos_detalle.length > 0),
      tamanos_count: producto.tamanos_detalle?.length || 0,
      tamanos: producto.tamanos_detalle?.map(t => ({
        codigo: t.codigo_tamano,        // ✅ USAR: codigo_tamano
        nombre: t.nombre_tamano,        // ✅ USAR: tamano_nombre
        precio: t.precio
      }))
    });
  }


  agregarProducto(producto: ProductoConBadge | Menu, event?: Event): void {
    // Prevenir que el clic se propague al contenedor padre
    if (event) {
      event.stopPropagation();
    }

    // ✅ NUEVO: Mostrar popup antes de agregar al carrito
    this.mostrarPopupProducto(producto);
  }

  onPublicidadCambio(publicidad: Publicidad): void {
    console.log('📺 Nueva publicidad mostrada:', publicidad.nombre);
    // Aquí puedes agregar lógica adicional como analytics
  }

}
