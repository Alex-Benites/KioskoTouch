import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-tipo-pedido',
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-pedido.component.html',
  styleUrl: './tipo-pedido.component.scss'
})
export class TipoPedidoComponent {
  seleccion: string | null = null;
  //seleccion: string = '';

  constructor(private router: Router) {}

  continuar() {
    if (this.seleccion) {
      // Aquí podrías guardar la elección en un servicio si quieres usarla después
      this.router.navigate(['/cliente/menu']); // Redirige donde quieras
    }
  }
}
