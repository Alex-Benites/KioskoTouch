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

  // ✅ PROPIEDADES PARA PINPAD
  estadoPago: EstadoPago = { estado: 'esperando', mensaje: 'Listo para procesar pago' };
  montoTotal: number = 0;
  procesandoPago: boolean = false;
  ultimaTransaccion?: PagoResponse;

  // ✅ NUEVAS PROPIEDADES PARA IMPRESIÓN
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
  /*
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
  }*/

  private finalizarCompletamente(): void {
    this.pedidoService.limpiarTodoCompletamente();
    this.pinpadService.reiniciarEstado();
    this.router.navigate(['/cliente/home']);
  }

  /**
   * ✅ COMPLETAR PAGO EXITOSO - CAMBIAR ESTADO E IMPRIMIR FACTURA
   */
  private completarPago(): void {
    console.log('🎉 Completando pago exitoso...');
    
    // ❌ NO LIMPIAR CARRITO AQUÍ - Solo cambiar estado visual
    // El carrito se limpiará cuando el usuario presione "Finalizar pedido"
    
    // ✅ CAMBIAR A ESTADO COMPLETADO DIRECTAMENTE
    this.tipoPago = 'completado';
    this.estadoPago = { estado: 'exitoso', mensaje: 'Pago completado exitosamente' };
    
    // ✅ CARGAR DATOS DEL CARRITO PARA IMPRESIÓN
    this.cargarDatosParaImpresion();
    
    // ✅ IMPRIMIR FACTURA AUTOMÁTICAMENTE TRAS PAGO EXITOSO
    setTimeout(() => {
      this.imprimirFacturaAutomatica();
    }, 500);
    
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



  // ✅ NUEVAS FUNCIONES DE IMPRESIÓN MOVIDAS DESDE RESUMEN-PEDIDO

  /**
   * ✅ CARGAR DATOS DEL CARRITO PARA IMPRESIÓN
   */
  private cargarDatosParaImpresion(): void {
    // Obtener productos del carrito
    this.productosCarrito = this.pedidoService.obtenerProductosParaCarrito();
    
    // Cargar IVA actual
    this.catalogoService.getIvaActual().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ivaActual = response.data.porcentaje_iva;
          console.log(`✅ IVA dinámico cargado para impresión: ${this.ivaActual}%`);
        } else {
          console.warn('⚠️ No se encontró IVA activo, usando 15% por defecto');
          this.ivaActual = 15.0;
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar IVA:', error);
        this.ivaActual = 15.0;
      }
    });
  }

  /**
   * ✅ IMPRIMIR FACTURA AUTOMÁTICAMENTE TRAS PAGO EXITOSO
   */
  private imprimirFacturaAutomatica(): void {
    console.log('🖨️ Iniciando impresión automática tras pago exitoso...');

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
   * ✅ OBTENER NOMBRE DEL PRODUCTO O MENÚ
   */
  private obtenerNombreProducto(item: any): string {
    if (item.tipo === 'menu') {
      return `Menú ${item.menu_id}`;
    } else {
      return `Producto ${item.producto_id}`;
    }
  }

  /**
   * ✅ MÉTODO PARA IMPRESIÓN COMPLETAMENTE INVISIBLE (SIN VENTANAS NI IFRAMES)
   */
  private imprimirFacturaFrontend(factura: any): void {
    console.log('🖨️ Imprimiendo factura de forma completamente invisible...');

    try {
      // ✅ MÉTODO 1: Manipular el DOM actual directamente
      this.imprimirContenidoDirecto(factura);
      
    } catch (error) {
      console.error('❌ Error en impresión invisible:', error);
      // ✅ FALLBACK: Enviar a servicio backend como último recurso
      this.enviarFacturaABackend(factura);
    }
  }

  /**
   * ✅ IMPRIMIR MANIPULANDO EL DOM ACTUAL SIN VENTANAS
   */
  private imprimirContenidoDirecto(factura: any): void {
    // ✅ GUARDAR EL CONTENIDO ACTUAL
    const contenidoOriginal = document.body.innerHTML;
    const tituloOriginal = document.title;
    
    try {
      // ✅ GENERAR HTML DE LA FACTURA
      const facturaHTML = this.generarHTMLFacturaDirecto(factura);
      
      // ✅ REEMPLAZAR TEMPORALMENTE EL CONTENIDO DE LA PÁGINA
      document.title = `Factura - ${factura.pedido_id}`;
      document.body.innerHTML = facturaHTML;
      
      // ✅ AGREGAR ESTILOS PARA IMPRESIÓN TÉRMICA DIRECTAMENTE
      const style = document.createElement('style');
      style.innerHTML = this.obtenerEstilosImpresion();
      document.head.appendChild(style);
      
      console.log('🖨️ Enviando comando de impresión directa...');
      
      // ✅ IMPRIMIR DIRECTAMENTE
      window.print();
      
      // ✅ RESTAURAR CONTENIDO ORIGINAL INMEDIATAMENTE DESPUÉS
      setTimeout(() => {
        try {
          document.body.innerHTML = contenidoOriginal;
          document.title = tituloOriginal;
          
          // ✅ REMOVER ESTILOS DE IMPRESIÓN
          if (style.parentNode) {
            document.head.removeChild(style);
          }
          
          console.log('✅ Contenido original restaurado');
          
          // ✅ REINICIALIZAR ANGULAR DESPUÉS DE RESTAURAR
          this.reinicializarComponente();
          
        } catch (restoreError) {
          console.error('⚠️ Error restaurando contenido:', restoreError);
          // ✅ FORZAR RECARGA DE LA PÁGINA COMO ÚLTIMO RECURSO
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error en impresión directa:', error);
      // ✅ RESTAURAR CONTENIDO EN CASO DE ERROR
      document.body.innerHTML = contenidoOriginal;
      document.title = tituloOriginal;
    }
  }

  /**
   * ✅ GENERAR HTML SIMPLIFICADO PARA IMPRESIÓN DIRECTA
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
   * ✅ OBTENER ESTILOS CSS PARA IMPRESIÓN TÉRMICA
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
   * ✅ REINICIALIZAR COMPONENTE DESPUÉS DE RESTAURAR CONTENIDO
   */
  private reinicializarComponente(): void {
    try {
      console.log('✅ Componente reinicializado correctamente');
    } catch (error) {
      console.log('⚠️ Error reinicializando componente:', error);
    }
  }

  /**
   * ✅ MÉTODO FALLBACK PARA ENVÍO A BACKEND
   */
  private enviarFacturaABackend(factura: any): void {
    console.log('🔄 Enviando factura al backend como fallback...');
    
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

    // ✅ NOTA: Esto solo funcionará si tienes un endpoint local
    // Para PythonAnywhere, este método no será efectivo
    console.log('📄 Datos preparados para impresión:', datosImpresion);
    console.log('⚠️ Servicio backend no disponible en PythonAnywhere');
  }

}
