import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

export interface PagoRequest {
  tipoTransaccion: number;
  redAdquirente: number;
  montoTotal: string;
  baseImponible: string;
  iva: string;
  base0: string;
}

export interface PagoResponse {
  exitoso?: boolean;
  codigoRespuesta: string;
  mensajeRespuesta: string;
  autorizacion?: string;
  referencia?: string;
  lote?: string;
  numeroTarjeta?: string;
  tarjetaHabiente?: string;
  modoLectura?: string;
  fechaHora?: string;
}

export interface EstadoPago {
  estado: 'esperando' | 'procesando' | 'exitoso' | 'error';
  mensaje: string;
  respuesta?: PagoResponse;
}

@Injectable({
  providedIn: 'root'
})
export class PinpadService {

  // ✅ URL DINÁMICA SEGÚN ENVIRONMENT
  private readonly API_URL = this.determinarUrlPinpad();
  
  private estadoPagoSubject = new BehaviorSubject<EstadoPago>({
    estado: 'esperando',
    mensaje: 'Listo para procesar pago'
  });

  public estadoPago$ = this.estadoPagoSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🔧 PinpadService inicializado con URL:', this.API_URL);
  }

  /**
   * ✅ DETECTAR AUTOMÁTICAMENTE SI ES DESARROLLO O KIOSKO
   */
  private determinarUrlPinpad(): string {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // 🏠 DESARROLLO LOCAL
      console.log('🏠 Modo desarrollo: Conectando al PinpadService local');
      return 'http://localhost:8081/api/pinpad';
    } else {
      // 🏢 KIOSKO EN PRODUCCIÓN (frontend desde la nube)
      console.log('🏢 Modo kiosko: Frontend en nube conectando a PinpadService local');
      return 'http://localhost:8080/api/pinpad';
    }
  }

  procesarPago(montoTotal: number, baseImponible?: number, iva?: number, base0?: number): Observable<PagoResponse> {
    console.log('💳 Procesando pago con URL:', this.API_URL);
    console.log('💰 Montos recibidos:', { montoTotal, baseImponible, iva, base0 });

    this.actualizarEstado('procesando', 'Conectando con PinPad...');

    const montoTotalCentavos = Math.round(montoTotal * 100);
    const ivaTasa = 0.15;
    
    let baseImpCentavos: number;
    let ivaCentavos: number;
    let base0Centavos: number;

    if (baseImponible !== undefined && iva !== undefined) {
      baseImpCentavos = Math.round(baseImponible * 100);
      ivaCentavos = Math.round(iva * 100);
      base0Centavos = base0 ? Math.round(base0 * 100) : 0;
    } else {
      base0Centavos = 0;
      baseImpCentavos = Math.round(montoTotalCentavos / (1 + ivaTasa));
      ivaCentavos = montoTotalCentavos - baseImpCentavos;
    }

    const request: PagoRequest = {
      tipoTransaccion: 1,
      redAdquirente: 1,
      montoTotal: this.formatearMonto(montoTotalCentavos),
      baseImponible: this.formatearMonto(baseImpCentavos),
      iva: this.formatearMonto(ivaCentavos),
      base0: this.formatearMonto(base0Centavos)
    };

    console.log('📤 Request enviado al PinpadService:', request);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<PagoResponse>(`${this.API_URL}/pagar`, request, { headers })
      .pipe(
        timeout(90000), // ✅ 90 segundos timeout
        map(response => {
          console.log('📥 Respuesta del PinpadService:', response);
          
          if (response.codigoRespuesta === '00') {
            this.actualizarEstado('exitoso', 'Pago autorizado correctamente', response);
          } else {
            this.actualizarEstado('error', response.mensajeRespuesta || 'Transacción rechazada');
          }
          
          return response;
        }),
        catchError(error => {
          console.error('❌ Error en procesamiento de pago:', error);
          
          let mensajeError = 'Error de comunicación con PinPad';
          
          if (error.status === 0) {
            mensajeError = 'No se puede conectar al PinPad Service. ¿Está corriendo en el kiosko?';
          } else if (error.name === 'TimeoutError') {
            mensajeError = 'Timeout - La transacción tardó demasiado';
          } else if (error.status === 403) {
            mensajeError = 'Acceso denegado - Verificar configuración CORS';
          } else if (error.status >= 500) {
            mensajeError = 'Error interno del PinPad Service';
          }
          
          this.actualizarEstado('error', mensajeError);
          
          return of({
            exitoso: false,
            codigoRespuesta: 'ER',
            mensajeRespuesta: mensajeError
          } as PagoResponse);
        })
      );
  }

  consultarTarjeta(): Observable<any> {
    console.log('💳 Consultando tarjeta via:', this.API_URL);
    
    this.actualizarEstado('procesando', 'Leyendo tarjeta...');
    
    return this.http.post(`${this.API_URL}/consultar-tarjeta`, {})
      .pipe(
        timeout(30000),
        map(response => {
          console.log('📥 Respuesta consulta tarjeta:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error en consulta de tarjeta:', error);
          this.actualizarEstado('error', 'Error al leer tarjeta');
          return of({ exitoso: false, mensaje: 'Error de comunicación' });
        })
      );
  }

  verificarConectividad(): Observable<any> {
    console.log('🔍 Verificando conectividad con:', this.API_URL);
    
    return this.http.get(`${this.API_URL}/health`)
      .pipe(
        timeout(5000),
        map(response => {
          console.log('✅ PinPad Service disponible:', response);
          return { conectado: true, ...response };
        }),
        catchError(error => {
          console.warn('⚠️ PinPad Service no disponible:', error);
          
          let mensaje = 'Servicio no disponible';
          if (error.status === 0) {
            mensaje = 'No se puede conectar. ¿Está el PinPad Service corriendo en el kiosko?';
          }
          
          return of({ 
            conectado: false, 
            error: mensaje 
          });
        })
      );
  }

  reiniciarEstado(): void {
    console.log('🔄 Reiniciando estado del PinPad...');
    this.actualizarEstado('esperando', 'Listo para procesar pago');
  }

  private formatearMonto(valorEnCentavos: number): string {
    const montoFormateado = valorEnCentavos.toString().padStart(12, '0');
    console.log(`💰 Monto formateado: ${valorEnCentavos} centavos -> ${montoFormateado}`);
    return montoFormateado;
  }

  private actualizarEstado(estado: EstadoPago['estado'], mensaje: string, respuesta?: PagoResponse): void {
    const nuevoEstado = { estado, mensaje, respuesta };
    console.log('📊 Actualizando estado:', nuevoEstado);
    this.estadoPagoSubject.next(nuevoEstado);
  }

  obtenerEstadoActual(): EstadoPago {
    return this.estadoPagoSubject.value;
  }

  anularTransaccion(referencia: string, autorizacion: string): Observable<PagoResponse> {
    console.log('🔄 Anulando transacción:', { referencia, autorizacion });
    
    const request = {
      tipoTransaccion: 3,
      redAdquirente: 1,
      referencia: referencia,
      autorizacion: autorizacion
    };

    return this.http.post<PagoResponse>(`${this.API_URL}/anular`, request)
      .pipe(
        timeout(60000),
        map(response => {
          console.log('📥 Respuesta anulación:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error en anulación:', error);
          return of({
            exitoso: false,
            codigoRespuesta: 'ER',
            mensajeRespuesta: 'Error en anulación'
          } as PagoResponse);
        })
      );
  }
}