import { Component, signal, computed, inject } from '@angular/core';
import { Router} from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoEntrega } from '../../models/pedido.model'; 
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-tipo-pedido',
  templateUrl: './tipo-pedido.component.html',
  styleUrls: ['./tipo-pedido.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TipoPedidoComponent {
  
  seleccionLocal = signal<TipoEntrega | ''>('');

  router = inject(Router);
  PedidoService = inject(PedidoService);

  puedeContinuar = computed(() => this.seleccionLocal() !== '');

  tipoEntregaActual = this.PedidoService.tipoEntrega;
  resumenPedido = this.PedidoService.resumenPedido;

  constructor(
  ) {}

  seleccionar(tipo: TipoEntrega){
    this.seleccionLocal.set(tipo);
  }

continuar(): void {
  const tipo = this.seleccionLocal();
  if (tipo) {
    console.log('🚀 Tipo seleccionado:', tipo);
    console.log('🧭 URL actual antes de navegar:', this.router.url);
    
    this.PedidoService.setTipoEntrega(tipo);
    
    this.router.navigate(['/cliente/menu']).then(success => {
      console.log('✅ Navegación result:', success);
      console.log('🧭 URL después de navegar:', this.router.url);
      
      // ✅ NUEVO: Verificar después de un momento
      setTimeout(() => {
        console.log('🧭 URL después de 500ms:', this.router.url);
        console.log('🧭 Router state:', this.router.routerState.snapshot);
      }, 500);
      
    }).catch(error => {
      console.error('💥 Error de navegación:', error);
    });
  }
}


}
