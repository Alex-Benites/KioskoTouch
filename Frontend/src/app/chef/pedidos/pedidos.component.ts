import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';

@Component({
  selector: 'app-pedidos',
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatBadgeModule,
    MatCheckboxModule,
    MatButtonModule,
    HeaderAdminComponent
  ],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss']
})
export class PedidosComponent implements OnInit {

  pedidosActivos: any[] = [
    {
      id: 1,
      numero: 'P-001',
      tiempo_transcurrido: '5 min',
      estado: 'pendiente',
      selected: false,
      items: [
        { id: 1, cantidad: 2, nombre: 'Hamburguesa Clásica' },
        { id: 2, cantidad: 1, nombre: 'Papas Fritas Grandes' },
        { id: 3, cantidad: 2, nombre: 'Coca Cola' }
      ]
    },
    {
      id: 2,
      numero: 'P-002',
      tiempo_transcurrido: '12 min',
      estado: 'en_preparacion',
      selected: false,
      items: [
        { id: 4, cantidad: 1, nombre: 'Pizza Margherita' },
        { id: 5, cantidad: 1, nombre: 'Ensalada César' }
      ]
    },
    {
      id: 3,
      numero: 'P-003',
      tiempo_transcurrido: '3 min',
      estado: 'pendiente',
      selected: false,
      items: [
        { id: 6, cantidad: 3, nombre: 'Tacos al Pastor' },
        { id: 7, cantidad: 1, nombre: 'Agua de Horchata' }
      ]
    },
    {
      id: 4,
      numero: 'P-004',
      tiempo_transcurrido: '18 min',
      estado: 'en_preparacion',
      selected: false,
      items: [
        { id: 8, cantidad: 1, nombre: 'Pasta Alfredo' },
        { id: 9, cantidad: 1, nombre: 'Pan de Ajo' },
        { id: 10, cantidad: 1, nombre: 'Vino Tinto' }
      ]
    }
  ];

  pedidosFinalizados: any[] = [
    {
      id: 5,
      numero: 'P-005',
      hora_finalizacion: '14:30',
      estado: 'finalizado',
      selected: false,
      items: [
        { id: 11, cantidad: 2, nombre: 'Sándwich Club' },
        { id: 12, cantidad: 1, nombre: 'Jugo de Naranja' }
      ]
    },
    {
      id: 6,
      numero: 'P-006',
      hora_finalizacion: '14:15',
      estado: 'finalizado',
      selected: false,
      items: [
        { id: 13, cantidad: 1, nombre: 'Pollo a la Parrilla' },
        { id: 14, cantidad: 1, nombre: 'Arroz con Verduras' },
        { id: 15, cantidad: 1, nombre: 'Limonada' }
      ]
    }
  ];

  selectedTabIndex = 0;

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos() {
    console.log('Pedidos cargados');
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    this.clearAllSelections();
  }

  togglePedidoSelection(pedido: any) {
    pedido.selected = !pedido.selected;
  }

  clearAllSelections() {
    this.pedidosActivos.forEach(p => p.selected = false);
    this.pedidosFinalizados.forEach(p => p.selected = false);
  }

  getSelectedPedidos(lista: any[]) {
    return lista.filter(p => p.selected);
  }

  finalizarPedidosSeleccionados() {
    const seleccionados = this.getSelectedPedidos(this.pedidosActivos);
    
    seleccionados.forEach(pedido => {
      pedido.estado = 'finalizado';
      pedido.hora_finalizacion = new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      pedido.selected = false;
      
      const index = this.pedidosActivos.findIndex(p => p.id === pedido.id);
      if (index > -1) {
        this.pedidosActivos.splice(index, 1);
        this.pedidosFinalizados.unshift(pedido);
      }
    });
  }

  restaurarPedidosSeleccionados() {
    const seleccionados = this.getSelectedPedidos(this.pedidosFinalizados);
    
    seleccionados.forEach(pedido => {
      pedido.estado = 'pendiente';
      pedido.tiempo_transcurrido = '0 min';
      delete pedido.hora_finalizacion;
      pedido.selected = false;
      
      const index = this.pedidosFinalizados.findIndex(p => p.id === pedido.id);
      if (index > -1) {
        this.pedidosFinalizados.splice(index, 1);
        this.pedidosActivos.unshift(pedido);
      }
    });
  }

  getTipoClasePedido(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'pendiente';
      case 'en_preparacion': return 'en-preparacion';
      case 'finalizado': return 'finalizado';
      default: return '';
    }
  }
}