import { Component, OnInit, OnDestroy, Renderer2, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';
import { PinpadService, EstadoPago, PagoResponse } from '../../services/pinpad.service';
import { Subscription } from 'rxjs';
import { PedidoService } from '../../services/pedido.service';
import { CatalogoService } from '../../services/catalogo.service';
import { FacturaPagoComponent } from './factura/factura-pago.component';
import { ViewChild } from '@angular/core';
// ✅ NUEVA INTERFAZ PARA CONFIGURACIÓN EMPRESARIAL
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
}

@Component({
  selector: 'app-instruccion-pago',
  standalone: true,
  imports: [
    CommonModule,
    PublicidadSectionComponent,
    FacturaPagoComponent,
    
  ],
  templateUrl: './instruccion-pago.component.html',
  styleUrls: ['./instruccion-pago.component.scss']
})
export class InstruccionPagoComponent implements OnInit, OnDestroy {
  @ViewChild(FacturaPagoComponent) facturaComponent?: FacturaPagoComponent;
  private facturaYaImpresa: boolean = false;

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

  
  // ✅ NUEVA: Configuración empresarial con valores por defecto
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pinpadService: PinpadService,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    
    this.pinpadService.reiniciarEstado();
    
    // ✅ CARGAR CONFIGURACIÓN EMPRESARIAL AL INICIO    
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
    
