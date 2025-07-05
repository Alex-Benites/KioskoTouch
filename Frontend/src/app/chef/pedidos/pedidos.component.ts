import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { PedidoChefService, PedidoChef } from '../../services/pedido-chef.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatBadgeModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    HeaderAdminComponent
  ],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss']
})
export class PedidosComponent implements OnInit, OnDestroy {
  
  // Estados del componente
  selectedTabIndex = 0;
  
  constructor(
    public pedidoChefService: PedidoChefService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('🚀 Iniciando componente de pedidos del chef...');
    this.inicializarComponente();
  }

  ngOnDestroy(): void {
    console.log('🔄 Destruyendo componente de pedidos del chef...');
    // Limpiar selecciones al salir
    this.pedidoChefService.limpiarSelecciones();
  }

  /**
   * Inicializar el componente
   */
  async inicializarComponente(): Promise<void> {
    try {
      // Limpiar estados antiguos
      this.pedidoChefService.limpiarEstadosAntiguos();
      
      // Cargar pedidos
      await this.pedidoChefService.cargarPedidos();
      
      console.log('✅ Componente inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando componente:', error);
      this.mostrarError('Error al cargar los pedidos');
    }
  }

  /**
   * Manejar cambio de tab
   */
  onTabChange(index: number): void {
    console.log(`🔄 Cambiando a tab ${index}`);
    this.selectedTabIndex = index;
    
    // Limpiar selecciones al cambiar de tab
    this.pedidoChefService.limpiarSelecciones();
  }

  /**
   * Togglear selección de un pedido
   */
  toggleSeleccionPedido(pedidoId: number): void {
    console.log(`🔄 Toggle selección pedido ${pedidoId}`);
    this.pedidoChefService.toggleSeleccionPedido(pedidoId);
  }

  /**
   * Cambiar estado de cocina de un pedido
   */
  cambiarEstadoCocina(pedidoId: number, nuevoEstado: 'pendiente' | 'en_preparacion' | 'finalizado'): void {
    console.log(`🍳 Cambiando estado de cocina del pedido ${pedidoId} a ${nuevoEstado}`);
    this.pedidoChefService.cambiarEstadoCocina(pedidoId, nuevoEstado);
    
    // Mostrar confirmación
    const mensajes = {
      'pendiente': 'Pedido marcado como pendiente',
      'en_preparacion': 'Pedido en preparación',
      'finalizado': 'Pedido finalizado'
    };
    
    this.mostrarExito(mensajes[nuevoEstado]);
  }

  /**
   * Finalizar pedidos seleccionados
   */
  async finalizarPedidosSeleccionados(): Promise<void> {
    const seleccionados = this.pedidoChefService.obtenerPedidosSeleccionados(
      this.pedidoChefService.pedidosActivos()
    );
    
    if (seleccionados.length === 0) {
      this.mostrarAdvertencia('No hay pedidos seleccionados');
      return;
    }

    try {
      console.log(`🏁 Finalizando ${seleccionados.length} pedidos...`);
      
      await this.pedidoChefService.finalizarPedidosSeleccionados();
      
      this.mostrarExito(`${seleccionados.length} pedido(s) finalizado(s) exitosamente`);
      
      // Cambiar al tab de finalizados si hay pedidos
      if (this.pedidoChefService.pedidosFinalizados().length > 0) {
        this.selectedTabIndex = 1;
      }
      
    } catch (error) {
      console.error('❌ Error finalizando pedidos:', error);
      this.mostrarError('Error al finalizar los pedidos');
    }
  }

  /**
   * Restaurar pedidos seleccionados
   */
  async restaurarPedidosSeleccionados(): Promise<void> {
    const seleccionados = this.pedidoChefService.obtenerPedidosSeleccionados(
      this.pedidoChefService.pedidosFinalizados()
    );
    
    if (seleccionados.length === 0) {
      this.mostrarAdvertencia('No hay pedidos seleccionados');
      return;
    }

    try {
      console.log(`🔄 Restaurando ${seleccionados.length} pedidos...`);
      
      await this.pedidoChefService.restaurarPedidosSeleccionados();
      
      this.mostrarExito(`${seleccionados.length} pedido(s) restaurado(s) exitosamente`);
      
      // Cambiar al tab de activos si hay pedidos
      if (this.pedidoChefService.pedidosActivos().length > 0) {
        this.selectedTabIndex = 0;
      }
      
    } catch (error) {
      console.error('❌ Error restaurando pedidos:', error);
      this.mostrarError('Error al restaurar los pedidos');
    }
  }

  /**
   * CORREGIDO: Seleccionar todos los pedidos de una lista
   */
  seleccionarTodos(lista: PedidoChef[]): void {
    console.log(`🔄 Seleccionando todos los pedidos: ${lista.length}`);
    
    lista.forEach(pedido => {
      if (!pedido.selected) {
        this.pedidoChefService.toggleSeleccionPedido(pedido.id);
      }
    });
  }

  /**
   * Deseleccionar todos los pedidos
   */
  deseleccionarTodos(): void {
    console.log('🔄 Deseleccionando todos los pedidos');
    this.pedidoChefService.limpiarSelecciones();
  }

  /**
   * Refresh manual de pedidos
   */
  refreshPedidos(): void {
    console.log('🔄 Refresh manual de pedidos');
    this.pedidoChefService.refresh();
    this.mostrarExito('Actualizando pedidos...');
  }

  /**
   * Obtener clase CSS para el estado del pedido
   */
  obtenerClaseEstado(pedido: PedidoChef): string {
    return this.pedidoChefService.obtenerClaseEstado(pedido.estado_cocina);
  }

  /**
   * Obtener texto del estado de cocina
   */
  obtenerTextoEstado(estado: string): string {
    const estados = {
      'pendiente': 'Pendiente',
      'en_preparacion': 'En Preparación',
      'finalizado': 'Finalizado'
    };
    return estados[estado as keyof typeof estados] || estado;
  }

  /**
   * Obtener icono del estado de cocina
   */
  obtenerIconoEstado(estado: string): string {
    const iconos = {
      'pendiente': 'schedule',
      'en_preparacion': 'restaurant_menu',
      'finalizado': 'check_circle'
    };
    return iconos[estado as keyof typeof iconos] || 'help';
  }

  /**
   * Verificar si hay pedidos seleccionados en una lista
   */
  haySeleccionados(lista: PedidoChef[]): boolean {
    return lista.some(pedido => pedido.selected);
  }

  /**
   * Contar pedidos seleccionados
   */
  contarSeleccionados(lista: PedidoChef[]): number {
    return lista.filter(pedido => pedido.selected).length;
  }

  /**
   * Formatear número de mesa
   */
  formatearMesa(numeroMesa: number | null): string {
    if (!numeroMesa) return 'Para llevar';
    return `Mesa ${numeroMesa}`;
  }

  /**
   * Formatear precio
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(precio);
  }

  /**
   * Obtener color del tiempo transcurrido
   */
  obtenerColorTiempo(tiempoTranscurrido: string): string {
    if (tiempoTranscurrido.includes('h') || parseInt(tiempoTranscurrido) > 30) {
      return 'warn'; // Rojo para más de 30 min
    } else if (parseInt(tiempoTranscurrido) > 15) {
      return 'accent'; // Amarillo para más de 15 min
    } else {
      return 'primary'; // Verde para menos de 15 min
    }
  }

  /**
   * Mostrar notificación de éxito
   */
  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Mostrar notificación de error
   */
  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Mostrar notificación de advertencia
   */
  private mostrarAdvertencia(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['warning-snackbar']
    });
  }
}