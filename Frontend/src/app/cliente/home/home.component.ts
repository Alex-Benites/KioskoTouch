import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor(private router: Router, private pedidoService: PedidoService) {}

  ngOnInit(): void {
    this.pedidoService.limpiarPedido();
  }

  irAlMenu() {
    this.router.navigate(['/cliente/tipo-pedido']);
  }
}
