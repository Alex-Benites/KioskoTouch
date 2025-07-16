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

  // ✅ AGREGAR clave para localStorage
  private readonly STORAGE_KEY = 'kiosko-pedido-actual';

  private turnoState = signal<number | null>(null);

  // ✅ NUEVO: Estado del pedido creado en backend
  private pedidoCreado: any = null;

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
      console.log('💾 Estado guardado en localStorage');
    } catch (error) {
      console.error('❌ Error guardando estado:', error);
    }
  }

  private cargarEstadoPersistido(): void {
    try {
      const datos = localStorage.getItem(this.STORAGE_KEY);
      if (datos) {
        const estado = JSON.parse(datos);
        
        // ✅ Verificar que no sea muy antiguo (ej: más de 1 día)
        const unDiaEnMs = 24 * 60 * 60 * 1000;
        if (Date.now() - estado.timestamp > unDiaEnMs) {
          console.log('🧹 Estado muy antiguo, iniciando limpio');
          this.limpiarEstadoPersistido();
          return;
        }
        
        // ✅ Restaurar estado
        this.pedidoState.set(estado.pedido || {
          tipo_entrega: null,
          numero_mesa: null,
          total: 0,
          valor_descuento: 0,
          is_facturado: true,
        });
        
        this.detallesState.set(estado.detalles || []);
        this.personalizacionesState.set(estado.personalizaciones || []);
        
        console.log('📋 Estado cargado desde localStorage:', estado);
      }
    } catch (error) {
      console.error('❌ Error cargando estado:', error);
      this.limpiarEstadoPersistido();
    }
  }

  private limpiarEstadoPersistido(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🧹 localStorage limpiado');
    } catch (error) {
      console.error('❌ Error limpiando localStorage:', error);
    }
  }

  // ✅ MÉTODO PÚBLICO para limpiar (después de pagar)
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
    this.guardarEstado(); // ✅ AGREGAR
  }

  setNumeroMesa(mesa: number): void {
    this.pedidoState.update(state => ({
      ...state,
      numero_mesa: mesa
    }));
    this.guardarEstado(); // ✅ AGREGAR
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
    this.guardarEstado(); // ✅ AGREGAR
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
    this.guardarEstado(); // ✅ AGREGAR
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

  // ✅ MEJORAR la comparación de personalizaciones (línea ~520)
  private personalizacionesIguales(p1?: PersonalizacionIngrediente[], p2?: PersonalizacionIngrediente[]): boolean {
    console.log('🔍 === COMPARANDO PERSONALIZACIONES DETALLADO ===');
    console.log('p1 (actual):', p1);
    console.log('p2 (buscada):', p2);

    // ✅ NORMALIZAR: Convertir undefined/null a array vacío
    const normalize = (arr?: PersonalizacionIngrediente[]): PersonalizacionIngrediente[] => {
      return arr && Array.isArray(arr) ? arr : [];
    };

    const p1Norm = normalize(p1);
    const p2Norm = normalize(p2);

    console.log('🔧 p1 normalizado:', p1Norm);
    console.log('🔧 p2 normalizado:', p2Norm);

    // ✅ Si ambas están vacías después de normalizar
    if (p1Norm.length === 0 && p2Norm.length === 0) {
      console.log('✅ Ambas son vacías (después de normalizar) - SON IGUALES');
      return true;
    }

    // ✅ Si tienen diferentes longitudes
    if (p1Norm.length !== p2Norm.length) {
      console.log(`❌ Diferentes longitudes: ${p1Norm.length} vs ${p2Norm.length} - NO SON IGUALES`);
      return false;
    }

    try {
      // ✅ Comparación detallada para arrays con contenido
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
      
      console.log('🔍 Comparación normalizada:', {
        p1_normalized: p1Items,
        p2_normalized: p2Items,
        json_p1: jsonP1,
        json_p2: jsonP2,
        son_iguales: sonIguales
      });
      
      if (sonIguales) {
        console.log('✅ Personalizaciones idénticas - SON IGUALES');
      } else {
        console.log('❌ Personalizaciones diferentes - NO SON IGUALES');
      }
      
      console.log('🔍 === FIN COMPARACIÓN ===');
      return sonIguales;
      
    } catch (error) {
      console.error('❌ Error comparando personalizaciones:', error);
      console.log('🔍 === FIN COMPARACIÓN (ERROR) ===');
      return false;
    }
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

  // ✅ REEMPLAZAR en pedido.service.ts (línea ~734)
  actualizarProductoEnCarrito(
    productoId: number, 
    personalizacionOriginal: PersonalizacionIngrediente[] | undefined,
    nuevaPersonalizacion: PersonalizacionIngrediente[],
    nuevoPrecio: number
  ): boolean {
    console.log('🔄 === SERVICIO: ACTUALIZANDO PRODUCTO (ÚNICO) ===');
    console.log('📥 Datos recibidos:', {
      productoId,
      personalizacionOriginal,
      nuevaPersonalizacion,
      nuevoPrecio,
      timestamp: Date.now()
    });
    
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
          
          console.log('✅ Producto encontrado para actualizar:', {
            detalleIndex,
            productoIndex,
            producto_id: producto.producto_id,
            cantidad: producto.cantidad,
            subtotal_anterior: producto.subtotal,
            precio_unitario_anterior: producto.subtotal / producto.cantidad,
            personalizacion_anterior: producto.personalizacion
          });

          // ✅ ACTUALIZAR CORRECTAMENTE: Primero personalización, luego precio
          producto.personalizacion = [...nuevaPersonalizacion];
          
          // ✅ CLAVE: Actualizar el subtotal basado en el NUEVO precio unitario
          // nuevoPrecio YA es el precio TOTAL (unitario * cantidad)
          // Pero necesitamos calcular el precio unitario correcto
          const nuevoPrecioUnitario = nuevoPrecio / producto.cantidad;
          producto.subtotal = nuevoPrecio;

          actualizado = true;

          console.log('✅ Producto actualizado exitosamente:', {
            nuevo_precio_unitario: nuevoPrecioUnitario,
            nuevo_subtotal: producto.subtotal,
            nueva_personalizacion: producto.personalizacion,
            cantidad: producto.cantidad
          });
        }
      }
    });

    // ✅ GUARDAR CAMBIOS SI SE ACTUALIZÓ
    if (actualizado) {
      this.detallesState.set([...detalles]);
      this.actualizarTotalEnEstado();
      
      console.log('✅ SERVICIO: Estado actualizado correctamente');
      console.log('💾 Total carrito actualizado:', this.total());
      console.log('🔄 === FIN ACTUALIZACIÓN SERVICIO ===');
      
      return true;
    } else {
      console.error('❌ SERVICIO: No se encontró producto para actualizar');
      console.log('🔄 === FIN ACTUALIZACIÓN SERVICIO (FALLÓ) ===');
      return false;
    }
  }


  /**
   * ✅ Establecer número de turno
   */
  establecerTurno(numeroTurno: number): void {
    console.log('🎫 === ESTABLECIENDO TURNO ===');
    console.log('Número de turno:', numeroTurno);
    
    this.turnoState.set(numeroTurno);
    
    // ✅ Guardar en localStorage
    try {
      localStorage.setItem('kiosko_turno', numeroTurno.toString());
      console.log('✅ Turno guardado en localStorage');
    } catch (error) {
      console.error('❌ Error guardando turno:', error);
    }
    
    console.log('🎫 === FIN ESTABLECER TURNO ===');
  }

  /**
   * ✅ Obtener número de turno actual
   */
  obtenerTurno(): number | null {
    const turno = this.turnoState();
    console.log('🎫 Obteniendo turno actual:', turno);
    return turno;
  }

  /**
   * ✅ Verificar si tiene turno asignado
   */
  tieneTurno(): boolean {
    const turno = this.turnoState();
    const tiene = turno !== null && turno > 0;
    console.log('🎫 ¿Tiene turno?', tiene, '(turno:', turno, ')');
    return tiene;
  }

  /**
   * ✅ Limpiar turno
   */
  limpiarTurno(): void {
    console.log('🎫 === LIMPIANDO TURNO ===');
    
    this.turnoState.set(null);
    
    // ✅ Limpiar de localStorage
    try {
      localStorage.removeItem('kiosko_turno');
      console.log('✅ Turno eliminado de localStorage');
    } catch (error) {
      console.error('❌ Error limpiando turno:', error);
    }
    
    console.log('🎫 === FIN LIMPIAR TURNO ===');
  }

  /**
   * ✅ Limpiar todo el carrito
   */
  limpiarCarrito(): void {
    console.log('🗑️ === LIMPIANDO CARRITO COMPLETO ===');
    console.log('Detalles antes:', this.detallesState().length);
    console.log('Total antes:', this.total());
    
    // ✅ Limpiar estados
    this.detallesState.set([]);
    this.actualizarTotalEnEstado();
    
    // ✅ Limpiar localStorage
    this.limpiarStorage();
    
    // ✅ También limpiar turno si existe
    this.limpiarTurno();
    
    console.log('✅ Carrito completamente limpiado');
    console.log('Detalles después:', this.detallesState().length);
    console.log('Total después:', this.total());
    console.log('🗑️ === FIN LIMPIAR CARRITO ===');
  }

  /**
   * ✅ Limpiar solo localStorage
   */
  private limpiarStorage(): void {
    try {
      localStorage.removeItem('kiosko_pedido_detalles');
      console.log('✅ localStorage limpiado');
    } catch (error) {
      console.error('❌ Error limpiando localStorage:', error);
    }
  }

  private cargarTurnoDesdeStorage(): void {
    try {
      const turnoGuardado = localStorage.getItem('kiosko_turno');
      if (turnoGuardado) {
        const numeroTurno = parseInt(turnoGuardado, 10);
        if (!isNaN(numeroTurno) && numeroTurno > 0) {
          this.turnoState.set(numeroTurno);
          console.log('✅ Turno cargado desde localStorage:', numeroTurno);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando turno desde localStorage:', error);
    }
  }

  /**
   * ✅ NUEVO: Guardar información del pedido creado en backend
   */
  setPedidoCreado(pedido: any): void {
    this.pedidoCreado = pedido;
    console.log('📝 Pedido creado guardado para referencia:', pedido);
    
    // ✅ También guardar en localStorage para persistencia
    try {
      localStorage.setItem('kiosko_pedido_creado', JSON.stringify(pedido));
    } catch (error) {
      console.error('❌ Error guardando pedido creado:', error);
    }
  }

  /**
   * ✅ NUEVO: Obtener información del pedido creado
   */
  getPedidoCreado(): any {
    // ✅ Si no está en memoria, intentar cargar desde localStorage
    if (!this.pedidoCreado) {
      try {
        const datos = localStorage.getItem('kiosko_pedido_creado');
        if (datos) {
          this.pedidoCreado = JSON.parse(datos);
        }
      } catch (error) {
        console.error('❌ Error cargando pedido creado:', error);
      }
    }
    
    return this.pedidoCreado;
  }

  /**
   * ✅ NUEVO: Limpiar información del pedido creado
   */
  clearPedidoCreado(): void {
    this.pedidoCreado = null;
    
    // ✅ También limpiar de localStorage
    try {
      localStorage.removeItem('kiosko_pedido_creado');
      console.log('🗑️ Información del pedido creado eliminada');
    } catch (error) {
      console.error('❌ Error limpiando pedido creado:', error);
    }
  }

  /**
   * ✅ NUEVO: Cancelar pedido en backend
   */
  cancelarPedidoBackend(numeroPedido: string): Observable<any> {
    console.log('🗑️ Cancelando pedido en backend:', numeroPedido);
    
    // ✅ Usar endpoint DELETE para cancelar el pedido
    return this.http.delete(`${this.apiUrl}/${numeroPedido}/cancelar/`).pipe(
      tap(() => {
        console.log('✅ Pedido cancelado exitosamente en backend');
      }),
      catchError((error) => {
        console.error('❌ Error cancelando pedido en backend:', error);
        throw error;
      })
    );
  }

  /**
   * ✅ NUEVO: Confirmar pago del pedido en backend
   */
  confirmarPagoBackend(numeroPedido: string): Observable<any> {
    console.log('💳 Confirmando pago en backend:', numeroPedido);
    
    // ✅ Usar endpoint PATCH para confirmar el pago
    return this.http.patch(`${this.apiUrl}/${numeroPedido}/confirmar-pago/`, {}).pipe(
      tap(() => {
        console.log('✅ Pago confirmado exitosamente en backend');
      }),
      catchError((error) => {
        console.error('❌ Error confirmando pago en backend:', error);
        throw error;
      })
    );
  }

  /**
   * ✅ MEJORAR: Limpiar todo completamente (carrito + pedido creado)
   */
  limpiarTodoCompletamente(): void {
    console.log('🧹 === LIMPIANDO TODO COMPLETAMENTE ===');
    
    // ✅ Limpiar carrito
    this.limpiarCarrito();
    
    // ✅ Limpiar pedido creado
    this.clearPedidoCreado();
    
    // ✅ Limpiar estado persistido
    this.limpiarEstadoPersistido();
    
    console.log('✅ TODO LIMPIADO COMPLETAMENTE');
    console.log('🧹 === FIN LIMPIEZA COMPLETA ===');
  }

}
