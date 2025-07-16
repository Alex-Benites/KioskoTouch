import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';
import { PinpadService, EstadoPago, PagoResponse } from '../../services/pinpad.service';
import { Subscription } from 'rxjs';
import { PedidoService } from '../../services/pedido.service';

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

  // ✅ PROPIEDADES PARA PINPAD
  estadoPago: EstadoPago = { estado: 'esperando', mensaje: 'Listo para procesar pago' };
  montoTotal: number = 0;
  procesandoPago: boolean = false;
  ultimaTransaccion?: PagoResponse;

  private estadoPagoSubscription?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pinpadService: PinpadService,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    console.log('🎬 Inicializando componente instrucción de pago');
    
    // ✅ REINICIAR ESTADO DEL PINPAD AL INICIO
    this.pinpadService.reiniciarEstado();
    
    this.route.queryParams.subscribe(params => {
      this.tipoPago = params['tipo'] || 'tarjeta';
      this.numeroOrden = params['orden'] || this.generarNumeroOrden();
      

      // ✅ OBTENER DATOS DEL RESUMEN
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

      console.log('📋 Datos recibidos del resumen:', {
        montoTotal: this.montoTotal,
        cantidadProductos: this.cantidadProductos,
        subtotal: this.subtotal,
        iva: this.iva,
        numeroTurno: this.numeroTurno
      });

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
        // ✅ MENSAJE MENOS ALARMANTE
        console.log('ℹ️ Verificación inicial del PinPad pendiente (normal al inicio)');
      }
    });
  }

  /**
   * ✅ PROCESAR PAGO CON TARJETA - CORREGIDO
   */
  private procesarPagoTarjeta(): void {
    console.log('💳 Iniciando proceso de pago con tarjeta...');
    console.log('📊 Datos del pago:', {
      montoTotal: this.montoTotal,
      subtotal: this.subtotal,
      iva: this.iva,
      orden: this.numeroOrden
    });

    // ✅ VALIDAR DATOS ANTES DE ENVIAR
    if (!this.montoTotal || this.montoTotal <= 0) {
      console.error('❌ Monto inválido:', this.montoTotal);
      // ✅ ERROR 1 CORREGIDO: No llamar método privado directamente
      return;
    }

    // ✅ PROCESAR PAGO CON VALORES REALES
    this.pinpadService.procesarPago(
      this.montoTotal,
      this.subtotal,  // Base imponible
      this.iva,       // IVA
      0               // Base 0% (sin productos exentos por ahora)
    ).subscribe({
      next: (respuesta: PagoResponse) => {
        console.log('✅ Respuesta del pago:', respuesta);
        
        if (respuesta.exitoso && respuesta.codigoRespuesta === '00') {
          console.log('🎉 Pago autorizado:', respuesta.autorizacion);
        } else {
          console.warn('⚠️ Pago rechazado:', respuesta.mensajeRespuesta);
        }
      },
      error: (error) => {
        console.error('❌ Error procesando pago:', error);
      }
    });
  }

  /**
   * ✅ MÉTODO PARA CANCELAR PAGO - LÓGICA FINAL CORREGIDA
   */
  cancelarPago(): void {
    console.log('❌ === CANCELANDO PAGO ===');
    
    // ✅ REINICIAR ESTADO DEL PINPAD
    this.pinpadService.reiniciarEstado();
    
    // ✅ LIMPIAR VARIABLES LOCALES
    this.procesandoPago = false;
    this.ultimaTransaccion = undefined;
    this.estadoPago = { estado: 'esperando', mensaje: 'Listo para procesar pago' };
    
    // ✅ RESETEAR TIPO DE PAGO
    this.tipoPago = 'tarjeta';
    
    // 🗑️ OBTENER PEDIDO CREADO Y CANCELARLO EN BACKEND
    const pedidoCreado = this.pedidoService.getPedidoCreado();
    
    if (pedidoCreado && pedidoCreado.numero) {
      console.log('🗑️ Cancelando pedido en backend:', pedidoCreado.numero);
      
      this.pedidoService.cancelarPedidoBackend(pedidoCreado.numero).subscribe({
        next: () => {
          console.log('✅ Pedido cancelado exitosamente en backend');
          this.pedidoService.clearPedidoCreado();
          this.regresarAResumen();
        },
        error: (error) => {
          console.warn('⚠️ Error cancelando pedido backend:', error);
          // ✅ Aún así regresar al resumen (productos conservados)
          this.pedidoService.clearPedidoCreado();
          this.regresarAResumen();
        }
      });
    } else {
      console.log('ℹ️ No hay pedido creado para cancelar, regresando directamente');
      this.regresarAResumen();
    }
  }

  /**
   * ✅ NUEVO: Método auxiliar para regresar al resumen
   */
  private regresarAResumen(): void {
    console.log('🔙 Regresando a resumen-pedido (productos conservados)');
    console.log('❌ === FIN CANCELACIÓN ===');
    this.router.navigate(['/cliente/resumen-pedido']);
  }

  /**
   * ✅ MANEJAR CLICK DEL BOTÓN CONTINUAR - LÓGICA FINAL
   */
  continuar(): void {
    console.log('👆 Botón continuar presionado, estado:', this.tipoPago);
    
    switch (this.tipoPago) {
      case 'tarjeta':
        this.manejarPagoTarjeta();
        break;

      case 'efectivo':
        // ✅ Para efectivo, ir directo a completado
        this.tipoPago = 'completado';
        break;

      case 'completado':
        // ✅ CONFIRMAR PAGO Y FINALIZAR COMPLETAMENTE
        this.confirmarPagoYFinalizar();
        break;
    }
  }

  /**
   * ✅ NUEVO: CONFIRMAR PAGO Y FINALIZAR COMPLETAMENTE
   */
  private confirmarPagoYFinalizar(): void {
    console.log('🎉 === CONFIRMANDO PAGO Y FINALIZANDO ===');
    
    const pedidoCreado = this.pedidoService.getPedidoCreado();
    
    if (pedidoCreado && pedidoCreado.numero) {
      console.log('💳 Confirmando pago en backend para pedido:', pedidoCreado.numero);
      
      // ✅ ACTUALIZAR ESTADO DEL PEDIDO A "PAGADO"
      this.pedidoService.confirmarPagoBackend(pedidoCreado.numero).subscribe({
        next: () => {
          console.log('✅ Pago confirmado exitosamente en backend');
          this.finalizarCompletamente();
        },
        error: (error) => {
          console.warn('⚠️ Error confirmando pago en backend:', error);
          // ✅ Aún así finalizar por seguridad del usuario
          this.finalizarCompletamente();
        }
      });
    } else {
      console.log('ℹ️ No hay pedido creado para confirmar, finalizando directamente');
      this.finalizarCompletamente();
    }
  }

  /**
   * ✅ NUEVO: FINALIZAR COMPLETAMENTE Y LIMPIAR TODO
   */
  private finalizarCompletamente(): void {
    console.log('🧹 Finalizando completamente...');
    
    // ✅ LIMPIAR TODO EL CARRITO Y ESTADO
    this.pedidoService.limpiarTodoCompletamente();
    console.log('🗑️ Carrito y estado limpiados tras confirmar pago');
    
    // ✅ LIMPIAR ESTADO DEL PINPAD
    this.pinpadService.reiniciarEstado();
    
    console.log('🏠 Navegando al home');
    console.log('🎉 === FINALIZACIÓN COMPLETA ===');
    
    // ✅ NAVEGAR AL HOME
    this.router.navigate(['/cliente/home']);
  }

  /**
   * ✅ COMPLETAR PAGO EXITOSO - SOLO CAMBIAR ESTADO (NO LIMPIAR AÚN)
   */
  private completarPago(): void {
    console.log('🎉 Completando pago exitoso...');
    
    // ❌ NO LIMPIAR CARRITO AQUÍ - Solo cambiar estado visual
    // El carrito se limpiará cuando el usuario presione "Finalizar pedido"
    
    // ✅ CAMBIAR A ESTADO COMPLETADO DIRECTAMENTE
    this.tipoPago = 'completado';
    this.estadoPago = { estado: 'exitoso', mensaje: 'Pago completado exitosamente' };
    
    // ✅ REINICIAR ESTADO DEL PINPAD PARA FUTUROS PAGOS
    setTimeout(() => {
      this.pinpadService.reiniciarEstado();
    }, 1000);
    
    console.log('✅ Estado cambiado a completado (carrito conservado hasta confirmación final)');
  }

  /**
   * ✅ MANEJAR LÓGICA DE PAGO CON TARJETA
   */
  private manejarPagoTarjeta(): void {
    console.log('🎯 Manejando pago con tarjeta, estado actual:', this.estadoPago.estado);
    
    switch (this.estadoPago.estado) {
      case 'esperando':
        this.procesarPagoTarjeta();
        break;

      case 'exitoso':
        this.completarPago();
        break;

      case 'error':
        console.log('🔄 Reiniciando estado tras error');
        this.pinpadService.reiniciarEstado();
        break;
        
      case 'procesando':
        console.log('⏳ Pago ya en proceso, esperando...');
        break;
        
      default:
        console.warn('⚠️ Estado no reconocido:', this.estadoPago.estado);
        this.pinpadService.reiniciarEstado();
        break;
    }
  }

  /**
   * ✅ ERROR 2 CORREGIDO: Métodos únicos y simplificados
   */
  private generarNumeroOrden(): string {
    return 'ORD-' + Date.now().toString().slice(-6);
  }

  // ✅ MÉTODOS AUXILIARES SIMPLIFICADOS (sin dependencia de PedidoService)
  pagarConTarjeta(): void {
    this.router.navigate(['/cliente/instruccion-pago'], {
      queryParams: { tipo: 'tarjeta' }
    });
  }

  pagarEnEfectivo(): void {
    this.router.navigate(['/cliente/instruccion-pago'], {
      queryParams: { tipo: 'efectivo' }
    });
  }
}
