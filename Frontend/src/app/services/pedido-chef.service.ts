import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces para el servicio del chef
export interface PedidoChef {
  id: number;
  numero: string;
  total: number;
  numero_mesa: number | null;
  tipo_entrega: string;
  created_at: string;
  tiempo_transcurrido: string;
  estado: {
    id: number;
    nombre: string;
    activo: boolean;
  };
  items: ItemPedidoChef[];
  // Estados de cocina (solo frontend)
  estado_cocina: 'pendiente' | 'en_preparacion' | 'finalizado';
  selected?: boolean;
}

export interface ItemPedidoChef {
  id: number;
  cantidad: number;
  nombre: string;
  tipo: 'producto' | 'menu';
  precio_unitario: number;
  subtotal: number;
  producto_id?: number;
  menu_id?: number;
  personalizaciones?: PersonalizacionChef[];
  promocion?: PromocionChef;
}

export interface PersonalizacionChef {
  ingrediente: string;
  accion: string;
  cantidad: number;
  precio_aplicado: number;
}

export interface PromocionChef {
  nombre: string;
  descuento: number;
  precio_original: number | null;
}

export interface EstadoCocina {
  pedidoId: number;
  estado: 'pendiente' | 'en_preparacion' | 'finalizado';
  timestamp: string;
}

