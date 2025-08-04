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
import { MatIconModule } from '@angular/material/icon';

interface ProductoConBadge extends Producto {
  promoBadge?: string;
  promoBadgeClass?: string;
}

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
     PublicidadSectionComponent,
      MatIconModule,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit, OnDestroy {

  private categorias = signal<Categoria[]>([]);
  private productos = signal<ProductoConBadge[]>([]);
  private menus = signal<Menu[]>([]);
  private promocionesActivas = signal<any[]>([]);

  cargandoCategorias = signal<boolean>(true);
  cargandoProductos = signal<boolean>(true);
  cargandoMenus = signal<boolean>(true);
  errorCarga = signal<string | null>(null);

  categoriaSeleccionada = signal<number | null>(null);
  mostrarPopupLogin = signal<boolean>(false);
  idioma = signal<string>('es');

  private router = inject(Router);
  private renderer = inject(Renderer2);
  private pedidoService = inject(PedidoService);
  private catalogoService = inject(CatalogoService);
  private publicidadService = inject(PublicidadService); // <-- Agrega esto
  private dialog = inject(MatDialog);

  categoriaActualObj = computed(() =>
    this.categorias().find(cat => cat.id === this.categoriaSeleccionada())
  );

  productosFiltrados = computed(() => {
  const categoriaId = this.categoriaSeleccionada();
  const todosLosProductos = this.productos();


  if (!categoriaId) return [];

  const categoriaActual = this.categorias().find(cat => cat.id === categoriaId);

  // Si la categoría es "Combos", mostrar solo menús
  if (categoriaActual && categoriaActual.nombre?.toLowerCase() === 'combos') {
    const menusFiltrados = this.menus().filter(m => (m as any).activo !== false);
    return menusFiltrados;
  }

  // Para otras categorías, solo productos
  const productosFiltrados = todosLosProductos.filter(p => {
    const coincideCategoria = p.categoria === categoriaId;
    const estaActivo = (p as any).activo !== false;
    return coincideCategoria && estaActivo;
  });

  return productosFiltrados;
});

  cargando = computed(() =>
    this.cargandoCategorias() || this.cargandoProductos()
  );

  get categoriasLista() { return this.categorias(); }
  get categoriaActual() { return this.categoriaActualObj(); }
  get productosActuales() { return this.productosFiltrados(); }
  get mostrarLogin() { return this.mostrarPopupLogin(); }
  get idiomaActual() { return this.idioma(); }
  get estaCargando() { return this.cargando(); }
  get hayError() { return this.errorCarga(); }

  get totalPedidoSeguro(): number {
    return this.pedidoService.total() || 0;
  }

  get cantidadItemsSeguro(): number {
    return this.pedidoService.cantidadItems() || 0;
  }

  get puedeContinuar(): boolean {
    return true;
  }

  tipoPedido = this.pedidoService.tipoEntrega;
  resumenPedido = this.pedidoService.resumenPedido;
  totalPedido = this.pedidoService.total;
  cantidadItems = this.pedidoService.cantidadItems;

  productosSeleccionados = signal<number | null>(null); // Solo un producto seleccionado

  ngOnInit() {
    this.renderer.addClass(document.body, 'fondo-home');
    this.cargarDatos();

  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'fondo-home');
  }

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

          // Actualizar categorías
          this.categorias.set(categorias);
          this.cargandoCategorias.set(false);

          // Filtra solo promociones activas por id
          const promocionesActivas = (promociones as any[]).filter((p: any) =>
  p.estado === idEstadoActivado &&
  (!p.codigo_promocional || String(p.codigo_promocional).trim() === '')
);

          // Guardar promociones activas en estado
          this.promocionesActivas.set(promocionesActivas);

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
          }
        },
        error: (error) => {
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
      return `${nombre} ${cantidadStr}${tamano}`.trim();
    });
  }

  private procesarProductosConBadges(productos: Producto[], promocionesActivas: any[]): ProductoConBadge[] {
    return productos.map(producto => {
      const productoConBadge: ProductoConBadge = { ...producto };

      // ✅ MEJORADO: Buscar promociones considerando tamaños específicos
      const promosProducto = promocionesActivas.filter((p: any) =>
        Array.isArray(p.productos_detalle) &&
        p.productos_detalle.some((prod: any) =>
          (prod.producto && prod.producto.id === producto.id) ||
          (prod.producto_id === producto.id) // por si viene como producto_id
        )
      );

      if (promosProducto.length > 0) {
        // ✅ MEJORADO: Si el producto tiene tamaños, considerar el mejor descuento posible
        let mayorDescuento = 0;
        
        if ((producto as any).aplica_tamanos && (producto as any).tamanos_detalle?.length > 0) {
          // Para productos con tamaños, encontrar el mayor descuento entre todos los tamaños
          const descuentosPorTamano = promosProducto.map((promo: any) => {
            return promo.productos_detalle
              .filter((prod: any) => 
                ((prod.producto && prod.producto.id === producto.id) || (prod.producto_id === producto.id))
              )
              .map((prod: any) => Number(prod.valor_descuento || promo.valor_descuento) || 0);
          }).flat();
          
          mayorDescuento = Math.max(...descuentosPorTamano, 0);
        } else {
          // Para productos sin tamaños, usar el descuento general
          mayorDescuento = Math.max(...promosProducto.map((p: any) => Number(p.valor_descuento) || 0));
        }

        if (mayorDescuento > 0) {
          productoConBadge.promoBadge = `-${mayorDescuento}%`;
          productoConBadge.promoBadgeClass = 'discount';
        }
      }

      return productoConBadge;
    });
  }

  cancelarPedido(): void {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: 'PEDIDO COMPLETO',
        action: 'delete',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {

      if (result === true) {

        this.router.navigate(['/cliente/home']);
      } else {
      }
    });
  }

  private deberíaTenerDescuento(producto: Producto): boolean {
    // Ejemplo: productos con precio > $5 tienen 10% descuento
    // productos con precio > $8 tienen 15% descuento
    // productos con precio > $10 tienen 20% descuento
    return producto.precio > 5;
  }

  private calcularDescuento(producto: Producto): number {
    if (producto.precio > 10) return 20;
    if (producto.precio > 8) return 15;
    if (producto.precio > 5) return 10;
    return 0;
  }

  recargarDatos(): void {
    this.cargandoCategorias.set(true);
    this.cargandoProductos.set(true);
    this.cargarDatos();
  }

  seleccionarCategoria(categoria: Categoria): void {
    this.categoriaSeleccionada.set(categoria.id);
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
  }

  obtenerPrecioMostrar(producto: ProductoConBadge): number {
    // Si tiene precio_base (productos con tamaños), usar ese
    if ((producto as any).precio_base !== undefined) {
      return (producto as any).precio_base;
    }
    // Si no, usar precio normal
    return producto.precio;
  }

  obtenerTextoPrecio(item: ProductoConBadge | Menu): string {
    // Si es un menú, devolver precio simple
    if (this.esMenu(item)) {
      return `$${item.precio.toFixed(2)}`;
    }

    // Si es producto, usar lógica de tamaños ORIGINAL (sin descuentos)
    const producto = item as ProductoConBadge;

    if (producto.aplica_tamanos) {
      this.debugTamanos(producto);
    }

    if (producto.aplica_tamanos && producto.tamanos_detalle && producto.tamanos_detalle.length > 0) {
      // ✅ MOSTRAR PRECIOS ORIGINALES (sin descuento) en las cards
      const precios = producto.tamanos_detalle.map(t => t.precio);
      const precioMin = Math.min(...precios);
      const precioMax = Math.max(...precios);

      if (precioMin === precioMax) {
        return `$${precioMin.toFixed(2)}`;
      } else {
        return `$${precioMin.toFixed(2)} - $${precioMax.toFixed(2)}`;
      }
    }

    // ✅ PRECIO ORIGINAL sin descuento para productos sin tamaños
    return `$${this.obtenerPrecioMostrar(producto).toFixed(2)}`;
  }

  obtenerTextoPrecioConDescuento(item: ProductoConBadge | Menu): string {
    // ✅ SIMPLIFICADO: Solo mostrar el precio con descuento general del producto/menú
    const precioConDescuento = this.obtenerPrecioConDescuento(item as ProductoConBadge);
    return `$${precioConDescuento.toFixed(2)}`;
  }


  obtenerTextoPrecioMenu(menu: Menu): string {
    return `$${menu.precio.toFixed(2)}`;
  }

  obtenerTextoPrecioGenerico(item: ProductoConBadge | Menu): string {
    if (this.esMenu(item)) {
      return this.obtenerTextoPrecioMenu(item);
    } else {
      return this.obtenerTextoPrecio(item);
    }
  }

  private calcularPrecioFinal(producto: ProductoConBadge): number {
    if (producto.aplica_tamanos && producto.tamanos_detalle && producto.tamanos_detalle.length === 1) {
      return producto.tamanos_detalle[0].precio;
    }
    return this.obtenerPrecioMostrar(producto);
  }

  private mostrarSelectorTamano(producto: ProductoConBadge): void {
    // Aquí podrías abrir un modal/popup para seleccionar tamaño
    // Por ahora, agregar el tamaño más pequeño por defecto
    if (producto.tamanos_detalle && producto.tamanos_detalle.length > 0) {
      const tamanoDefault = producto.tamanos_detalle[0]; // El más pequeño (orden)
      this.pedidoService.agregarProducto(producto.id, tamanoDefault.precio, 1);
    }
  }

 esMenu(item: ProductoConBadge | Menu): item is Menu {
    return 'tipo_menu' in item;
  }

  continuar(): void {

    if (this.esUltimaCategoria()) {
      // Si es la última categoría y HAY productos, ir al carrito
      if (this.cantidadItemsSeguro > 0) {
        this.router.navigate(['/cliente/carrito']);
      } else {
        // Si es la última categoría pero NO hay productos, volver al inicio
        const primeraCategoria = this.categorias()[0];
        if (primeraCategoria) {
          this.seleccionarCategoria(primeraCategoria);
        }
      }
    } else {
      // Si no es la última, ir a la siguiente categoría (SIEMPRE)
      const siguienteCategoria = this.obtenerSiguienteCategoria();

      if (siguienteCategoria) {
        this.seleccionarCategoria(siguienteCategoria);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
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

  seleccionarProducto(producto: ProductoConBadge | Menu): void {
    const productoActualSeleccionado = this.productosSeleccionados();

    if (productoActualSeleccionado === producto.id) {
      // Si el mismo producto ya está seleccionado, deseleccionarlo
      this.productosSeleccionados.set(null);
    } else {
      // Seleccionar el nuevo producto (automáticamente deselecciona el anterior)
      this.productosSeleccionados.set(producto.id);
    }
  }

  private mostrarPopupProducto(producto: ProductoConBadge | Menu): void {
    const imagenUrl = this.obtenerImagenProducto(producto);
    const permitirPersonalizacion = this.debePermitirPersonalizacion(producto);

    // ✅ CALCULAR PRECIO BASE CON DESCUENTO PARA EL POPUP (sin tamaño específico)
    const precioConDescuento = this.calcularPrecioConDescuento(producto as any, this.promocionesActivas());

    console.log('🎯 Popup - Precio original vs con descuento:', {
      original: producto.precio,
      conDescuento: precioConDescuento,
      producto: producto.nombre,
      tieneTamanos: (producto as ProductoConBadge).aplica_tamanos
    });

    const dialogData: ProductPopupData = {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        precio: precioConDescuento, // ✅ USAR PRECIO CON DESCUENTO BASE
        imagenUrl: imagenUrl,
        categoria: (producto as ProductoConBadge).categoria,
        descripcion: (producto as ProductoConBadge).descripcion,

        aplica_tamanos: (producto as ProductoConBadge).aplica_tamanos,
        tamanos_detalle: (producto as ProductoConBadge).tamanos_detalle?.map(t => {
          // ✅ PRECIO ORIGINAL DEL TAMAÑO (sin descuento)
          const precioOriginalTamano = parseFloat(t.precio.toString());
          
          // ✅ CALCULAR precio con descuento para este tamaño específico
          const tamanoData = {
            codigo_tamano: t.codigo_tamano,
            codigo: t.codigo_tamano
          };
          
          // Obtener precio con descuento aplicando promociones específicas de tamaño
          const precioTamanoConDescuento = this.calcularPrecioConDescuento(
            producto as any, 
            this.promocionesActivas(), 
            tamanoData
          );
          
          console.log(`📏 Popup - Calculando tamaño ${t.codigo_tamano}:`, {
            precio_original: precioOriginalTamano,
            precio_con_descuento: precioTamanoConDescuento,
            tiene_descuento: precioTamanoConDescuento !== precioOriginalTamano
          });
          
          return {
            id: t.id,
            tamano_nombre: t.nombre_tamano,
            codigo_tamano: t.codigo_tamano,
            precio: precioTamanoConDescuento, // ✅ PRECIO CON DESCUENTO APLICADO
            precio_original: precioOriginalTamano // ✅ PRECIO ORIGINAL PARA COMPARACIÓN
          };
        })
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


  private agregarProductoAlCarrito(producto: ProductoConBadge | Menu, cantidad: number, tamanoSeleccionado?: any): void {
    let precio = producto.precio;
    let precioConDescuento = precio;

    if (this.esMenu(producto)) {
      // ✅ Calcular precio con descuento para menús (sin cambios)
      precioConDescuento = this.calcularPrecioConDescuento(producto as any, this.promocionesActivas());
      console.log(`Agregando menú ${producto.id} con precio descuento: $${precioConDescuento}`);
      this.pedidoService.agregarMenu(producto.id, precioConDescuento, cantidad, []);
    } else {
      // ✅ MEJORADO: Calcular precio con descuento para productos considerando tamaño específico
      if (tamanoSeleccionado) {
        // Si hay tamaño seleccionado, usar ese precio ya con descuento aplicado
        precioConDescuento = tamanoSeleccionado.precio;
        console.log(`Agregando producto ${producto.id} tamaño ${tamanoSeleccionado.codigo} con precio: $${precioConDescuento}`);
      } else if ((producto as ProductoConBadge).aplica_tamanos && (producto as ProductoConBadge).tamanos_detalle && (producto as ProductoConBadge).tamanos_detalle!.length > 0) {
        // Si no hay tamaño seleccionado pero tiene tamaños, usar el primero
        const primerTamano = (producto as ProductoConBadge).tamanos_detalle![0];
        const tamanoData = {
          codigo_tamano: primerTamano.codigo_tamano,
          codigo: primerTamano.codigo_tamano
        };
        precioConDescuento = this.calcularPrecioConDescuento(producto as any, this.promocionesActivas(), tamanoData);
        // Aplicar proporción al precio del tamaño
        const factorDescuento = precioConDescuento / producto.precio;
        precioConDescuento = primerTamano.precio * factorDescuento;
        console.log(`Agregando producto ${producto.id} primer tamaño ${primerTamano.codigo_tamano} con precio: $${precioConDescuento}`);
      } else {
        // Producto sin tamaños, usar descuento general
        precioConDescuento = this.calcularPrecioConDescuento(producto as any, this.promocionesActivas());
        console.log(`Agregando producto ${producto.id} sin tamaños con precio descuento: $${precioConDescuento}`);
      }

      this.pedidoService.agregarProducto(producto.id, precioConDescuento, cantidad);
    }
  }

  private irAPersonalizar(producto: ProductoConBadge | Menu, cantidad: number, tamanoSeleccionado?: any): void {
    // ✅ MEJORADO: Calcular precio con descuento considerando tamaño específico
    const precioOriginal = producto.precio;
    let precioConDescuento = precioOriginal;

    if (tamanoSeleccionado) {
      // Si hay tamaño seleccionado, usar ese precio ya con descuento aplicado
      precioConDescuento = tamanoSeleccionado.precio;
      console.log('🍔 Navegando a personalizar con tamaño específico:', {
        producto: producto.nombre,
        tamano: tamanoSeleccionado.codigo,
        precioOriginal: precioOriginal,
        precioTamanoConDescuento: precioConDescuento
      });
    } else {
      // Sin tamaño seleccionado, usar descuento general del producto
      precioConDescuento = this.calcularPrecioConDescuento(producto as any, this.promocionesActivas());
      console.log('🍔 Navegando a personalizar sin tamaño específico:', {
        producto: producto.nombre,
        precioOriginal: precioOriginal,
        precioConDescuento: precioConDescuento,
        tieneDescuento: precioOriginal !== precioConDescuento
      });
    }

    const queryParams: any = {
      cantidad: cantidad,
      nombre: producto.nombre,
      precio: precioConDescuento, // ✅ PRECIO CON DESCUENTO (será el precio base en personalización)
      precio_original_menu: precioOriginal, // ✅ PRECIO ORIGINAL DEL MENÚ (para referencia)
      categoria: (producto as ProductoConBadge).categoria || null
    };

    if (tamanoSeleccionado) {
      queryParams.tamano_id = tamanoSeleccionado.id;
      queryParams.tamano_precio = tamanoSeleccionado.precio; // ✅ YA INCLUYE DESCUENTO
      
      console.log('📏 Tamaño seleccionado enviado a personalizar:', {
        tamano: tamanoSeleccionado.nombre || tamanoSeleccionado.codigo,
        precioTamanoConDescuento: tamanoSeleccionado.precio
      });
    }

    console.log('📋 Query params enviados a personalizar:', queryParams);

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

  estaSeleccionado(producto: ProductoConBadge | Menu): boolean {
    return this.productosSeleccionados() === producto.id;
  }

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
      return siguienteCategoria;
    }

    // Si es la última categoría, devolver null (para ir al carrito)
    return null;
  }

  esUltimaCategoria = computed(() => {
    const categoriasActuales = this.categorias();
    const categoriaActualId = this.categoriaSeleccionada();

    if (!categoriaActualId || categoriasActuales.length === 0) {
      return false;
    }

    const indiceActual = categoriasActuales.findIndex(cat => cat.id === categoriaActualId);
    return indiceActual === categoriasActuales.length - 1;
  });

  textoBotoncontinuar = computed(() => {
    if (this.esUltimaCategoria()) {
      // En la última categoría
      return this.cantidadItemsSeguro > 0 ? 'Ir a Carrito' : 'Continuar';
    } else {
      // En categorías intermedias
      return 'Continuar';
    }
  });


  private debugTamanos(producto: ProductoConBadge): void {
  }


  agregarProducto(producto: ProductoConBadge | Menu, event?: Event): void {
    // Prevenir que el clic se propague al contenedor padre
    if (event) {
      event.stopPropagation();
    }

    this.mostrarPopupProducto(producto);
  }

  onPublicidadCambio(publicidad: Publicidad): void {
    // Aquí puedes agregar lógica adicional como analytics
  }

  // ✅ MÉTODO MEJORADO para calcular precio con descuento considerando tamaños específicos
  private calcularPrecioConDescuento(producto: ProductoConBadge | Menu, promocionesActivas: any[], tamanoSeleccionado?: any): number {
    // ✅ OBTENER PRECIO BASE según el contexto
    let precioOriginal: number;
    
    if (tamanoSeleccionado && !this.esMenu(producto)) {
      // Si hay tamaño seleccionado, buscar el precio de ese tamaño específico
      const productoConTamanos = producto as ProductoConBadge;
      const tamanoDetalle = productoConTamanos.tamanos_detalle?.find(t => 
        t.codigo_tamano === tamanoSeleccionado.codigo_tamano || 
        t.codigo_tamano === tamanoSeleccionado.codigo
      );
      precioOriginal = tamanoDetalle ? parseFloat(tamanoDetalle.precio.toString()) : parseFloat(producto.precio.toString());
      
      console.log(`🎯 Calculando descuento para tamaño ${tamanoSeleccionado.codigo_tamano}: precio base $${precioOriginal}`);
    } else {
      // Precio base del producto o menú
      precioOriginal = typeof producto.precio === 'number' ? producto.precio : this.obtenerPrecioMostrar(producto as ProductoConBadge);
    }
    
    // Para menús, buscar promociones específicas de menús
    if (this.esMenu(producto)) {
      const promosMenu = promocionesActivas.filter((p: any) =>
        Array.isArray(p.menus_detalle) &&
        p.menus_detalle.some((menu: any) =>
          (menu.menu && menu.menu.id === producto.id) ||
          (menu.menu_id === producto.id) ||  
          (menu.id === producto.id)
        )
      );

      if (promosMenu.length > 0) {
        const mayorDescuento = Math.max(...promosMenu.map((p: any) => Number(p.valor_descuento) || 0));
        const precioConDescuento = precioOriginal * (1 - mayorDescuento / 100);
        console.log(`📋 Menú ${producto.id}: Original $${precioOriginal}, Descuento ${mayorDescuento}%, Final $${precioConDescuento}`);
        return precioConDescuento;
      }
    } else {
      // ✅ MEJORADO: Para productos, considerar promociones por tamaño específico
      const promosProducto = promocionesActivas.filter((p: any) => {
        if (!Array.isArray(p.productos_detalle)) return false;
        
        return p.productos_detalle.some((prod: any) => {
          const coincideProducto = (prod.producto && prod.producto.id === producto.id) || (prod.producto_id === producto.id);
          
          // Si no hay tamaño seleccionado, considerar solo promociones generales (sin tamaño específico)
          if (!tamanoSeleccionado) {
            return coincideProducto && (!prod.tamano_codigo || prod.tamano_codigo === null);
          }
          
          // Si hay tamaño seleccionado, buscar promociones específicas para ese tamaño
          const coincideTamano = prod.tamano_codigo === tamanoSeleccionado.codigo_tamano || 
                                prod.tamano_codigo === tamanoSeleccionado.codigo;
          
          console.log(`🔍 Verificando promoción para tamaño ${tamanoSeleccionado.codigo_tamano}:`, {
            promo_id: p.id,
            promo_tamano_codigo: prod.tamano_codigo,
            tamano_seleccionado_codigo: tamanoSeleccionado.codigo_tamano,
            coincide_tamano: coincideTamano,
            descuento: p.valor_descuento
          });
          
          return coincideProducto && coincideTamano;
        });
      });

      if (promosProducto.length > 0) {
        const mayorDescuento = Math.max(...promosProducto.map((p: any) => Number(p.valor_descuento) || 0));
        const precioConDescuento = precioOriginal * (1 - mayorDescuento / 100);
        
        console.log(`📦 Producto ${producto.id} (${tamanoSeleccionado?.codigo_tamano || 'sin tamaño'}): Original $${precioOriginal}, Descuento ${mayorDescuento}%, Final $${precioConDescuento}`);
        return precioConDescuento;
      }
    }
    
    console.log(`🏷️ Sin promoción: ${producto.id} (${tamanoSeleccionado?.codigo_tamano || 'sin tamaño'}) - $${precioOriginal}`);
    return precioOriginal;
  }

  // ✅ MÉTODO MEJORADO para obtener precio con descuento con soporte para tamaños
  obtenerPrecioConDescuento(producto: ProductoConBadge, tamanoSeleccionado?: any): number {
    return this.calcularPrecioConDescuento(producto, this.promocionesActivas(), tamanoSeleccionado);
  }

  // Método para verificar si tiene promoción
  tienePromociones(producto: ProductoConBadge): boolean {
    return this.tienePromoBadge(producto);
  }

  // ✅ AGREGAR: Método para verificar si un producto tiene múltiples tamaños
  productoTieneTamanos(item: ProductoConBadge | Menu): boolean {
    if (this.esMenu(item)) return false;
    const producto = item as ProductoConBadge;
    return !!(producto.aplica_tamanos && producto.tamanos_detalle && producto.tamanos_detalle.length > 0);
  }

}
