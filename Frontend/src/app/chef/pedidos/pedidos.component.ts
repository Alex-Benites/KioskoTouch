import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';

@Component({
  selector: 'app-pedidos',
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatBadgeModule,
    HeaderAdminComponent
  ],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss']
})
export class PedidosComponent implements OnInit {

  pedidosActivos: any[] = [];
  pedidosFinalizados: any[] = [];
  selectedTabIndex = 0;

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos() {
    // Lógica para cargar pedidos
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
  }

  finalizarPedido(id: number){
    // Logica para finalizar pedido 
  }
}