export interface ApiResponse {
  success: boolean;
  data: PedidoChef[];
  total: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PedidoChefService {
  private apiUrl = `${environment.apiUrl}/ventas/pedidos`;
  private readonly STORAGE_KEY = 'chef_estados_cocina';
  private readonly REFRESH_INTERVAL = 30000; // 30 segundos

  // Estados del servicio
  private pedidosState = signal<PedidoChef[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);
  private estadosCocinaState = signal<EstadoCocina[]>([]);

  // Subjects para manejo de actualizaciones
  private refreshSubject = new BehaviorSubject<void>(undefined);

  // Getters públicos (read-only)
  pedidos = this.pedidosState.asReadonly();
  loading = this.loadingState.asReadonly();
  error = this.errorState.asReadonly();
  estadosCocina = this.estadosCocinaState.asReadonly();

  // Computed signals para filtros
  pedidosActivos = computed(() => {
    return this.pedidosState().filter(pedido => {
      const estadoCocina = this.obtenerEstadoCocina(pedido.id);
      return estadoCocina === 'pendiente' || estadoCocina === 'en_preparacion';
    });
  });

  pedidosFinalizados = computed(() => {
    return this.pedidosState().filter(pedido => {
      const estadoCocina = this.obtenerEstadoCocina(pedido.id);
      return estadoCocina === 'finalizado';
    });
  });

  // Computed para contadores
  cantidadActivos = computed(() => this.pedidosActivos().length);
  cantidadFinalizados = computed(() => this.pedidosFinalizados().length);

  constructor(private http: HttpClient) {
    this.cargarEstadosDesdeStorage();
    this.iniciarRefreshAutomatico();
  }

  /**
   * Cargar pedidos desde el backend con manejo de lista vacía
   */
  async cargarPedidos(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      console.log('🔄 Cargando pedidos del chef...');
      console.log('URL:', `${this.apiUrl}/chef/`);
      
      const response = await firstValueFrom(
        this.http.get<ApiResponse>(`${this.apiUrl}/chef/`).pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('❌ Error HTTP:', error);
            console.error('Status:', error.status);
            console.error('StatusText:', error.statusText);
            console.error('Error body:', error.error);
            console.error('Response text:', error.error?.text || 'No text');
            
            throw error;
          })
        )
      );
      
      console.log('✅ Respuesta recibida:', response);
      
      if (response?.success) {
        // Manejar data vacía o undefined
        const pedidosData = response.data || [];
        
        // Agregar estados de cocina a cada pedido
        const pedidosConEstado = pedidosData.map(pedido => ({
          ...pedido,
          estado_cocina: this.obtenerEstadoCocina(pedido.id),
          selected: false
        }));

        this.pedidosState.set(pedidosConEstado);
        console.log('✅ Pedidos cargados exitosamente:', pedidosConEstado.length);
        
        // Mensaje informativo si no hay pedidos
        if (pedidosConEstado.length === 0) {
          console.log('ℹ️ No hay pedidos en las últimas 24 horas');
        }
      } else {
        console.error('❌ Respuesta inválida:', response);
        throw new Error(response?.message || 'Respuesta inválida del servidor');
      }
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      
      let mensajeError = 'Error desconocido';
      
      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          mensajeError = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
        } else if (error.status === 404) {
          mensajeError = 'Endpoint no encontrado. Verifica la URL del API.';
        } else if (error.status === 500) {
          mensajeError = 'Error interno del servidor.';
        } else if (error.error?.message) {
          mensajeError = error.error.message;
        } else {
          mensajeError = `Error HTTP ${error.status}: ${error.statusText}`;
        }
      } else if (error?.message) {
        mensajeError = error.message;
      }
      
      this.errorState.set(mensajeError);
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Cambiar estado de un pedido en el backend
   */
  async cambiarEstadoPedido(pedidoId: number, estado: 'activado' | 'desactivado'): Promise<boolean> {
    try {
      console.log(`🔄 Cambiando estado del pedido ${pedidoId} a ${estado}...`);
      
      const response = await firstValueFrom(
        this.http.patch<any>(`${this.apiUrl}/${pedidoId}/estado/`, {
          estado: estado
        })
      );

      if (response?.success) {
        console.log('✅ Estado cambiado exitosamente');
        // Recargar pedidos para reflejar el cambio
        await this.cargarPedidos();
        return true;
      } else {
        throw new Error(response?.message || 'Error al cambiar estado');
      }
    } catch (error: any) {
      console.error('❌ Error cambiando estado:', error);
      
      let mensajeError = 'Error al cambiar estado';
      if (error?.error?.message) {
        mensajeError = error.error.message;
      } else if (error?.message) {
        mensajeError = error.message;
      }
      
      this.errorState.set(mensajeError);
      return false;
    }
  }

  /**
   * Cambiar estado de cocina (solo frontend)
   */
  cambiarEstadoCocina(pedidoId: number, nuevoEstado: 'pendiente' | 'en_preparacion' | 'finalizado'): void {
    console.log(`🍳 Cambiando estado de cocina del pedido ${pedidoId} a ${nuevoEstado}`);
    
    const estadosActuales = this.estadosCocinaState();
    const indiceExistente = estadosActuales.findIndex(e => e.pedidoId === pedidoId);
    
    const nuevoEstadoObj: EstadoCocina = {
      pedidoId,
      estado: nuevoEstado,
      timestamp: new Date().toISOString()
    };

    if (indiceExistente >= 0) {
      estadosActuales[indiceExistente] = nuevoEstadoObj;
    } else {
      estadosActuales.push(nuevoEstadoObj);
    }
    
    this.estadosCocinaState.set([...estadosActuales]);
    this.guardarEstadosEnStorage();
    
    // Actualizar el pedido en el estado
    this.actualizarEstadoPedido(pedidoId, nuevoEstado);
  }

  /**
   * Obtener estado de cocina de un pedido
   */
  obtenerEstadoCocina(pedidoId: number): 'pendiente' | 'en_preparacion' | 'finalizado' {
    const estados = this.estadosCocinaState();
    const estado = estados.find(e => e.pedidoId === pedidoId);
    return estado?.estado || 'pendiente';
  }

  /**
   * Togglear selección de un pedido
   */
  toggleSeleccionPedido(pedidoId: number): void {
    const pedidos = this.pedidosState();
    const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);
    
    if (pedidoIndex >= 0) {
      // Crear una copia del array para mantener inmutabilidad
      const pedidosActualizados = [...pedidos];
      pedidosActualizados[pedidoIndex] = {
        ...pedidosActualizados[pedidoIndex],
        selected: !pedidosActualizados[pedidoIndex].selected
      };
      
      this.pedidosState.set(pedidosActualizados);
    }
  }

  /**
   * Seleccionar un pedido específico
   */
  seleccionarPedido(pedidoId: number, seleccionado: boolean): void {
    const pedidos = this.pedidosState();
    const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);
    
    if (pedidoIndex >= 0) {
      const pedidosActualizados = [...pedidos];
      pedidosActualizados[pedidoIndex] = {
        ...pedidosActualizados[pedidoIndex],
        selected: seleccionado
      };
      
      this.pedidosState.set(pedidosActualizados);
    }
  }

  /**
   * Obtener pedidos seleccionados
   */
  obtenerPedidosSeleccionados(lista: PedidoChef[]): PedidoChef[] {
    return lista.filter(p => p.selected);
  }

  /**
   * Finalizar pedidos seleccionados
   */
  async finalizarPedidosSeleccionados(): Promise<void> {
    const seleccionados = this.obtenerPedidosSeleccionados(this.pedidosActivos());
    
    console.log(`🏁 Finalizando ${seleccionados.length} pedidos seleccionados...`);
    
    for (const pedido of seleccionados) {
      // Cambiar estado de cocina a finalizado
      this.cambiarEstadoCocina(pedido.id, 'finalizado');
      
      // Cambiar estado en el backend a desactivado
      await this.cambiarEstadoPedido(pedido.id, 'desactivado');
      
      // Limpiar selección
      pedido.selected = false;
    }
    
    console.log('✅ Pedidos finalizados exitosamente');
  }

  /**
   * Restaurar pedidos seleccionados
   */
  async restaurarPedidosSeleccionados(): Promise<void> {
    const seleccionados = this.obtenerPedidosSeleccionados(this.pedidosFinalizados());
    
    console.log(`🔄 Restaurando ${seleccionados.length} pedidos seleccionados...`);
    
    for (const pedido of seleccionados) {
      // Cambiar estado de cocina a pendiente
      this.cambiarEstadoCocina(pedido.id, 'pendiente');
      
      // Cambiar estado en el backend a activado
      await this.cambiarEstadoPedido(pedido.id, 'activado');
      
      // Limpiar selección
      pedido.selected = false;
    }
    
    console.log('✅ Pedidos restaurados exitosamente');
  }

  /**
   * Obtener clase CSS para el estado del pedido
   */
  obtenerClaseEstado(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'pendiente';
      case 'en_preparacion': return 'en-preparacion';
      case 'finalizado': return 'finalizado';
      default: return '';
    }
  }

  /**
   * Limpiar todas las selecciones
   */
  limpiarSelecciones(): void {
    const pedidos = this.pedidosState();
    const pedidosActualizados = pedidos.map(pedido => ({
      ...pedido,
      selected: false
    }));
    
    this.pedidosState.set(pedidosActualizados);
    console.log('🧹 Selecciones limpiadas');
  }

  /**
   * Actualizar estado de un pedido específico
   */
  private actualizarEstadoPedido(pedidoId: number, nuevoEstado: 'pendiente' | 'en_preparacion' | 'finalizado'): void {
    const pedidos = this.pedidosState();
    const pedido = pedidos.find(p => p.id === pedidoId);
    
    if (pedido) {
      pedido.estado_cocina = nuevoEstado;
      this.pedidosState.set([...pedidos]);
    }
  }

  /**
   * Cargar estados desde localStorage
   */
  private cargarEstadosDesdeStorage(): void {
    try {
      const estadosGuardados = localStorage.getItem(this.STORAGE_KEY);
      if (estadosGuardados) {
        const estados = JSON.parse(estadosGuardados);
        this.estadosCocinaState.set(estados);
        console.log('✅ Estados de cocina cargados desde localStorage');
      }
    } catch (error) {
      console.error('❌ Error cargando estados desde localStorage:', error);
    }
  }

  /**
   * Guardar estados en localStorage
   */
  private guardarEstadosEnStorage(): void {
    try {
      const estados = this.estadosCocinaState();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(estados));
      console.log('💾 Estados de cocina guardados en localStorage');
    } catch (error) {
      console.error('❌ Error guardando estados en localStorage:', error);
    }
  }

  /**
   * Limpiar estados antiguos (más de 24 horas)
   */
  limpiarEstadosAntiguos(): void {
    const estadosActuales = this.estadosCocinaState();
    const hace24Horas = new Date();
    hace24Horas.setHours(hace24Horas.getHours() - 24);

    const estadosFiltrados = estadosActuales.filter(estado => {
      const fechaEstado = new Date(estado.timestamp);
      return fechaEstado > hace24Horas;
    });

    if (estadosFiltrados.length !== estadosActuales.length) {
      this.estadosCocinaState.set(estadosFiltrados);
      this.guardarEstadosEnStorage();
      console.log(`🧹 Estados antiguos limpiados: ${estadosActuales.length - estadosFiltrados.length} eliminados`);
    }
  }

  /**
   * Iniciar refresh automático
   */
  private iniciarRefreshAutomatico(): void {
    // Refresh cada 30 segundos
    interval(this.REFRESH_INTERVAL).subscribe(() => {
      if (!this.loadingState()) {
        this.cargarPedidos();
      }
    });
  }

  /**
   * Refresh manual
   */
  refresh(): void {
    this.cargarPedidos();
  }

  /**
   * Cleanup al destruir el servicio
   */
  ngOnDestroy(): void {
    // Limpiar subscripciones si es necesario
  }
}