    switch (this.tipoPago) {
      case 'tarjeta':
        this.manejarPagoTarjeta();
        break;

      case 'efectivo':
        this.cargarDatosParaImpresion();
        this.tipoPago = 'completado';
        break;

      case 'completado':
        this.confirmarPagoYFinalizar();
        break;
    }
  }

  /**
   * ✅ ACTUALIZADO: CONFIRMAR PAGO Y FINALIZAR CON DESCUENTO DE STOCK
   */
  private confirmarPagoYFinalizar(): void {
    console.log('💳 Iniciando confirmación de pago con descuento automático de stock...');
    
    const pedidoCreado = this.pedidoService.getPedidoCreado();
    
    if (pedidoCreado && pedidoCreado.numero) {
      // ✅ DETERMINAR MÉTODO DE PAGO
      const metodoPago = this.tipoPago === 'tarjeta' ? 'tarjeta' : 'efectivo';
      
      console.log('📋 Confirmando pago:', {
        pedido: pedidoCreado.numero,
        metodo: metodoPago
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
            
            this.finalizarCompletamente();
          },
          error: (error) => {
            console.error('❌ Error al confirmar pago:', error);
            
            // Mostrar mensaje de error si es necesario
            if (error.error?.mensaje) {
              console.warn('⚠️ Mensaje del servidor:', error.error.mensaje);
            }
            
            // ✅ FINALIZAR DE TODAS FORMAS PARA NO BLOQUEAR AL USUARIO
            // (El pedido ya se creó, solo falló el descuento de stock)
            this.finalizarCompletamente();
          }
        });
    } else {
      console.warn('⚠️ No se encontró pedido creado para confirmar');
      this.finalizarCompletamente();
    }
  }

  /**
   * NUEVO: FINALIZAR COMPLETAMENTE Y LIMPIAR TODO
   */
  private finalizarCompletamente(): void {
    this.facturaYaImpresa = false;
    this.pedidoService.limpiarTodoCompletamente();
    this.pinpadService.reiniciarEstado();
    this.router.navigate(['/cliente/home']);
  }

  /**
   * COMPLETAR PAGO EXITOSO - CAMBIAR ESTADO E IMPRIMIR FACTURA
   */
  private completarPago(): void {
    
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

  /**
   * ✅ ACTUALIZADO: CARGAR DATOS DEL CARRITO PARA IMPRESIÓN CON DEBUG
   */
  private cargarDatosParaImpresion(): void {
    console.log('📋 Iniciando carga de datos para impresión...');
    
    this.productosCarrito = this.pedidoService.obtenerProductosParaCarrito();
    console.log('🛒 Productos del carrito completos:', this.productosCarrito);
    
    // ✅ CREAR ARRAY DE PROMESAS PARA OBTENER NOMBRES REALES
    const promesasNombres = this.productosCarrito.map(async (p, index) => {
      console.log(`📦 Procesando producto ${index + 1}:`, p);
      
      try {
        let nombreProducto = p.nombre || `Producto ${p.producto_id}`;
        
        // ✅ SI ES PRODUCTO, CONSULTAR NOMBRE REAL
        if (p.tipo === 'producto' && p.producto_id) {
          const producto = await this.catalogoService.obtenerProductoPorId(p.producto_id).toPromise();
          if (producto && producto.nombre) {
            nombreProducto = producto.nombre;
            console.log(`✅ Nombre real obtenido: "${nombreProducto}"`);
          }
        }
        
        // ✅ SI ES MENÚ, CONSULTAR NOMBRE REAL
        if (p.tipo === 'menu' && p.menu_id) {
          const menu = await this.catalogoService.obtenerMenuPorId(p.menu_id).toPromise();
          if (menu && menu.nombre) {
            nombreProducto = menu.nombre;
            console.log(`✅ Nombre de menú obtenido: "${nombreProducto}"`);
          }
        }
        
        return {
          nombre: nombreProducto,
          cantidad: p.cantidad,
          precio: p.precio_unitario
        };
        
      } catch (error) {
        console.warn(`⚠️ Error al obtener nombre del producto ${p.producto_id}:`, error);
        return {
          nombre: p.nombre || `Producto ${p.producto_id}`,
          cantidad: p.cantidad,
          precio: p.precio_unitario
        };
      }
    });
    
    // ✅ ESPERAR A QUE TODAS LAS CONSULTAS TERMINEN
    Promise.all(promesasNombres).then(productosConNombres => {
      this.datosFactura = {
        pedido_id: this.numeroOrden,
        cliente: this.datosFacturacion?.nombreCompleto || 'Consumidor Final',
        productos: productosConNombres,
        subtotal: this.subtotal,
        iva: this.iva,
        total: this.montoTotal,
        turno: this.numeroTurno
      };
      
      this.mostrarFactura = true;
      console.log('📋 Datos de factura preparados con nombres reales:', this.datosFactura);
      
      // ✅ IMPRIMIR AUTOMÁTICAMENTE DESPUÉS DE CARGAR DATOS
      this.imprimirFacturaAutomatica();
      
    }).catch(error => {
      console.error('❌ Error al procesar nombres de productos:', error);
      
      // ✅ FALLBACK: USAR DATOS ORIGINALES
      this.datosFactura = {
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
      
      this.mostrarFactura = true;
      
      // ✅ IMPRIMIR INCLUSO CON DATOS FALLBACK
      this.imprimirFacturaAutomatica();
    });
  }


  /**
   * ✅ MÉTODO SIMPLIFICADO PARA IMPRESIÓN AUTOMÁTICA
  */ 
  private imprimirFacturaAutomatica(): void {
    if (this.facturaYaImpresa) {
      return;
    }
    
    if (!this.datosFactura) {
      return;
    }
    
    this.facturaYaImpresa = true;
    // ✅ ESPERAR A QUE EL COMPONENTE ESTÉ LISTO Y LUEGO IMPRIMIR
    setTimeout(() => {
      if (this.facturaComponent) {
        console.log('✅ Componente de factura encontrado, iniciando impresión...');
        this.facturaComponent.imprimirFactura();
      } else {
        console.warn('⚠️ Componente de factura no disponible, usando método directo...');
        this.imprimirFacturaDirecta();
      }
    }, 800); // Aumentar tiempo para asegurar que el componente esté listo
  }

  /**
   * ✅ MÉTODO DIRECTO COMO FALLBACK
   */
  private imprimirFacturaDirecta(): void {
    console.log('🖨️ Imprimiendo factura directamente...');
    
    // Crear una instancia temporal del componente para imprimir
    const tempComponent = new FacturaPagoComponent();
    tempComponent.datosFactura = this.datosFactura!;
    tempComponent.autoImprimir = true;
    tempComponent.ngOnInit();
    
    setTimeout(() => {
      tempComponent.imprimirFactura();
    }, 500);
  }

  /**
   * ✅ OBTENER NOMBRE DEL PRODUCTO O MENÚ CON DEBUG
   */
  private obtenerNombreProducto(item: any): string {
    // ✅ AGREGAR CONSOLE.LOG AQUÍ PARA VER LOS CAMPOS
    console.log('🔍 DEBUG - Item completo:', item);
    console.log('🔍 DEBUG - Campos del item:', Object.keys(item));
    console.log('🔍 DEBUG - Tipo:', item.tipo);
    console.log('🔍 DEBUG - Producto ID:', item.producto_id);
    console.log('🔍 DEBUG - Menu ID:', item.menu_id);
    console.log('🔍 DEBUG - Nombre directo:', item.nombre);
    console.log('🔍 DEBUG - Producto info:', item.producto_info);
    console.log('🔍 DEBUG - Menu info:', item.menu_info);
    
    // ✅ LÓGICA MEJORADA PARA OBTENER EL NOMBRE
    if (item.nombre) {
      console.log('✅ Usando nombre directo:', item.nombre);
      return item.nombre;
    }
    
    if (item.tipo === 'menu') {
      if (item.menu_info?.nombre) {
        console.log('✅ Usando nombre de menu_info:', item.menu_info.nombre);
        return item.menu_info.nombre;
      }
      console.log('⚠️ Menu sin nombre, usando fallback');
      return `Menú ${item.menu_id}`;
    } else {
      if (item.producto_info?.nombre) {
        console.log('✅ Usando nombre de producto_info:', item.producto_info.nombre);
        return item.producto_info.nombre;
      }
      console.log('⚠️ Producto sin nombre, usando fallback');
      return `Producto ${item.producto_id}`;
    }
  }
}
