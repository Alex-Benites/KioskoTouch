import { Component, Input, OnInit, Renderer2, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoService } from '../../../services/catalogo.service';

// ✅ INTERFAZ PARA CONFIGURACIÓN EMPRESARIAL
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

// ✅ INTERFAZ PARA DATOS DE FACTURA
interface DatosFactura {
  pedido_id: string;
  cliente: string;
  productos: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
  subtotal: number;
  iva: number;
  total: number;
  turno?: string;
}

@Component({
  selector: 'app-factura-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-pago.component.html',
  styleUrls: ['./factura-pago.component.scss']
})
export class FacturaPagoComponent implements OnInit {

  @Input() datosFactura!: DatosFactura;
  @Input() autoImprimir: boolean = false;
  private yaImpreso: boolean = false;

  private renderer = inject(Renderer2);
  private catalogoService = inject(CatalogoService);

  // ✅ AGREGAR PROPIEDADES PARA FECHAS Y MÉTODOS
  fechaActual: string = '';
  fechaHora: string = '';

  // ✅ CONFIGURACIÓN EMPRESARIAL CON VALORES POR DEFECTO
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

  ngOnInit(): void {
    console.log('🧾 Inicializando componente de factura...');
    
    // ✅ GENERAR FECHAS AL INICIALIZAR
    this.generarFechas();
    
    this.cargarConfiguracionEmpresarial();
    

  }

  /**
   * ✅ MÉTODO PARA GENERAR FECHAS
   */
  private generarFechas(): void {
    const ahora = new Date();
    this.fechaActual = ahora.toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    this.fechaHora = ahora.toLocaleString('es-EC');
  }

  /**
   * ✅ MÉTODO PARA OBTENER DIRECCIÓN COMPLETA
   */
  obtenerDireccionCompleta(): string {
    const partes = [];
    
    if (this.configuracionEmpresa.direccion) {
      partes.push(this.configuracionEmpresa.direccion);
    }
    
    if (this.configuracionEmpresa.ciudad) {
      partes.push(this.configuracionEmpresa.ciudad);
    }
    
    if (this.configuracionEmpresa.provincia && this.configuracionEmpresa.provincia !== this.configuracionEmpresa.ciudad) {
      partes.push(this.configuracionEmpresa.provincia);
    }
    
    return partes.join(', ');
  }

  /**
   * ✅ MÉTODO PARA CALCULAR SUBTOTAL DE PRODUCTO
   */
  calcularSubtotalProducto(cantidad: number, precio: number): number {
    return cantidad * precio;
  }

