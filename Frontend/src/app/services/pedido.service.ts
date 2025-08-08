import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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

  private readonly STORAGE_KEY = 'kiosko-pedido-actual';

  private turnoState = signal<number | null>(null);

  private pedidoCreado: any = null;

  private pedidoState = signal<Partial<Pedido>>({
    tipo_entrega: null,
    numero_mesa: null,
    total: 0,
    valor_descuento: 0,
    is_facturado: true,
  });

  private detallesState = signal<DetallePedido[]>([]);
  private personalizacionesState = signal<PersonalizacionIngrediente[]>([]);

  pedido = this.pedidoState.asReadonly();
  detalles = this.detallesState.asReadonly();
  personalizaciones = this.personalizacionesState.asReadonly();

  tipoEntrega = computed(() => this.pedidoState().tipo_entrega);
  numeroMesa = computed(() => this.pedidoState().numero_mesa);

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

  constructor(private http: HttpClient) {
    this.cargarEstadoPersistido();
    this.cargarTurnoDesdeStorage(); 
  }


  private guardarEstado(): void {
    try {
      const estado = {
        pedido: this.pedidoState(),
        detalles: this.detallesState(),
        personalizaciones: this.personalizacionesState(),
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(estado));
    } catch (error) {
    }
  }

  private cargarEstadoPersistido(): void {
    try {
      const datos = localStorage.getItem(this.STORAGE_KEY);
      if (datos) {
        const estado = JSON.parse(datos);
        
        const unDiaEnMs = 24 * 60 * 60 * 1000;
        if (Date.now() - estado.timestamp > unDiaEnMs) {
          this.limpiarEstadoPersistido();
          return;
        }
        
        this.pedidoState.set(estado.pedido || {
          tipo_entrega: null,
          numero_mesa: null,
          total: 0,
          valor_descuento: 0,
          is_facturado: true,
        });
        
        this.detallesState.set(estado.detalles || []);
        this.personalizacionesState.set(estado.personalizaciones || []);
        
      }
    } catch (error) {
      this.limpiarEstadoPersistido();
    }
  }

  private limpiarEstadoPersistido(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
    }
  }

  limpiarCarritoPersistido(): void {
    this.limpiarPedido(); // Método existente
    this.limpiarEstadoPersistido(); // Nuevo método
  }

  setTipoEntrega(tipo: TipoEntrega): void {
    this.pedidoState.update(state => ({
      ...state,
      tipo_entrega: tipo,
      numero_mesa: tipo === 'llevar' ? null : state.numero_mesa
    }));
    this.guardarEstado();
  }

  setNumeroMesa(mesa: number): void {
    this.pedidoState.update(state => ({
      ...state,
      numero_mesa: mesa
    }));
    this.guardarEstado();
  }

  setTipoPago(tipoPagoId: number): void {
    this.pedidoState.update(state => ({
      ...state,
      tipo_pago_id: tipoPagoId
    }));
  }

  agregarProducto(producto_id: number, precio: number, cantidad: number = 1, personalizacion?: PersonalizacionIngrediente[], precioBase?: number, tamanoCodigo?: string): void {
    
    let detalles = this.detallesState();
    let detalle = detalles.find(d => d.productos);

    if (!detalle) {
      detalle = { productos: [] };
      this.detallesState.update(detalles => [...detalles, detalle!]);
    }

    // Busca si el producto ya existe considerando producto_id, personalización Y tamaño
    let productoExistente = detalle.productos!.find(p =>
      p.producto_id === producto_id &&
      this.personalizacionesIguales(p.personalizacion, personalizacion) &&
      p.tamano_codigo === tamanoCodigo
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
        personalizacion,
        precio_base: precioBase || precio, // ✅ AGREGAR precio base sin personalizaciones
        tamano_codigo: tamanoCodigo // ✅ AGREGAR código de tamaño
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

  }

  private actualizarTotalEnEstado(): void {
    this.pedidoState.update(state => ({
      ...state,
      total: this.total()
    }));
    this.guardarEstado();
  }

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
    this.guardarEstado(); // ✅ AGREGAR
  }

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

  private personalizacionesIguales(p1?: PersonalizacionIngrediente[], p2?: PersonalizacionIngrediente[]): boolean {
    const normalize = (arr?: PersonalizacionIngrediente[]): PersonalizacionIngrediente[] => {
      return arr && Array.isArray(arr) ? arr : [];
    };

    const p1Norm = normalize(p1);
    const p2Norm = normalize(p2);

    // ✅ Si ambas están vacías después de normalizar
    if (p1Norm.length === 0 && p2Norm.length === 0) {
      return true;
    }

    // ✅ Si tienen diferentes longitudes
    if (p1Norm.length !== p2Norm.length) {
      return false;
    }

    try {
      const normalizeItem = (personalizaciones: PersonalizacionIngrediente[]) => {
        return personalizaciones
          .map(p => ({
            ingrediente_id: Number(p.ingrediente_id),
            accion: (p.accion || '').toLowerCase().trim(),
            precio_aplicado: Number(p.precio_aplicado) || 0
          }))
          .sort((a, b) => {
            if (a.ingrediente_id !== b.ingrediente_id) {
              return a.ingrediente_id - b.ingrediente_id;
            }
            return a.accion.localeCompare(b.accion);
          });
      };

      const p1Items = normalizeItem(p1Norm);
      const p2Items = normalizeItem(p2Norm);
      
      const jsonP1 = JSON.stringify(p1Items);
      const jsonP2 = JSON.stringify(p2Items);
      const sonIguales = jsonP1 === jsonP2;
      
      return sonIguales;
      
    } catch (error) {
      return false;
    }
  }


  // Obtener productos para el carrito
  obtenerProductosParaCarrito(): any[] {
    const detalles = this.detallesState();
    const productos: any[] = [];


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
            precio_base: producto.precio_base || (producto.subtotal / producto.cantidad), // ✅ INCLUIR precio base
            subtotal: producto.subtotal,
            personalizacion: producto.personalizacion || [],
            tamano_codigo: producto.tamano_codigo, // ✅ INCLUIR código de tamaño
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

    return productos;
  }

  // Aumentar cantidad de un producto
  aumentarCantidadProducto(index: number): void {
    const productosCarrito = this.obtenerProductosParaCarrito();
    if (index < 0 || index >= productosCarrito.length) return;

    const item = productosCarrito[index];

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

    if (item.tipo === 'producto') {
      this.eliminarProductoInterno(item.producto_id, item.personalizacion);
    } else if (item.tipo === 'menu') {
      this.eliminarMenuInterno(item.menu_id);
    }
  }

  actualizarProductoEnCarrito(
    productoId: number, 
    personalizacionOriginal: PersonalizacionIngrediente[] | undefined,
    nuevaPersonalizacion: PersonalizacionIngrediente[],
    nuevoPrecio: number,
    nuevaCantidad?: number
  ): boolean {
    
    const detalles = this.detallesState();
    let actualizado = false;

    // ✅ BUSCAR Y ACTUALIZAR SOLO EL PRIMER PRODUCTO QUE COINCIDA
    detalles.forEach((detalle, detalleIndex) => {
      if (detalle.productos && !actualizado) {
        const productoIndex = detalle.productos.findIndex(producto => 
          producto.producto_id === productoId &&
          this.personalizacionesIguales(producto.personalizacion, personalizacionOriginal)
        );

        if (productoIndex !== -1) {
          const producto = detalle.productos[productoIndex];
          

          // ✅ ACTUALIZAR CORRECTAMENTE: personalización, cantidad y precio
          producto.personalizacion = [...nuevaPersonalizacion];
          
          // ✅ ACTUALIZAR CANTIDAD SI SE PROPORCIONA
          if (nuevaCantidad !== undefined && nuevaCantidad > 0) {
            producto.cantidad = nuevaCantidad;
          }
          
          // ✅ ACTUALIZAR SUBTOTAL
          producto.subtotal = nuevoPrecio;

          actualizado = true;

        }
      }
    });

    // ✅ GUARDAR CAMBIOS SI SE ACTUALIZÓ
    if (actualizado) {
      this.detallesState.set([...detalles]);
      this.actualizarTotalEnEstado();
      
      
      return true;
    } else {
      return false;
    }
  }


  establecerTurno(numeroTurno: number): void {
    
    this.turnoState.set(numeroTurno);
    
    // ✅ Guardar en localStorage
    try {
      localStorage.setItem('kiosko_turno', numeroTurno.toString());
    } catch (error) {
    }
    
  }

  obtenerTurno(): number | null {
    const turno = this.turnoState();
    return turno;
  }

  tieneTurno(): boolean {
    const turno = this.turnoState();
    const tiene = turno !== null && turno > 0;
    return tiene;
  }

  limpiarTurno(): void {
    
    this.turnoState.set(null);
    
    // ✅ Limpiar de localStorage
    try {
      localStorage.removeItem('kiosko_turno');
    } catch (error) {
    }
    
  }

  limpiarCarrito(): void {
    
    // ✅ Limpiar estados
    this.detallesState.set([]);
    this.actualizarTotalEnEstado();
    
    // ✅ Limpiar localStorage
    this.limpiarStorage();
    
    // ✅ También limpiar turno si existe
    this.limpiarTurno();
    
  }

  private limpiarStorage(): void {
    try {
      localStorage.removeItem('kiosko_pedido_detalles');
    } catch (error) {
    }
  }

  private cargarTurnoDesdeStorage(): void {
    try {
      const turnoGuardado = localStorage.getItem('kiosko_turno');
      if (turnoGuardado) {
        const numeroTurno = parseInt(turnoGuardado, 10);
        if (!isNaN(numeroTurno) && numeroTurno > 0) {
          this.turnoState.set(numeroTurno);
        }
      }
    } catch (error) {
    }
  }

  setPedidoCreado(pedido: any): void {
    this.pedidoCreado = pedido;
    
    // ✅ También guardar en localStorage para persistencia
    try {
      localStorage.setItem('kiosko_pedido_creado', JSON.stringify(pedido));
    } catch (error) {
    }
  }

  getPedidoCreado(): any {
    // ✅ Si no está en memoria, intentar cargar desde localStorage
    if (!this.pedidoCreado) {
      try {
        const datos = localStorage.getItem('kiosko_pedido_creado');
        if (datos) {
          this.pedidoCreado = JSON.parse(datos);
        }
      } catch (error) {
      }
    }
    
    return this.pedidoCreado;
  }

  clearPedidoCreado(): void {
    this.pedidoCreado = null;
    
    // ✅ También limpiar de localStorage
    try {
      localStorage.removeItem('kiosko_pedido_creado');
    } catch (error) {
    }
  }

  cancelarPedidoBackend(numeroPedido: string): Observable<any> {
    
    // ✅ Usar endpoint DELETE para cancelar el pedido
    return this.http.delete(`${this.apiUrl}/${numeroPedido}/cancelar/`).pipe(
      tap(() => {
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  confirmarPagoBackend(numeroPedido: string): Observable<any> {
    
    // ✅ Usar endpoint PATCH para confirmar el pago
    return this.http.patch(`${this.apiUrl}/${numeroPedido}/confirmar-pago/`, {}).pipe(
      tap(() => {
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  limpiarTodoCompletamente(): void {
    
    // ✅ Limpiar carrito
    this.limpiarCarrito();
    
    // ✅ Limpiar pedido creado
    this.clearPedidoCreado();
    
    // ✅ Limpiar estado persistido
    this.limpiarEstadoPersistido();
    
  }

  confirmarPagoConStock(numeroPedido: string, metodoPago: string = 'efectivo'): Observable<any> {
    const url = `${environment.apiUrl}/ventas/pedidos/confirmar-pago/${numeroPedido}/`;    
    const payload = {
      metodo_pago: metodoPago
    };
    
    console.log('💳 Confirmando pago con descuento de stock:', {
      pedido: numeroPedido,
      metodo: metodoPago,
      url: url,
      payload: payload
    });
    
    return this.http.post<any>(url, payload).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Pago confirmado y stock descontado:', response);
          console.log('📊 Stock actualizado:', response.stock_actualizado);
        }
      }),
      catchError(error => {
        console.error('❌ Error al confirmar pago:', error);
        throw error;
      })
    );
  }  

}
