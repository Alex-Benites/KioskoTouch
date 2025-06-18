import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';

@Component({
  selector: 'app-instruccion-pago',
  standalone: true,
  imports: [
    CommonModule,
    PublicidadSectionComponent
  ],
  templateUrl: './instruccion-pago.component.html',
  styleUrls: ['./instruccion-pago.component.scss']
})
export class InstruccionPagoComponent implements OnInit {

  tipoPago: 'tarjeta' | 'efectivo' | 'completado' = 'tarjeta';
  numeroOrden: string = '21';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.tipoPago = params['tipo'] || 'tarjeta';
      this.numeroOrden = params['orden'] || this.generarNumeroOrden();
    });
  }

  onPublicidadCambio(publicidad: Publicidad): void {
    // Manejo de cambio de publicidad si es necesario
  }

  obtenerImagenTipo(): string {
    const imagenes = {
      'tarjeta': 'assets/cliente/tarjeta.png',
      'efectivo': 'assets/cliente/efectivo.png',
      'completado': 'assets/cliente/pedido_completado.png'
    };
    return imagenes[this.tipoPago];
  }

  obtenerTitulo(): string {
    const titulos = {
      'tarjeta': 'Pago con Tarjeta',
      'efectivo': 'Pago en Efectivo',
      'completado': '¡Pedido Completado!'
    };
    return titulos[this.tipoPago];
  }

  obtenerInstrucciones(): string {
    const instrucciones = {
      'tarjeta': 'Acerque su tarjeta para proceder con el pago, por favor.',
      'efectivo': 'Acérquese a caja para proceder con el pago, por favor.',
      'completado': 'Tu orden ha sido procesada exitosamente. No olvide retirar su pedido en caja.'
    };
    return instrucciones[this.tipoPago];
  }

  obtenerTextoBoton(): string {
    const textos = {
      'tarjeta': 'Continuar',
      'efectivo': 'Continuar',
      'completado': 'Finalizar pedido'
    };
    return textos[this.tipoPago];
  }

  private generarNumeroOrden(): string {
    return Math.floor(Math.random() * 1000 + 1).toString();
  }

  continuar(): void {
    switch (this.tipoPago) {
      case 'tarjeta':
      case 'efectivo':
        this.router.navigate(['/cliente/instruccion-pago'], {
          queryParams: { 
            tipo: 'completado', 
            orden: this.generarNumeroOrden()
          }
        });
        break;
      
      case 'completado':
        this.router.navigate(['/cliente/home']);
        break;
    }
  }

  // UTILIZAR A FUTURO
  pagarConTarjeta() {
    this.router.navigate(['/cliente/instruccion-pago'], {
      queryParams: { tipo: 'tarjeta' }
    });
  }

  pagarEnEfectivo() {
    this.router.navigate(['/cliente/instruccion-pago'], {
      queryParams: { tipo: 'efectivo' }
    });
  }
}