  /**
   * ✅ CARGAR CONFIGURACIÓN EMPRESARIAL
   */
  private cargarConfiguracionEmpresarial(): void {
    console.log('🏢 Cargando configuración empresarial para factura...');
    
    this.catalogoService.obtenerDatosParaFactura().subscribe({
      next: (response) => {
        console.log('✅ Configuración empresarial recibida:', response);
        
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
            porcentaje_iva: response.configuracion.porcentaje_iva || 15.0
          };
          
          console.log('✅ Configuración empresarial aplicada:', this.configuracionEmpresa);
          
          // ✅ SI AUTO-IMPRIMIR ESTÁ ACTIVADO, IMPRIMIR DESPUÉS DE CARGAR CONFIG
          if (this.autoImprimir && !this.yaImpreso) {
            setTimeout(() => this.imprimirFactura(), 500);
          }
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar configuración empresarial:', error);
        console.log('🔄 Usando configuración por defecto');
        
        // ✅ SI AUTO-IMPRIMIR ESTÁ ACTIVADO, IMPRIMIR CON CONFIG POR DEFECTO
        if (this.autoImprimir && !this.yaImpreso) {
          setTimeout(() => this.imprimirFactura(), 500);
        }
      }
    });
  }

  /**
   * ✅ MÉTODO PÚBLICO PARA IMPRIMIR FACTURA
   */
  public imprimirFactura(): void {
    if (this.yaImpreso) {
      return;
    }

    if (!this.datosFactura) {
      console.error('❌ No hay datos de factura para imprimir');
      return;
    }

    this.yaImpreso = true;

    try {
      this.imprimirContenidoDirecto();
    } catch (error) {
      console.error('❌ Error al imprimir factura:', error);
      this.enviarFacturaABackend();
    }
  }

  /**
   * ✅ IMPRIMIR MANIPULANDO EL DOM ACTUAL SIN VENTANAS
   */
  private imprimirContenidoDirecto(): void {
    const contenidoOriginal = document.body.innerHTML;
    const tituloOriginal = document.title;
    const style = document.createElement('style');
    
    try {
      const facturaHTML = this.generarHTMLFactura();
      
      style.innerHTML = this.obtenerEstilosImpresion();
      document.head.appendChild(style);
      
      document.title = `Factura - ${this.datosFactura.pedido_id}`;
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
            
            console.log('✅ Factura impresa y DOM restaurado');
          } catch (restoreError) {
            console.error('❌ Error al restaurar DOM:', restoreError);
          }
        }, 100);
      });
      
    } catch (error) {
      // Restaurar DOM en caso de error
      document.body.innerHTML = contenidoOriginal;
      document.title = tituloOriginal;
      if (style.parentNode) {
        document.head.removeChild(style);
      }
      throw error;
    }
  }

  /**
   * ✅ GENERAR HTML DE FACTURA CON CONFIGURACIÓN DINÁMICA
   */
  private generarHTMLFactura(): string {
    const direccionCompleta = this.obtenerDireccionCompleta();

    return `
      <div class="factura-container">
        <div class="header">
          <div class="logo">${this.configuracionEmpresa.razon_social}</div>
          ${this.configuracionEmpresa.nombre_comercial ? 
            `<div class="nombre-comercial">${this.configuracionEmpresa.nombre_comercial}</div>` : ''
          }
          <div class="ruc">RUC: ${this.configuracionEmpresa.ruc}</div>
          <div class="direccion">${direccionCompleta}</div>
          ${this.configuracionEmpresa.telefono ? 
            `<div class="contacto">Tel: ${this.configuracionEmpresa.telefono}</div>` : ''
          }
          ${this.configuracionEmpresa.email ? 
            `<div class="contacto">Email: ${this.configuracionEmpresa.email}</div>` : ''
          }
          <div class="tipo-documento">Factura Simplificada</div>
        </div>
        
        <div class="info-section">
          <div class="info-row">
            <span>Fecha:</span>
            <span>${this.fechaActual}</span>
          </div>
          <div class="info-row">
            <span>Orden:</span>
            <span>${this.datosFactura.pedido_id}</span>
          </div>
          <div class="info-row">
            <span>Cliente:</span>
            <span>${this.datosFactura.cliente}</span>
          </div>
          ${this.datosFactura.turno ? `
            <div class="info-row">
              <span>Turno:</span>
              <span>${this.datosFactura.turno}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="productos">
          <div class="productos-title">PRODUCTOS:</div>
          ${this.datosFactura.productos.map(p => `
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
            <span>$${this.datosFactura.subtotal.toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span>IVA (${this.configuracionEmpresa.porcentaje_iva}%):</span>
            <span>$${this.datosFactura.iva.toFixed(2)}</span>
          </div>
          <div class="info-row total-final">
            <span>TOTAL:</span>
            <span>$${this.datosFactura.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div class="agradecimiento">¡Gracias por su compra!</div>
          <div class="establecimiento">${this.configuracionEmpresa.nombre_comercial || this.configuracionEmpresa.razon_social}</div>
          <div class="fecha-pie">${this.fechaHora}</div>
          ${this.configuracionEmpresa.email ? 
            `<div class="contacto-pie">${this.configuracionEmpresa.email}</div>` : ''
          }
        </div>
      </div>`;
  }

  /**
   * ✅ ESTILOS CSS PARA IMPRESIÓN TÉRMICA
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
        padding-bottom: 8px;
        margin-bottom: 8px;
      }
      
      .logo {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 2px;
      }
      
      .nombre-comercial {
        font-size: 12px;
        margin-bottom: 2px;
      }
      
      .ruc {
        font-size: 11px;
        font-weight: bold;
        margin-bottom: 3px;
      }
      
      .direccion {
        font-size: 10px;
        margin-bottom: 2px;
        line-height: 1.3;
      }
      
      .contacto {
        font-size: 10px;
        margin-bottom: 1px;
      }
      
      .tipo-documento {
        font-size: 12px;
        font-weight: bold;
        margin-top: 3px;
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
      
      .agradecimiento {
        font-weight: bold;
        margin-bottom: 2px;
      }
      
      .establecimiento {
        margin-bottom: 2px;
      }
      
      .fecha-pie {
        margin-bottom: 1px;
      }
      
      .contacto-pie {
        font-size: 9px;
        margin-top: 2px;
      }
    `;
  }

  /**
   * ✅ MÉTODO FALLBACK PARA ENVÍO A BACKEND
   */
  private enviarFacturaABackend(): void {
    console.log('📄 Enviando factura a backend como fallback...');
    
    const datosImpresion = {
      // Datos empresariales dinámicos
      establecimiento: this.configuracionEmpresa.razon_social,
      nombre_comercial: this.configuracionEmpresa.nombre_comercial,
      ruc: this.configuracionEmpresa.ruc,
      direccion: this.obtenerDireccionCompleta(),
      telefono: this.configuracionEmpresa.telefono,
      email: this.configuracionEmpresa.email,
      
      // Datos del documento
      tipo_documento: 'Factura Simplificada',
      pedido_id: this.datosFactura.pedido_id,
      cliente: this.datosFactura.cliente,
      fecha: this.fechaActual,
      
      // Productos y totales
      productos: this.datosFactura.productos,
      subtotal: this.datosFactura.subtotal,
      iva_porcentaje: this.configuracionEmpresa.porcentaje_iva,
      iva_valor: this.datosFactura.iva,
      total: this.datosFactura.total,
      
      // Información adicional
      turno: this.datosFactura.turno
    };

    console.log('📋 Datos de impresión preparados para backend:', datosImpresion);
    
    // Aquí puedes implementar el envío al backend si es necesario
    // this.catalogoService.imprimirFactura(datosImpresion).subscribe(...)
  }
}