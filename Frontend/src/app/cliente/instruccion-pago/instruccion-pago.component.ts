import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';
import { PinpadService, EstadoPago, PagoResponse } from '../../services/pinpad.service';
import { Subscription } from 'rxjs';

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
export class InstruccionPagoComponent implements OnInit, OnDestroy {

  tipoPago: 'tarjeta' | 'efectivo' | 'completado' = 'tarjeta';
  numeroOrden: string = '21';
  cantidadProductos: number = 0;
  subtotal: number = 0;
  iva: number = 0;
  numeroTurno?: string;
  datosFacturacion?: any;

  // ✅ NUEVAS PROPIEDADES PARA PINPAD
  estadoPago: EstadoPago = { estado: 'esperando', mensaje: 'Listo para procesar pago' };
  montoTotal: number = 0;
  procesandoPago: boolean = false;
  ultimaTransaccion?: PagoResponse;
  
  private estadoPagoSubscription?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pinpadService: PinpadService // ✅ INYECTAR SERVICIO
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.tipoPago = params['tipo'] || 'tarjeta';
      this.numeroOrden = params['orden'] || this.generarNumeroOrden();
      
      // ✅ OBTENER MONTO REAL DEL RESUMEN
      this.montoTotal = parseFloat(params['monto']) || 0;
      this.cantidadProductos = parseInt(params['productos']) || 0;
      this.subtotal = parseFloat(params['subtotal']) || 0;
      this.iva = parseFloat(params['iva']) || 0;
      this.numeroTurno = params['turno'] || undefined;
      
      // ✅ OBTENER DATOS DE FACTURACIÓN SI EXISTEN
      if (params['facturacion']) {
        try {
          this.datosFacturacion = JSON.parse(params['facturacion']);
        } catch (e) {
          console.warn('⚠️ Error parseando datos de facturación');
        }
      }

      console.log('📋 Datos recibidos del resumen:');
      console.log('   💰 Monto total:', this.montoTotal);
      console.log('   🛒 Cantidad productos:', this.cantidadProductos);
      console.log('   💵 Subtotal:', this.subtotal);
      console.log('   🏛️ IVA:', this.iva);
      console.log('   🎫 Turno:', this.numeroTurno);
      console.log('   📄 Facturación:', this.datosFacturacion);

      // ✅ VALIDAR que tenemos monto válido
      if (this.montoTotal <= 0) {
        console.error('❌ Monto inválido recibido');
        this.router.navigate(['/cliente/carrito']);
        return;
      }
    });

    // ✅ SUSCRIBIRSE AL ESTADO DEL PAGO
    this.estadoPagoSubscription = this.pinpadService.estadoPago$.subscribe(
      estado => {
        this.estadoPago = estado;
        this.procesandoPago = estado.estado === 'procesando';
        
        // ✅ MANEJAR RESPUESTA EXITOSA
        if (estado.estado === 'exitoso' && estado.respuesta) {
          this.ultimaTransaccion = estado.respuesta;
          this.completarPago();
        }
      }
    );

    // ✅ VERIFICAR CONECTIVIDAD AL INICIALIZAR
    if (this.tipoPago === 'tarjeta') {
      this.verificarConectividad();
    }
  }


  ngOnDestroy(): void {
    if (this.estadoPagoSubscription) {
      this.estadoPagoSubscription.unsubscribe();
    }
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
    // ✅ INSTRUCCIONES DINÁMICAS SEGÚN ESTADO
    if (this.tipoPago === 'tarjeta') {
      switch (this.estadoPago.estado) {
        case 'esperando':
          return 'Presione "Pagar con Tarjeta" para iniciar el proceso de pago.';
        case 'procesando':
          return this.estadoPago.mensaje;
        case 'exitoso':
          return '¡Pago procesado exitosamente!';
        case 'error':
          return `Error: ${this.estadoPago.mensaje}`;
        default:
          return 'Acerque su tarjeta para proceder con el pago, por favor.';
      }
    }

    const instrucciones = {
      'efectivo': 'Acérquese a caja para proceder con el pago, por favor.',
      'completado': 'Tu orden ha sido procesada exitosamente. No olvide retirar su pedido en caja.'
    };
    return instrucciones[this.tipoPago] || '';
  }

  obtenerTextoBoton(): string {
    if (this.tipoPago === 'tarjeta') {
      switch (this.estadoPago.estado) {
        case 'esperando':
          return 'Pagar con Tarjeta';
        case 'procesando':
          return 'Procesando...';
        case 'exitoso':
          return 'Continuar';
        case 'error':
          return 'Reintentar';
        default:
          return 'Pagar con Tarjeta';
      }
    }

    const textos = {
      'efectivo': 'Continuar',
      'completado': 'Finalizar pedido'
    };
    return textos[this.tipoPago] || 'Continuar';
  }

  /**
   * ✅ VERIFICAR CONECTIVIDAD CON PINPAD
   */
  private verificarConectividad(): void {
    this.pinpadService.verificarConectividad().subscribe({
      next: (respuesta) => {
        console.log('✅ PinPad conectado:', respuesta);
      },
      error: (error) => {
        console.warn('⚠️ PinPad no disponible:', error);
      }
    });
  }

  /**
   * ✅ PROCESAR PAGO CON TARJETA
   */
  private procesarPagoTarjeta(): void {
    this.pinpadService.procesarPago(this.montoTotal).subscribe({
      next: (respuesta: PagoResponse) => {
        if (respuesta.exitoso) {
          this.pinpadService['actualizarEstado']('exitoso', 'Pago autorizado', respuesta);
        } else {
          this.pinpadService['actualizarEstado']('error', respuesta.mensajeRespuesta);
        }
      },
      error: (error) => {
        console.error('❌ Error procesando pago:', error);
        this.pinpadService['actualizarEstado']('error', 'Error de comunicación con PinPad');
      }
    });
  }

  /**
   * ✅ COMPLETAR PAGO EXITOSO
   */
  private completarPago(): void {
    setTimeout(() => {
      this.router.navigate(['/cliente/instruccion-pago'], {
        queryParams: { 
          tipo: 'completado', 
          orden: this.numeroOrden,
          autorizacion: this.ultimaTransaccion?.autorizacion
        }
      });
    }, 2000); // Mostrar mensaje de éxito por 2 segundos
  }

  private generarNumeroOrden(): string {
    return Math.floor(Math.random() * 1000 + 1).toString();
  }

  /**
   * ✅ MANEJAR CLICK DEL BOTÓN CONTINUAR
   */
  continuar(): void {
    switch (this.tipoPago) {
      case 'tarjeta':
        this.manejarPagoTarjeta();
        break;
      
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

  /**
   * ✅ MANEJAR LÓGICA DE PAGO CON TARJETA
   */
  private manejarPagoTarjeta(): void {
    switch (this.estadoPago.estado) {
      case 'esperando':
        this.procesarPagoTarjeta();
        break;
      
      case 'exitoso':
        this.completarPago();
        break;
      
      case 'error':
        this.pinpadService.reiniciarEstado();
        break;
    }
  }

  /**
   * ✅ MÉTODO PARA CANCELAR PAGO
   */
  cancelarPago(): void {
    this.pinpadService.reiniciarEstado();
    this.router.navigate(['/cliente/home']);
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