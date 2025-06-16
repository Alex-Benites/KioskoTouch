import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { 
  Pedido, 
  TipoEntrega, 
  DetallePedido, 
  PersonalizacionIngrediente, 
  CrearPedidoRequest, 
  PedidoResponse 
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
    this.detallesState().reduce((sum, detalle) => sum + (detalle.subtotal || 0), 0)
  );

  costoPersonalizaciones = computed(() =>
    this.personalizacionesState().reduce((sum, p) => sum + (p.precio_aplicado || 0), 0)
  );

  total = computed(() => {
    const pedido = this.pedidoState();
    return this.subtotal() + this.costoPersonalizaciones() - (pedido.valor_descuento || 0);
  });

  cantidadItems = computed(() =>
    this.detallesState().reduce((sum, detalle) => sum + (detalle.cantidad || 0), 0)
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

  agregarProducto(producto_id: number, precio: number, cantidad: number = 1, descripcionExtra: string = ''): void {
    // Buscar si ya existe un producto similar (mismo ID y misma descripción extra)
    const detallesActuales = this.detallesState();
    const detalleExistente = detallesActuales.find(d => 
      d.producto_id === producto_id && 
      (d.descripcion_extra || '') === descripcionExtra
    );

    if (detalleExistente) {
      // Si existe, actualizar cantidad y subtotal
      this.detallesState.update(detalles => 
        detalles.map(d => 
          d === detalleExistente 
            ? {
                ...d,
                cantidad: d.cantidad + cantidad,
                subtotal: (d.cantidad + cantidad) * d.precio_unitario
              }
            : d
        )
      );
      console.log(`📈 Cantidad actualizada: Producto ${producto_id}${descripcionExtra} = ${detalleExistente.cantidad + cantidad}`);
    } else {
      // Si no existe, crear nuevo detalle
      const detalle: DetallePedido = {
        producto_id,
        cantidad,
        precio_unitario: precio,
        subtotal: precio * cantidad,
        descripcion_extra: descripcionExtra // ✅ AGREGAR descripción extra
      };

      this.detallesState.update(detalles => [...detalles, detalle]);
      console.log(`➕ Producto agregado: Producto ${producto_id}${descripcionExtra} x${cantidad} - $${detalle.subtotal.toFixed(2)}`);
    }

    this.actualizarTotalEnEstado();
  }
  agregarDetalle(detalle: Omit<DetallePedido, 'id' | 'pedido_id' | 'created_at' | 'updated_at'>): void {
    this.detallesState.update(detalles => [...detalles, detalle]);
    this.actualizarTotalEnEstado();
  }

  agregarPersonalizacion(ingrediente_id: number, accion: 'agregar' | 'quitar', precio: number): void {
    const personalizacion: PersonalizacionIngrediente = {
      ingrediente_id,
      accion,
      precio_aplicado: precio
    };

    this.personalizacionesState.update(p => [...p, personalizacion]);
    this.actualizarTotalEnEstado();
  }

  // ✅ Método privado para actualizar el total en el estado
  private actualizarTotalEnEstado(): void {
    this.pedidoState.update(state => ({
      ...state,
      total: this.total()
    }));
  }

  // ✅ Remover items
  removerDetalle(index: number): void {
    this.detallesState.update(detalles => 
      detalles.filter((_, i) => i !== index)
    );
    this.actualizarTotalEnEstado();
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
      detalles: detalles,
      personalizaciones: this.personalizacionesState().length > 0 
        ? this.personalizacionesState() 
        : undefined
    };
  }

  // ✅ Método para enviar al backend
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