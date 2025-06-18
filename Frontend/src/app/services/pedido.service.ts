import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  Pedido,
  TipoEntrega,
  DetallePedido,
  PersonalizacionIngrediente,
  CrearPedidoRequest,
  PedidoResponse,
  DetallePedidoProducto,
  DetallePedidoMenu
} from '../models/pedido.model';
import { CatalogoService } from './catalogo.service';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = `${environment.apiUrl}/pedidos`;

  // ✅ Estado principal del pedido
  private pedidoState = signal<Partial<Pedido>>({
    tipo_entrega: null,
    numero_mesa: null,
    total: 0,
    valor_descuento: 0,
    is_facturado: true,
  });

  // ✅ Arrays para detalles y personalizaciones
  private detallesState = signal<DetallePedido[]>([]);
  private personalizacionesState = signal<PersonalizacionIngrediente[]>([]);

  // ✅ Getters públicos (signals read-only)
  pedido = this.pedidoState.asReadonly();
  detalles = this.detallesState.asReadonly();
  personalizaciones = this.personalizacionesState.asReadonly();

  // ✅ Computed signals específicos
  tipoEntrega = computed(() => this.pedidoState().tipo_entrega);
  numeroMesa = computed(() => this.pedidoState().numero_mesa);

  // ✅ Computed signals para cálculos
  subtotal = computed(() =>
    this.detallesState().reduce((sum, detalle) => {
      let subtotalProductos = (detalle.productos ?? []).reduce((s, p) => s + (p.subtotal || 0), 0);
      let subtotalMenus = (detalle.menus ?? []).reduce((s, m) => s + (m.subtotal || 0), 0);
      return sum + subtotalProductos + subtotalMenus;
    }, 0)
  );

  costoPersonalizaciones = computed(() =>
    this.personalizacionesState().reduce((sum, p) => sum + (p.precio_aplicado || 0), 0)
  );

  total = computed(() => {
    const pedido = this.pedidoState();
    return this.subtotal() + this.costoPersonalizaciones() - (pedido.valor_descuento || 0);
  });

  cantidadItems = computed(() =>
    this.detallesState().reduce((sum, detalle) => {
      let cantidadProductos = (detalle.productos ?? []).reduce((s, p) => s + (p.cantidad || 0), 0);
      let cantidadMenus = (detalle.menus ?? []).reduce((s, m) => s + (m.cantidad || 0), 0);
      return sum + cantidadProductos + cantidadMenus;
    }, 0)
  );

  // ✅ Validaciones
  esPedidoValido = computed(() => {
    const pedido = this.pedidoState();
    const tipo = pedido.tipo_entrega;

    if (!tipo) return false;

    if (tipo === 'servir') {
      return pedido.numero_mesa !== null && pedido.numero_mesa !== undefined;
    }

    return true;
  });

  resumenPedido = computed(() => {
    const pedido = this.pedidoState();
    const tipo = pedido.tipo_entrega;

    if (!tipo) return null;

    return {
      tipo_entrega: tipo,
      numero_mesa: pedido.numero_mesa,
      descripcion: tipo === 'servir'
        ? `Para servir en mesa ${pedido.numero_mesa}`
        : 'Para llevar',
      total: this.total()
    };
  });

  private catalogoService = inject(CatalogoService);
  private productosCache: Map<number, any> = new Map();

  constructor(private http: HttpClient) {}

  // ✅ Métodos para actualizar el estado
  setTipoEntrega(tipo: TipoEntrega): void {
    this.pedidoState.update(state => ({
      ...state,
      tipo_entrega: tipo,
      numero_mesa: tipo === 'llevar' ? null : state.numero_mesa
    }));
  }

  setNumeroMesa(mesa: number): void {
    this.pedidoState.update(state => ({
      ...state,
      numero_mesa: mesa
    }));
  }

  setTipoPago(tipoPagoId: number): void {
    this.pedidoState.update(state => ({
      ...state,
      tipo_pago_id: tipoPagoId
    }));
  }

  agregarProducto(producto_id: number, precio: number, cantidad: number = 1, personalizacion?: PersonalizacionIngrediente[]): void {
    let detalles = this.detallesState();
    let detalle = detalles.find(d => d.productos);

    if (!detalle) {
      detalle = { productos: [] };
      this.detallesState.update(detalles => [...detalles, detalle!]);
    }

    // Busca si el producto ya existe en el array productos, considerando la personalización
    let productoExistente = detalle.productos!.find(p =>
      p.producto_id === producto_id &&
      this.personalizacionesIguales(p.personalizacion, personalizacion)
    );

    if (productoExistente) {
      productoExistente.cantidad += cantidad;
      productoExistente.subtotal = productoExistente.cantidad * precio;
      // No actualices la personalización, ya que es la misma
    } else {
      detalle.productos!.push({
        producto_id,
        cantidad,
        subtotal: precio * cantidad,
        personalizacion
      });
    }

    this.detallesState.set([...this.detallesState()]);
    this.actualizarTotalEnEstado();
  }

  // Cambia agregarDetalle para aceptar DetallePedidoProducto o DetallePedidoMenu
  agregarDetalleProducto(producto: DetallePedidoProducto): void {
    let detalles = this.detallesState();
    let detalle = detalles.find(d => d.productos);

    if (!detalle) {
      detalle = { productos: [] };
      this.detallesState.update(detalles => [...detalles, detalle!]);
    }
    detalle.productos!.push(producto);
    this.detallesState.set([...this.detallesState()]);
    this.actualizarTotalEnEstado();
  }

  agregarDetalleMenu(menu: DetallePedidoMenu): void {
    let detalles = this.detallesState();
    let detalle = detalles.find(d => d.menus);

    if (!detalle) {
      detalle = { menus: [] };
      this.detallesState.update(detalles => [...detalles, detalle!]);
    }
    detalle.menus!.push(menu);
    this.detallesState.set([...this.detallesState()]);
    this.actualizarTotalEnEstado();
  }

  agregarMenu(menu_id: number, precio: number, cantidad: number = 1, productos: DetallePedidoProducto[] = []): void {
    let detalles = this.detallesState();
    let detalle = detalles.find(d => d.menus);

    if (!detalle) {
      detalle = { menus: [] };
      this.detallesState.update(detalles => [...detalles, detalle!]);
    }

    // Busca si el menú ya existe en el array menus
    let menuExistente = detalle.menus!.find(m => m.menu_id === menu_id);

    if (menuExistente) {
      menuExistente.cantidad += cantidad;
      menuExistente.subtotal = menuExistente.cantidad * precio;
      // Si quieres actualizar productos del menú, puedes hacerlo aquí
    } else {
      detalle.menus!.push({
        menu_id,
        cantidad,
        subtotal: precio * cantidad,
        productos
      });
    }

    this.detallesState.set([...this.detallesState()]);
    this.actualizarTotalEnEstado();

    // Mostrar en consola el detalle actual
    console.log('📝 Detalle actual del pedido:', this.detallesState());
  }

  // ✅ Método privado para actualizar el total en el estado
  private actualizarTotalEnEstado(): void {
    this.pedidoState.update(state => ({
      ...state,
      total: this.total()
    }));
  }

  // ✅ Remover items
  removerDetalleProducto(index: number): void {
    let detalles = this.detallesState();
    let detalle = detalles.find(d => d.productos);
    if (detalle && detalle.productos) {
      detalle.productos.splice(index, 1);
      this.detallesState.set([...this.detallesState()]);
      this.actualizarTotalEnEstado();
    }
  }

  removerDetalleMenu(index: number): void {
    let detalles = this.detallesState();
    let detalle = detalles.find(d => d.menus);
    if (detalle && detalle.menus) {
      detalle.menus.splice(index, 1);
      this.detallesState.set([...this.detallesState()]);
      this.actualizarTotalEnEstado();
    }
  }

  limpiarPedido(): void {
    this.pedidoState.set({
      tipo_entrega: null,
      numero_mesa: null,
      total: 0,
      valor_descuento: 0,
      is_facturado: true,
    });
    this.detallesState.set([]);
    this.personalizacionesState.set([]);
  }

  // ✅ Método para obtener datos para el backend
  obtenerDatosParaBackend(): CrearPedidoRequest | null {
    const pedido = this.pedidoState();
    const detalles = this.detallesState();

    if (!this.esPedidoValido()) return null;

    return {
      tipo_entrega: pedido.tipo_entrega!,
      numero_mesa: pedido.numero_mesa || undefined,
      total: this.total(),
      tipo_pago_id: pedido.tipo_pago_id || 1,
      detalles: detalles.map(d => ({
        productos: d.productos,
        menus: d.menus
      })),
      personalizaciones: this.personalizacionesState().length > 0
        ? this.personalizacionesState()
        : undefined
    };
  }

  async enviarPedido(): Promise<PedidoResponse> {
    const datos = this.obtenerDatosParaBackend();

    if (!datos) {
      throw new Error('Pedido incompleto');
    }

    try {
      const response = await this.http.post<PedidoResponse>(this.apiUrl, datos).toPromise();

      if (response) {
        this.limpiarPedido();
        return response;
      }

      throw new Error('No se recibió respuesta del servidor');
    } catch (error) {
      console.error('Error al enviar pedido:', error);
      throw error;
    }
  }

  // ✅ MÉTODOS INTERNOS PRIVADOS

  private aumentarCantidadProductoInterno(producto_id: number, personalizacion?: PersonalizacionIngrediente[]): void {
    const detalles = this.detallesState();
    let updated = false;

    detalles.forEach(detalle => {
      if (detalle.productos) {
        const producto = detalle.productos.find(p =>
          p.producto_id === producto_id &&
          this.personalizacionesIguales(p.personalizacion, personalizacion)
        );

        if (producto) {
          const precioUnitario = producto.subtotal / producto.cantidad;
          producto.cantidad++;
          producto.subtotal = producto.cantidad * precioUnitario;
          updated = true;
        }
      }
    });

    if (updated) {
      this.detallesState.set([...detalles]);
      this.actualizarTotalEnEstado();
    }
  }

  private disminuirCantidadProductoInterno(producto_id: number, personalizacion?: PersonalizacionIngrediente[]): void {
    const detalles = this.detallesState();
    let updated = false;

    detalles.forEach(detalle => {
      if (detalle.productos) {
        const producto = detalle.productos.find(p =>
          p.producto_id === producto_id &&
          this.personalizacionesIguales(p.personalizacion, personalizacion)
        );

        if (producto && producto.cantidad > 1) {
          const precioUnitario = producto.subtotal / producto.cantidad;
          producto.cantidad--;
          producto.subtotal = producto.cantidad * precioUnitario;
          updated = true;
        }
      }
    });

    if (updated) {
      this.detallesState.set([...detalles]);
      this.actualizarTotalEnEstado();
    }
  }

  private eliminarProductoInterno(producto_id: number, personalizacion?: PersonalizacionIngrediente[]): void {
    const detalles = this.detallesState();
    let updated = false;

    detalles.forEach(detalle => {
      if (detalle.productos) {
        const index = detalle.productos.findIndex(p =>
          p.producto_id === producto_id &&
          this.personalizacionesIguales(p.personalizacion, personalizacion)
        );

        if (index !== -1) {
          detalle.productos.splice(index, 1);
          updated = true;
        }
      }
    });

    if (updated) {
      this.detallesState.set([...detalles]);
      this.actualizarTotalEnEstado();
    }
  }

  private aumentarCantidadMenuInterno(menu_id: number): void {
    const detalles = this.detallesState();
    let updated = false;

    detalles.forEach(detalle => {
      if (detalle.menus) {
        const menu = detalle.menus.find(m => m.menu_id === menu_id);

        if (menu) {
          const precioUnitario = menu.subtotal / menu.cantidad;
          menu.cantidad++;
          menu.subtotal = menu.cantidad * precioUnitario;
          updated = true;
        }
      }
    });

    if (updated) {
      this.detallesState.set([...detalles]);
      this.actualizarTotalEnEstado();
    }
  }

  private disminuirCantidadMenuInterno(menu_id: number): void {
    const detalles = this.detallesState();
    let updated = false;

    detalles.forEach(detalle => {
      if (detalle.menus) {
        const menu = detalle.menus.find(m => m.menu_id === menu_id);

        if (menu && menu.cantidad > 1) {
          const precioUnitario = menu.subtotal / menu.cantidad;
          menu.cantidad--;
          menu.subtotal = menu.cantidad * precioUnitario;
          updated = true;
        }
      }
    });

    if (updated) {
      this.detallesState.set([...detalles]);
      this.actualizarTotalEnEstado();
    }
  }

  private eliminarMenuInterno(menu_id: number): void {
    const detalles = this.detallesState();
    let updated = false;

    detalles.forEach(detalle => {
      if (detalle.menus) {
        const index = detalle.menus.findIndex(m => m.menu_id === menu_id);

        if (index !== -1) {
          detalle.menus.splice(index, 1);
          updated = true;
        }
      }
    });

    if (updated) {
      this.detallesState.set([...detalles]);
      this.actualizarTotalEnEstado();
    }
  }

  // ✅ MÉTODO AUXILIAR para comparar personalizaciones
  private personalizacionesIguales(p1?: PersonalizacionIngrediente[], p2?: PersonalizacionIngrediente[]): boolean {
    if (!p1 && !p2) return true;
    if (!p1 || !p2) return false;
    if (p1.length !== p2.length) return false;

    // Comparación básica - puedes mejorarla según tus necesidades
    return JSON.stringify(p1.sort()) === JSON.stringify(p2.sort());
  }

  // ✅ AGREGAR: Métodos públicos que faltan para el carrito

  // Obtener productos para el carrito
  obtenerProductosParaCarrito(): any[] {
    const detalles = this.detallesState();
    const productos: any[] = [];

    console.log('🔍 [PedidoService] Obteniendo productos para carrito...');
    console.log('   - Detalles disponibles:', detalles);

    detalles.forEach((detalle, detalleIndex) => {
      // Agregar productos individuales
      if (detalle.productos && detalle.productos.length > 0) {
        detalle.productos.forEach((producto, index) => {
          const item = {
            id: `producto_${producto.producto_id}_${detalleIndex}_${index}`,
            tipo: 'producto',
            producto_id: producto.producto_id,
            cantidad: producto.cantidad,
            precio_unitario: producto.subtotal / producto.cantidad,
            subtotal: producto.subtotal,
            personalizacion: producto.personalizacion || [],
            nombre: `Producto ${producto.producto_id}`, // Temporal
            imagen_url: null
          };
          productos.push(item);
        });
      }

      // Agregar menús
      if (detalle.menus && detalle.menus.length > 0) {
        detalle.menus.forEach((menu, index) => {
          const item = {
            id: `menu_${menu.menu_id}_${detalleIndex}_${index}`,
            tipo: 'menu',
            menu_id: menu.menu_id,
            cantidad: menu.cantidad,
            precio_unitario: menu.subtotal / menu.cantidad,
            subtotal: menu.subtotal,
            productos: menu.productos || [],
            nombre: `Menú ${menu.menu_id}`, // Temporal
            imagen_url: null
          };
          productos.push(item);
        });
      }
    });

    console.log('🛒 [PedidoService] Productos finales:', productos);
    return productos;
  }

  // Aumentar cantidad de un producto
  aumentarCantidadProducto(index: number): void {
    const productosCarrito = this.obtenerProductosParaCarrito();
    if (index < 0 || index >= productosCarrito.length) return;

    const item = productosCarrito[index];
    console.log(`➕ Aumentando cantidad del producto:`, item);

    if (item.tipo === 'producto') {
      this.aumentarCantidadProductoInterno(item.producto_id, item.personalizacion);
    } else if (item.tipo === 'menu') {
      this.aumentarCantidadMenuInterno(item.menu_id);
    }
  }

  // Disminuir cantidad de un producto
  disminuirCantidadProducto(index: number): void {
    const productosCarrito = this.obtenerProductosParaCarrito();
    if (index < 0 || index >= productosCarrito.length) return;

    const item = productosCarrito[index];
    if (item.cantidad <= 1) return;

    console.log(`➖ Disminuyendo cantidad del producto:`, item);

    if (item.tipo === 'producto') {
      this.disminuirCantidadProductoInterno(item.producto_id, item.personalizacion);
    } else if (item.tipo === 'menu') {
      this.disminuirCantidadMenuInterno(item.menu_id);
    }
  }

  // Eliminar producto del carrito
  eliminarProducto(index: number): void {
    const productosCarrito = this.obtenerProductosParaCarrito();
    if (index < 0 || index >= productosCarrito.length) return;

    const item = productosCarrito[index];
    console.log(`🗑️ Eliminando producto:`, item);

    if (item.tipo === 'producto') {
      this.eliminarProductoInterno(item.producto_id, item.personalizacion);
    } else if (item.tipo === 'menu') {
      this.eliminarMenuInterno(item.menu_id);
    }
  }
}
