import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

  private pedidosState = signal<PedidoChef[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);
  private estadosCocinaState = signal<EstadoCocina[]>([]);

  private refreshSubject = new BehaviorSubject<void>(undefined);

  pedidos = this.pedidosState.asReadonly();
  loading = this.loadingState.asReadonly();
  error = this.errorState.asReadonly();
  estadosCocina = this.estadosCocinaState.asReadonly();

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

  cantidadActivos = computed(() => this.pedidosActivos().length);
  cantidadFinalizados = computed(() => this.pedidosFinalizados().length);

  constructor(private http: HttpClient) {
    this.cargarEstadosDesdeStorage();
    this.iniciarRefreshAutomatico();
  }

  async cargarPedidos(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      
      const response = await firstValueFrom(
        this.http.get<ApiResponse>(`${this.apiUrl}/chef/`).pipe(
          catchError((error: HttpErrorResponse) => {
            
            throw error;
          })
        )
      );
      
      
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
      } else {
        throw new Error(response?.message || 'Respuesta inválida del servidor');
      }
    } catch (error: any) {
      
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

  async cambiarEstadoPedido(pedidoId: number, estado: 'activado' | 'desactivado'): Promise<boolean> {
    try {
      
      const response = await firstValueFrom(
        this.http.patch<any>(`${this.apiUrl}/${pedidoId}/estado/`, {
          estado: estado
        })
      );

      if (response?.success) {
        // Recargar pedidos para reflejar el cambio
        await this.cargarPedidos();
        return true;
      } else {
        throw new Error(response?.message || 'Error al cambiar estado');
      }
    } catch (error: any) {
      
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

  cambiarEstadoCocina(pedidoId: number, nuevoEstado: 'pendiente' | 'en_preparacion' | 'finalizado'): void {
    
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

  obtenerEstadoCocina(pedidoId: number): 'pendiente' | 'en_preparacion' | 'finalizado' {
    const estados = this.estadosCocinaState();
    const estado = estados.find(e => e.pedidoId === pedidoId);
    return estado?.estado || 'pendiente';
  }

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

  obtenerPedidosSeleccionados(lista: PedidoChef[]): PedidoChef[] {
    return lista.filter(p => p.selected);
  }

  async finalizarPedidosSeleccionados(): Promise<void> {
    const seleccionados = this.obtenerPedidosSeleccionados(this.pedidosActivos());
    
    
    for (const pedido of seleccionados) {
      // Cambiar estado de cocina a finalizado
      this.cambiarEstadoCocina(pedido.id, 'finalizado');
      
      // Cambiar estado en el backend a desactivado
      await this.cambiarEstadoPedido(pedido.id, 'desactivado');
      
      // Limpiar selección
      pedido.selected = false;
    }
    
  }

  async restaurarPedidosSeleccionados(): Promise<void> {
    const seleccionados = this.obtenerPedidosSeleccionados(this.pedidosFinalizados());
    
    
    for (const pedido of seleccionados) {
      // Cambiar estado de cocina a pendiente
      this.cambiarEstadoCocina(pedido.id, 'pendiente');
      
      // Cambiar estado en el backend a activado
      await this.cambiarEstadoPedido(pedido.id, 'activado');
      
      // Limpiar selección
      pedido.selected = false;
    }
    
  }

  obtenerClaseEstado(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'pendiente';
      case 'en_preparacion': return 'en-preparacion';
      case 'finalizado': return 'finalizado';
      default: return '';
    }
  }

  limpiarSelecciones(): void {
    const pedidos = this.pedidosState();
    const pedidosActualizados = pedidos.map(pedido => ({
      ...pedido,
      selected: false
    }));
    
    this.pedidosState.set(pedidosActualizados);
  }

  private actualizarEstadoPedido(pedidoId: number, nuevoEstado: 'pendiente' | 'en_preparacion' | 'finalizado'): void {
    const pedidos = this.pedidosState();
    const pedido = pedidos.find(p => p.id === pedidoId);
    
    if (pedido) {
      pedido.estado_cocina = nuevoEstado;
      this.pedidosState.set([...pedidos]);
    }
  }

  private cargarEstadosDesdeStorage(): void {
    try {
      const estadosGuardados = localStorage.getItem(this.STORAGE_KEY);
      if (estadosGuardados) {
        const estados = JSON.parse(estadosGuardados);
        this.estadosCocinaState.set(estados);
      }
    } catch (error) {
    }
  }

  private guardarEstadosEnStorage(): void {
    try {
      const estados = this.estadosCocinaState();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(estados));
    } catch (error) {
    }
  }

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
    }
  }

  private iniciarRefreshAutomatico(): void {
    interval(this.REFRESH_INTERVAL).subscribe(() => {
      if (!this.loadingState()) {
        this.cargarPedidos();
      }
    });
  }

  refresh(): void {
    this.cargarPedidos();
  }

  ngOnDestroy(): void {
  }
}