import { Component, OnInit, OnDestroy, Renderer2, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';
import { PinpadService, EstadoPago, PagoResponse } from '../../services/pinpad.service';
import { Subscription } from 'rxjs';
import { PedidoService } from '../../services/pedido.service';
import { CatalogoService } from '../../services/catalogo.service';

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

  estadoPago: EstadoPago = { estado: 'esperando', mensaje: 'Listo para procesar pago' };
  montoTotal: number = 0;
  procesandoPago: boolean = false;
  ultimaTransaccion?: PagoResponse;

  private renderer = inject(Renderer2);
  private catalogoService = inject(CatalogoService);
  ivaActual: number = 15.0; // Valor por defecto, se cargará dinámicamente
  productosCarrito: any[] = [];

  private estadoPagoSubscription?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pinpadService: PinpadService,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    
    this.pinpadService.reiniciarEstado();
    
    this.route.queryParams.subscribe(params => {
      this.tipoPago = params['tipo'] || 'tarjeta';
      this.numeroOrden = params['orden'] || this.generarNumeroOrden();
      

      this.montoTotal = parseFloat(params['monto']) || 0;
      this.cantidadProductos = parseInt(params['productos']) || 0;
      this.subtotal = parseFloat(params['subtotal']) || 0;
      this.iva = parseFloat(params['iva']) || 0;
      this.numeroTurno = params['turno'] || undefined;

      if (params['facturacion']) {
        try {
          this.datosFacturacion = JSON.parse(params['facturacion']);
        } catch (e) {
        }
      }


      if (this.montoTotal <= 0) {
        this.router.navigate(['/cliente/carrito']);
        return;
      }
    });

    this.estadoPagoSubscription = this.pinpadService.estadoPago$.subscribe(
      estado => {
        this.estadoPago = estado;
        this.procesandoPago = estado.estado === 'procesando';

        if (estado.estado === 'exitoso' && estado.respuesta) {
          this.ultimaTransaccion = estado.respuesta;
          this.completarPago();
        }
      }
    );

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
   * VERIFICAR CONECTIVIDAD CON PINPAD
   */
  private verificarConectividad(): void {
    this.pinpadService.verificarConectividad().subscribe({
      next: (respuesta) => {
      },
      error: (error) => {
      }
    });
  }

  /**
   * PROCESAR PAGO CON TARJETA - CORREGIDO
   */
  private procesarPagoTarjeta(): void {

    if (!this.montoTotal || this.montoTotal <= 0) {
      return;
    }

    this.pinpadService.procesarPago(
      this.montoTotal,
      this.subtotal,  // Base imponible
      this.iva,       // IVA
      0               // Base 0% (sin productos exentos por ahora)
    ).subscribe({
      next: (respuesta: PagoResponse) => {
        
        if (respuesta.exitoso && respuesta.codigoRespuesta === '00') {
        } else {
        }
      },
      error: (error) => {
      }
    });
  }

  /**
   * MÉTODO PARA CANCELAR PAGO - LÓGICA FINAL CORREGIDA
   */
  cancelarPago(): void {
    
    this.pinpadService.reiniciarEstado();
    
    this.procesandoPago = false;
    this.ultimaTransaccion = undefined;
    this.estadoPago = { estado: 'esperando', mensaje: 'Listo para procesar pago' };
    
    this.tipoPago = 'tarjeta';
    
    // 🗑️ OBTENER PEDIDO CREADO Y CANCELARLO EN BACKEND
    const pedidoCreado = this.pedidoService.getPedidoCreado();
    
    if (pedidoCreado && pedidoCreado.numero) {
      
      this.pedidoService.cancelarPedidoBackend(pedidoCreado.numero).subscribe({
        next: () => {
          this.pedidoService.clearPedidoCreado();
          this.regresarAResumen();
        },
        error: (error) => {
          this.pedidoService.clearPedidoCreado();
          this.regresarAResumen();
        }
      });
    } else {
      this.regresarAResumen();
    }
  }

  /**
   * NUEVO: Método auxiliar para regresar al resumen
   */
  private regresarAResumen(): void {
    this.router.navigate(['/cliente/resumen-pedido']);
  }

  /**
   * MANEJAR CLICK DEL BOTÓN CONTINUAR - LÓGICA FINAL
   */
  continuar(): void {
    
    switch (this.tipoPago) {
      case 'tarjeta':
        this.manejarPagoTarjeta();
        break;

      case 'efectivo':
        this.cargarDatosParaImpresion();
        setTimeout(() => {
          this.imprimirFacturaAutomatica();
        }, 500);
        this.tipoPago = 'completado';
        break;

      case 'completado':
        this.confirmarPagoYFinalizar();
        break;
    }
  }

  /**
   * NUEVO: CONFIRMAR PAGO Y FINALIZAR COMPLETAMENTE
   */
  private confirmarPagoYFinalizar(): void {
    
    const pedidoCreado = this.pedidoService.getPedidoCreado();
    
    if (pedidoCreado && pedidoCreado.numero) {
      
      this.pedidoService.confirmarPagoBackend(pedidoCreado.numero).subscribe({
        next: () => {
          this.finalizarCompletamente();
        },
        error: (error) => {
          this.finalizarCompletamente();
        }
      });
    } else {
      this.finalizarCompletamente();
    }
  }

  /**
   * NUEVO: FINALIZAR COMPLETAMENTE Y LIMPIAR TODO
   */
  /*
  private finalizarCompletamente(): void {
    this.pedidoService.limpiarTodoCompletamente();
    
    this.pinpadService.reiniciarEstado();
    
    this.router.navigate(['/cliente/home']);
  }*/

  private finalizarCompletamente(): void {
    this.pedidoService.limpiarTodoCompletamente();
    this.pinpadService.reiniciarEstado();
    this.router.navigate(['/cliente/home']);
  }

  /**
   * COMPLETAR PAGO EXITOSO - CAMBIAR ESTADO E IMPRIMIR FACTURA
   */
  private completarPago(): void {
    
    // ❌ NO LIMPIAR CARRITO AQUÍ - Solo cambiar estado visual
    // El carrito se limpiará cuando el usuario presione "Finalizar pedido"
    
    this.tipoPago = 'completado';
    this.estadoPago = { estado: 'exitoso', mensaje: 'Pago completado exitosamente' };
    
    this.cargarDatosParaImpresion();
    
    setTimeout(() => {
      this.imprimirFacturaAutomatica();
    }, 500);
    
    setTimeout(() => {
      this.pinpadService.reiniciarEstado();
    }, 1000);
    
  }

  /**
   * MANEJAR LÓGICA DE PAGO CON TARJETA
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
        
      case 'procesando':
        break;
        
      default:
        this.pinpadService.reiniciarEstado();
        break;
    }
  }

  /**
   * ERROR 2 CORREGIDO: Métodos únicos y simplificados
   */
  private generarNumeroOrden(): string {
    return 'ORD-' + Date.now().toString().slice(-6);
  }

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




  /**
   * CARGAR DATOS DEL CARRITO PARA IMPRESIÓN
   */
  private cargarDatosParaImpresion(): void {
    // Obtener productos del carrito
    this.productosCarrito = this.pedidoService.obtenerProductosParaCarrito();
    
    // Cargar IVA actual
    this.catalogoService.getIvaActual().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ivaActual = response.data.porcentaje_iva;
        } else {
          this.ivaActual = 15.0;
        }
      },
      error: (error) => {
        this.ivaActual = 15.0;
      }
    });
  }

  /**
   * IMPRIMIR FACTURA AUTOMÁTICAMENTE TRAS PAGO EXITOSO
   */
  private imprimirFacturaAutomatica(): void {

    // Preparar datos de la factura
    const factura = {
      pedido_id: this.numeroOrden,
      cliente: this.datosFacturacion?.nombreCompleto || 'Consumidor Final',
      productos: this.productosCarrito.map(p => ({
        nombre: this.obtenerNombreProducto(p),
        cantidad: p.cantidad,
        precio: p.precio_unitario
      })),
      subtotal: this.subtotal,
      iva: this.iva,
      total: this.montoTotal
    };

    // Imprimir usando la nueva lógica sin ventanas
    this.imprimirFacturaFrontend(factura);
  }

  /**
   * OBTENER NOMBRE DEL PRODUCTO O MENÚ
   */
  private obtenerNombreProducto(item: any): string {
    if (item.tipo === 'menu') {
      return `Menú ${item.menu_id}`;
    } else {
      return `Producto ${item.producto_id}`;
    }
  }

  /**
   * MÉTODO PARA IMPRESIÓN COMPLETAMENTE INVISIBLE (SIN VENTANAS NI IFRAMES)
   */
  private imprimirFacturaFrontend(factura: any): void {

    try {
      this.imprimirContenidoDirecto(factura);
      
    } catch (error) {
      this.enviarFacturaABackend(factura);
    }
  }

  /**
   * IMPRIMIR MANIPULANDO EL DOM ACTUAL SIN VENTANAS
   */
  private imprimirContenidoDirecto(factura: any): void {
    const contenidoOriginal = document.body.innerHTML;
    const tituloOriginal = document.title;
    const style = document.createElement('style');
    
    try {
      const facturaHTML = this.generarHTMLFacturaDirecto(factura);
      
      style.innerHTML = this.obtenerEstilosImpresion();
      document.head.appendChild(style);
      
      document.title = `Factura - ${factura.pedido_id}`;
      document.body.innerHTML = facturaHTML;
      
      
      requestAnimationFrame(() => {
        window.print();
        
        setTimeout(() => {
          try {
            document.body.innerHTML = contenidoOriginal;
            document.title = tituloOriginal;
            
            if (style.parentNode) {
              document.head.removeChild(style);
            }
            
            
            this.reinicializarComponente();
            
            window.location.reload();
          } catch (restoreError) {}
        }, 50);
      });
      
    } catch (error) {
      document.body.innerHTML = contenidoOriginal;
      document.title = tituloOriginal;
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    }
  }

  /**
   * GENERAR HTML SIMPLIFICADO PARA IMPRESIÓN DIRECTA
   */
  private generarHTMLFacturaDirecto(factura: any): string {
    const fecha = new Date().toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="factura-container">
        <div class="header">
          <div class="logo">KIOSKO TOUCH</div>
          <div>RUC: 1791310199001</div>
          <div>Factura Simplificada</div>
        </div>
        
        <div class="info-section">
          <div class="info-row">
            <span>Fecha:</span>
            <span>${fecha}</span>
          </div>
          <div class="info-row">
            <span>Orden:</span>
            <span>${factura.pedido_id}</span>
          </div>
          <div class="info-row">
            <span>Cliente:</span>
            <span>${factura.cliente}</span>
          </div>
        </div>
        
        <div class="productos">
          <div class="productos-title">PRODUCTOS:</div>
          ${factura.productos.map((p: any) => `
            <div class="producto">
              <div class="producto-line">
                <span>${p.nombre}</span>
              </div>
              <div class="producto-line">
                <span>${p.cantidad} x $${p.precio.toFixed(2)}</span>
                <span>$${(p.cantidad * p.precio).toFixed(2)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="totales">
          <div class="info-row">
            <span>Subtotal:</span>
            <span>$${factura.subtotal.toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span>IVA (${this.ivaActual}%):</span>
            <span>$${factura.iva.toFixed(2)}</span>
          </div>
          <div class="info-row total-final">
            <span>TOTAL:</span>
            <span>$${factura.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div>¡Gracias por su compra!</div>
          <div>Kiosco de Autoservicio</div>
          <div>${fecha}</div>
        </div>
      </div>`;
  }

  /**
   * OBTENER ESTILOS CSS PARA IMPRESIÓN TÉRMICA
   */
  private obtenerEstilosImpresion(): string {
    return `
      @page {
        size: 80mm auto;
        margin: 2mm;
      }
      
      @media print {
        body {
          margin: 0;
          padding: 0;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.2;
          color: black;
          background: white;
          width: 80mm;
        }
        
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
      
      .factura-container {
        width: 80mm;
        margin: 0 auto;
        padding: 5mm;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.2;
      }
      
      .header {
        text-align: center;
        border-bottom: 1px dashed #000;
        padding-bottom: 5px;
        margin-bottom: 8px;
      }
      
      .logo {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 3px;
      }
      
      .info-row {
        display: flex;
        justify-content: space-between;
        margin: 2px 0;
      }
      
      .productos {
        border-top: 1px dashed #000;
        border-bottom: 1px dashed #000;
        padding: 5px 0;
        margin: 8px 0;
      }
      
      .productos-title {
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .producto {
        margin: 3px 0;
      }
      
      .producto-line {
        display: flex;
        justify-content: space-between;
      }
      
      .totales {
        text-align: right;
        margin-top: 8px;
      }
      
      .total-final {
        font-weight: bold;
        font-size: 13px;
        border-top: 1px solid #000;
        padding-top: 3px;
        margin-top: 3px;
      }
      
      .footer {
        text-align: center;
        font-size: 10px;
        margin-top: 10px;
        border-top: 1px dashed #000;
        padding-top: 5px;
      }
    `;
  }

  /**
   * REINICIALIZAR COMPONENTE DESPUÉS DE RESTAURAR CONTENIDO
   */
  private reinicializarComponente(): void {
    try {
    } catch (error) {
    }
  }

  /**
   * MÉTODO FALLBACK PARA ENVÍO A BACKEND
   */
  private enviarFacturaABackend(factura: any): void {
    
    const datosImpresion = {
      establecimiento: 'KIOSKO TOUCH',
      ruc: '1791310199001',
      tipo_documento: 'Factura Simplificada',
      pedido_id: factura.pedido_id,
      cliente: factura.cliente,
      fecha: new Date().toLocaleString('es-EC'),
      productos: factura.productos,
      subtotal: factura.subtotal,
      iva_porcentaje: this.ivaActual,
      iva_valor: factura.iva,
      total: factura.total
    };

  }

}
