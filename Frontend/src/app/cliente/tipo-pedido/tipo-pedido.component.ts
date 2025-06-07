import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; // ← Agregar ActivatedRoute
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tipo-pedido',
  templateUrl: './tipo-pedido.component.html',
  styleUrls: ['./tipo-pedido.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TipoPedidoComponent {
  seleccion: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute // ← Agregar esto
  ) {}

  seleccionar(tipo: string): void {
    this.seleccion = tipo;
    console.log('💡 Tipo de pedido seleccionado:', tipo);
  }

  continuar(): void {
    if (this.seleccion) {
      console.log('🚀 Continuando con tipo de pedido:', this.seleccion);
      localStorage.setItem('tipoPedido', this.seleccion);

      // Usar navegación relativa
      this.router.navigate(['menu'], { relativeTo: this.route });
    }
  }
}
