import { Injectable, signal, computed } from '@angular/core';
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
    // Busca un DetallePedido con productos (puedes mejorar la lógica según tu flujo)
    let detalles = this.detallesState();
    let detalle = detalles.find(d => d.productos);

    if (!detalle) {
      // Si no existe, crea uno nuevo
      detalle = { productos: [] };
      this.detallesState.update(detalles => [...detalles, detalle!]);
    }

    // Busca si el producto ya existe en el array productos
    let productoExistente = detalle.productos!.find(p => p.producto_id === producto_id);

    if (productoExistente) {
      productoExistente.cantidad += cantidad;
      productoExistente.subtotal = productoExistente.cantidad * precio;
      if (personalizacion) {
        productoExistente.personalizacion = personalizacion;
      }
    } else {
      detalle.productos!.push({
        producto_id,
        cantidad,
        subtotal: precio * cantidad,
        personalizacion
      });
    }

    // Actualiza el array de detalles
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
}
