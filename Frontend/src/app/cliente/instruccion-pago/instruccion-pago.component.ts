import { Component, OnInit, OnDestroy, Renderer2, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';
import { PinpadService, EstadoPago, PagoResponse } from '../../services/pinpad.service';
import { Subscription } from 'rxjs';
import { PedidoService } from '../../services/pedido.service';
import { CatalogoService } from '../../services/catalogo.service';


// ✅ INTERFAZ EXISTENTE
interface ConfiguracionEmpresarial {
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion: string;
  ciudad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  porcentaje_iva: number;
  eslogan?: string;
  moneda?: string;
}

@Component({
  selector: 'app-instruccion-pago',
  standalone: true,
  imports: [
    CommonModule,
    PublicidadSectionComponent,
  ],
  templateUrl: './instruccion-pago.component.html',
  styleUrls: ['./instruccion-pago.component.scss']
})
export class InstruccionPagoComponent implements OnInit, OnDestroy {
  
  private facturaYaImpresa: boolean = false;
  private metodoPagoOriginal: 'tarjeta' | 'efectivo' = 'tarjeta';
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

  datosFactura?: any;
  mostrarFactura: boolean = false;

  // ✅ ACTUALIZADO: Ahora se carga dinámicamente
  configuracionEmpresa: ConfiguracionEmpresarial = {
    ruc: '1791310199001',
    razon_social: 'KIOSKO TOUCH',
    nombre_comercial: 'Kiosko de Autoservicio',
    direccion: 'Dirección no configurada',
    ciudad: 'Ciudad no configurada',
    telefono: '',
    email: '',
    porcentaje_iva: 15.0
  };
  
  ivaActual: number = 15.0;
  productosCarrito: any[] = [];

  private estadoPagoSubscription?: Subscription;
  // ✅ NUEVA SUSCRIPCIÓN PARA CONFIGURACIÓN
  private configuracionSubscription?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pinpadService: PinpadService,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Iniciando componente instruccion-pago...');
    
    this.pinpadService.reiniciarEstado();
    
    // ✅ CARGAR CONFIGURACIÓN EMPRESARIAL AL INICIO
    this.cargarConfiguracionEmpresarial();
    
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
          console.warn('⚠️ Error parseando datos de facturación:', e);
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
    
    setTimeout(() => {
      console.log('🔍 DEBUG - Estado actual:', {
        tipoPago: this.tipoPago,
        mostrarFactura: this.mostrarFactura,
        facturaYaImpresa: this.facturaYaImpresa,
        configuracionCargada: !!this.configuracionEmpresa
      });
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.estadoPagoSubscription) {
      this.estadoPagoSubscription.unsubscribe();
    }
    // ✅ LIMPIAR SUSCRIPCIÓN DE CONFIGURACIÓN
    if (this.configuracionSubscription) {
      this.configuracionSubscription.unsubscribe();
    }
  }

  // ✅ NUEVO MÉTODO: CARGAR CONFIGURACIÓN EMPRESARIAL DINÁMICAMENTE
  private cargarConfiguracionEmpresarial(): void {
    console.log('🏢 Cargando configuración empresarial desde backend...');
    
    this.configuracionSubscription = this.catalogoService.obtenerDatosParaFactura().subscribe({
      next: (response) => {
        if (response.success && response.configuracion) {
          this.configuracionEmpresa = {
            ruc: response.configuracion.ruc || '1791310199001',
            razon_social: response.configuracion.razon_social || 'KIOSKO TOUCH',
            nombre_comercial: response.configuracion.nombre_comercial || 'Kiosko de Autoservicio',
            direccion: response.configuracion.direccion || 'Dirección no configurada',
            ciudad: response.configuracion.ciudad || 'Ciudad no configurada',
            provincia: response.configuracion.provincia || '',
            telefono: response.configuracion.telefono || '',
            email: response.configuracion.email || '',
            porcentaje_iva: response.configuracion.porcentaje_iva || 15.0,
            eslogan: response.configuracion.eslogan || 'Autoservicio Digital',
            moneda: response.configuracion.moneda || 'USD'
          };
          
          this.ivaActual = this.configuracionEmpresa.porcentaje_iva;
          
          console.log('✅ Configuración empresarial cargada:', {
            empresa: this.configuracionEmpresa.razon_social,
            ruc: this.configuracionEmpresa.ruc,
            iva: this.configuracionEmpresa.porcentaje_iva,
            esDefault: response.esConfiguracionPorDefecto || false
          });
        }
      },
      error: (error) => {
        console.error('❌ Error cargando configuración empresarial:', error);
        console.log('⚠️ Usando configuración por defecto');
      }
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
    this.facturaYaImpresa = false;
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
    console.log(`🔄 Procesando continuar para tipo: ${this.tipoPago}`);
    
    switch (this.tipoPago) {
      case 'tarjeta':
        this.manejarPagoTarjeta();
        break;

      case 'efectivo':
        console.log('💰 Procesando pago en efectivo...');
        this.metodoPagoOriginal = 'efectivo';
        this.cargarDatosParaImpresion();
        this.tipoPago = 'completado';
        console.log('✅ Estado cambiado a completado. tipoPago:', this.tipoPago);
        break;

      case 'completado':
        console.log('🏠 Caso completado - confirmando pago y descontando stock...');
        this.confirmarPagoYFinalizar(); // ✅ CAMBIO: Llamar a confirmarPagoYFinalizar en lugar de finalizarCompletamente
        break;
    }
  }

  /**
   * ✅ NUEVO MÉTODO: Para el botón "Finalizar Pedido" que confirma pago y descuenta stock
   */
  finalizarPedido(): void {
    console.log('🏠 BOTÓN FINALIZAR PEDIDO PRESIONADO');
    console.log('📋 Estado actual:', {
      tipoPago: this.tipoPago,
      metodoPagoOriginal: this.metodoPagoOriginal
    });
    
    // ✅ CONFIRMAR PAGO Y DESCONTAR STOCK ANTES DE FINALIZAR
    this.confirmarPagoYFinalizar();
  }

  /**
   * NUEVO: FINALIZAR COMPLETAMENTE Y LIMPIAR TODO
   */
  private finalizarCompletamente(): void {
    console.log('🔄 Finalizando completamente...');
    
    this.facturaYaImpresa = false;
    this.pedidoService.limpiarTodoCompletamente();
    this.pinpadService.reiniciarEstado();
    
    console.log('🏠 Navegando a cliente/home...');
    this.router.navigate(['/cliente/home']).then(
      (success) => {
        console.log('✅ Navegación exitosa:', success);
      },
      (error) => {
        console.error('❌ Error en navegación:', error);
        // ✅ FALLBACK: RECARGAR LA PÁGINA
        window.location.href = '/cliente/home';
      }
    );
  }

  /**
   * COMPLETAR PAGO EXITOSO - CAMBIAR ESTADO E IMPRIMIR FACTURA
   */
  private completarPago(): void {
    // ✅ GUARDAR EL MÉTODO AQUÍ TAMBIÉN
    this.metodoPagoOriginal = 'tarjeta';
    
    this.tipoPago = 'completado';
    this.estadoPago = { estado: 'exitoso', mensaje: 'Pago completado exitosamente' };
    
    this.cargarDatosParaImpresion();
    
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



irAlInicio(): void {
  console.log('🏠 BOTÓN IR AL INICIO PRESIONADO - INICIO DEL MÉTODO');
  
  try {
    console.log('🧹 Limpiando pedido service...');
    this.pedidoService.limpiarTodoCompletamente();
    
    console.log('🔄 Reiniciando pinpad service...');
    this.pinpadService.reiniciarEstado();
    
    console.log('🚀 Iniciando navegación a /cliente/home...');
    
    // ✅ NAVEGACIÓN DIRECTA
    this.router.navigate(['/cliente/home']).then(
      (success) => {
        console.log('✅ NAVEGACIÓN EXITOSA:', success);
      },
      (error) => {
        console.error('❌ ERROR EN NAVEGACIÓN:', error);
        // ✅ FALLBACK: RECARGAR PÁGINA
        console.log('🔄 Usando fallback - recargando página...');
        window.location.href = '/cliente/home';
      }
    );
  } catch (error) {
    console.error('❌ ERROR EN irAlInicio:', error);
    // ✅ FALLBACK TOTAL
    window.location.href = '/cliente/home';
  }
}


/**
 * ✅ REEMPLAZAR: CONFIRMAR PAGO Y FINALIZAR CON IMPRESIÓN SIMPLE
 */
private confirmarPagoYFinalizar(): void {
  const pedidoCreado = this.pedidoService.getPedidoCreado();
  
  if (pedidoCreado && pedidoCreado.numero) {
    const metodoPago = this.metodoPagoOriginal;
    
    console.log('📋 Confirmando pago:', {
      pedido: pedidoCreado.numero,
      metodo: metodoPago,
      tipoPagoActual: this.tipoPago
    });
    
    // ✅ USAR EL NUEVO MÉTODO QUE DESCUENTA STOCK AUTOMÁTICAMENTE
    this.pedidoService.confirmarPagoConStock(pedidoCreado.numero, metodoPago)
      .subscribe({
        next: (response) => {
          console.log('✅ Pago confirmado exitosamente:', response);
          
          // ✅ MOSTRAR INFORMACIÓN DEL STOCK ACTUALIZADO
          if (response.stock_actualizado && response.stock_actualizado.length > 0) {
            console.log('📊 Ingredientes con stock actualizado:');
            response.stock_actualizado.forEach((item: any) => {
              console.log(`  - ${item.ingrediente}: ${item.stock_anterior} → ${item.stock_actual} ${item.unidad} (-${item.cantidad_descontada})`);
            });
          }
          
          // ✅ IMPRIMIR FACTURA CON DOM PROPIO
          this.imprimirFacturaVentanaSimple();
          
          // ✅ FINALIZAR DESPUÉS DE UN PEQUEÑO DELAY
          setTimeout(() => {
            this.finalizarCompletamente();
          }, 1000);
        },
        error: (error) => {
          console.error('❌ Error al confirmar pago:', error);
          
          if (error.error?.mensaje) {
            console.warn('⚠️ Mensaje del servidor:', error.error.mensaje);
          }
          
          // ✅ FINALIZAR DE TODAS FORMAS
          this.finalizarCompletamente();
        }
      });
  } else {
    console.warn('⚠️ No se encontró pedido creado para confirmar');
    this.finalizarCompletamente();
  }
}


private imprimirFacturaVentanaSimple(): void {
  try {
    console.log('🖨️ Iniciando impresión silenciosa con componente factura...');
    
    const datosFactura = {
      pedido_id: this.numeroOrden,
      cliente: this.datosFacturacion?.nombreCompleto || 'Consumidor Final',
      productos: this.productosCarrito.map(p => ({
        nombre: p.nombre || `Producto ${p.producto_id}`,
        cantidad: p.cantidad,
        precio: p.precio_unitario
      })),
      subtotal: this.subtotal,
      iva: this.iva,
      total: this.montoTotal,
      turno: this.numeroTurno
    };


    // Crear instancia temporal del componente de factura
    const facturaComponentTemp = {
      datosFactura: datosFactura,
      configuracionEmpresa: this.configuracionEmpresa,
      fechaActual: new Date().toLocaleString('es-EC', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      
      imprimirSilencioso: () => {
        const contenidoOriginal = document.body.innerHTML;
        const tituloOriginal = document.title;
        const estilosOriginales = Array.from(document.head.querySelectorAll('style')).map(s => s.outerHTML);
        
        try {
          const facturaHTML = this.generarHTMLFacturaSencillo(datosFactura);
          const estilosImpresion = this.generarEstilosFactura();
          
          const elementoImpresion = document.createElement('div');
          elementoImpresion.innerHTML = facturaHTML;
          elementoImpresion.style.display = 'none';
          elementoImpresion.style.position = 'absolute';
          elementoImpresion.style.top = '-9999px';
          elementoImpresion.style.left = '-9999px';
          elementoImpresion.className = 'factura-temp-impresion';
          document.body.appendChild(elementoImpresion);
          
          const styleElement = document.createElement('style');
          styleElement.innerHTML = estilosImpresion + `
            @media screen {
              .factura-temp-impresion {
                display: none !important;
                visibility: hidden !important;
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
              }
            }
            @media print {
              body * {
                visibility: hidden !important;
              }
              .factura-temp-impresion, .factura-temp-impresion * {
                visibility: visible !important;
                display: block !important;
                position: static !important;
              }
              .factura-temp-impresion {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
              }
            }
          `;
          document.head.appendChild(styleElement);
          
          document.title = `Factura - ${datosFactura.pedido_id}`;
          
          setTimeout(() => {
            window.print();
            
            setTimeout(() => {
              if (elementoImpresion.parentNode) {
                document.body.removeChild(elementoImpresion);
              }
              if (styleElement.parentNode) {
                document.head.removeChild(styleElement);
              }
              document.title = tituloOriginal;
              
              console.log('✅ Factura impresa silenciosamente sin mostrar contenido en pantalla');
            }, 500);
          }, 100);
          
        } catch (error) {
          console.error('❌ Error en impresión:', error);
          document.body.innerHTML = contenidoOriginal;
          document.title = tituloOriginal;
        }
      }
    };

    facturaComponentTemp.imprimirSilencioso();
    
  } catch (error) {
    console.error('❌ Error en impresión silenciosa:', error);
  }
}


private generarHTMLFacturaSencillo(factura: any): string {
  const config = this.configuracionEmpresa;
  const fecha = new Date().toLocaleString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <div class="factura-impresion">
      <div class="header">
        <div class="logo">${config.nombre_comercial || config.razon_social}</div>
        <div class="ruc">RUC: ${config.ruc}</div>
        <div class="tipo">Factura Simplificada</div>
        ${config.direccion ? `<div class="direccion">${config.direccion}</div>` : ''}
        ${config.telefono ? `<div class="telefono">Tel: ${config.telefono}</div>` : ''}
      </div>
      
      <div class="info">
        <div><span>Fecha:</span> <span>${fecha}</span></div>
        <div><span>Orden:</span> <span>${factura.pedido_id}</span></div>
        <div><span>Cliente:</span> <span>${factura.cliente}</span></div>
        ${factura.turno ? `<div><span>Turno:</span> <span>${factura.turno}</span></div>` : ''}
      </div>
      
      <div class="productos">
        <div class="titulo">PRODUCTOS:</div>
        ${factura.productos.map((p: any) => `
          <div class="producto">
            <div>${p.nombre}</div>
            <div>${p.cantidad} x $${p.precio.toFixed(2)} = $${(p.cantidad * p.precio).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="totales">
        <div>Subtotal: $${factura.subtotal.toFixed(2)}</div>
        <div>IVA (${config.porcentaje_iva}%): $${factura.iva.toFixed(2)}</div>
        <div class="total"><strong>TOTAL: $${factura.total.toFixed(2)}</strong></div>
      </div>
      
      <div class="footer">
        <div>¡Gracias por su compra!</div>
        <div>${config.nombre_comercial || config.razon_social}</div>
      </div>
    </div>
  `;
}


private generarEstilosFactura(): string {
  return `
    @page {
      size: 80mm auto;
      margin: 2mm;
    }
    
    @media print {
      .factura-impresion {
        width: 80mm;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.2;
        color: black;
        background: white;
      }
      
      .header {
        text-align: center;
        border-bottom: 1px dashed #000;
        padding-bottom: 5px;
        margin-bottom: 8px;
      }
      
      .logo {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 2px;
      }
      
      .info > div {
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
      
      .titulo {
        font-weight: bold;
        margin-bottom: 3px;
      }
      
      .producto {
        margin: 3px 0;
      }
      
      .totales {
        text-align: right;
        margin-top: 8px;
      }
      
      .totales > div {
        margin: 2px 0;
      }
      
      .total {
        border-top: 1px solid #000;
        padding-top: 3px;
        margin-top: 3px;
      }
      
      .footer {
        text-align: center;
        font-size: 10px;
        margin-top: 8px;
        border-top: 1px dashed #000;
        padding-top: 5px;
      }
    }
  `;
}


private cargarDatosParaImpresion(): void {
  console.log('📋 Iniciando carga de datos para impresión...');
  
  this.productosCarrito = this.pedidoService.obtenerProductosParaCarrito();
  console.log('🛒 Productos del carrito completos:', this.productosCarrito);

}

}
