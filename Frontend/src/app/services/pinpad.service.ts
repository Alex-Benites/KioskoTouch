import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface PagoRequest {
  tipoTransaccion: number;
  redAdquirente: number;
  montoTotal: string;      // 13 dígitos formato Datafast
  baseImponible: string;   // 13 dígitos formato Datafast
  iva: string;            // 13 dígitos formato Datafast
  base0: string;          // 13 dígitos formato Datafast
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

  private readonly API_URL = 'http://localhost:8080/api/pinpad';
  
  // ✅ Estado reactivo del pago
  private estadoPagoSubject = new BehaviorSubject<EstadoPago>({
    estado: 'esperando',
    mensaje: 'Listo para procesar pago'
  });

  public estadoPago$ = this.estadoPagoSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * ✅ PROCESAR PAGO - FORMATO DATAFAST CORRECTO
   */
  procesarPago(montoTotal: number, baseImponible?: number, iva?: number, base0?: number): Observable<PagoResponse> {
    console.log('💳 Iniciando pago con PinPad...');
    console.log('💰 Monto total:', montoTotal);

    // ✅ ACTUALIZAR ESTADO A PROCESANDO
    this.actualizarEstado('procesando', 'Conectando con PinPad...');

    // ✅ CALCULAR VALORES SI NO SE PROPORCIONAN
    const montoTotalCentavos = Math.round(montoTotal * 100);
    const ivaTasa = 0.15; // 15% IVA
    
    let baseImpCentavos: number;
    let ivaCentavos: number;
    let base0Centavos: number;

    if (baseImponible !== undefined && iva !== undefined) {
      // Usar valores proporcionados
      baseImpCentavos = Math.round(baseImponible * 100);
      ivaCentavos = Math.round(iva * 100);
      base0Centavos = base0 ? Math.round(base0 * 100) : 0;
    } else {
      // Calcular automáticamente
      base0Centavos = 0;
      baseImpCentavos = Math.round(montoTotalCentavos / (1 + ivaTasa));
      ivaCentavos = montoTotalCentavos - baseImpCentavos;
    }

    // ✅ FORMATEAR A 13 DÍGITOS SEGÚN DOCUMENTACIÓN DATAFAST
    const request: PagoRequest = {
      tipoTransaccion: 1,  // 01 = Transacción compra corriente
      redAdquirente: 1,    // 1 = Datafast
      montoTotal: this.formatearMonto(montoTotalCentavos),        // Ya son centavos
      baseImponible: this.formatearMonto(baseImpCentavos),       // Ya son centavos
      iva: this.formatearMonto(ivaCentavos),                     // Ya son centavos
      base0: this.formatearMonto(base0Centavos)                  // Ya son centavos
    };

    console.log('📤 Enviando al PinPad:', {
      montoTotal: `$${montoTotal.toFixed(2)} (${request.montoTotal})`,
      baseImponible: `$${(baseImpCentavos/100).toFixed(2)} (${request.baseImponible})`,
      iva: `$${(ivaCentavos/100).toFixed(2)} (${request.iva})`,
      base0: `$${(base0Centavos/100).toFixed(2)} (${request.base0})`
    });

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<PagoResponse>(`${this.API_URL}/pagar`, request, { headers })
      .pipe(
        map(response => {
          console.log('✅ Respuesta del PinPad:', response);
          
          if (response.codigoRespuesta === '00') {
            this.actualizarEstado('exitoso', 'Pago autorizado correctamente', response);
          } else {
            this.actualizarEstado('error', response.mensajeRespuesta || 'Transacción rechazada');
          }
          
          return response;
        }),
        catchError(error => {
          console.error('❌ Error en pago:', error);
          this.actualizarEstado('error', 'Error de comunicación con PinPad');
          return of({
            exitoso: false,
            codigoRespuesta: 'ER',
            mensajeRespuesta: 'Error de comunicación'
          } as PagoResponse);
        })
      );
  }

  /**
   * ✅ CONSULTAR TARJETA
   */
  consultarTarjeta(): Observable<any> {
    console.log('🔍 Consultando tarjeta...');
    
    return this.http.post(`${this.API_URL}/consultar-tarjeta`, {})
      .pipe(
        catchError(error => {
          console.error('❌ Error consultando tarjeta:', error);
          return of({ exitoso: false, mensaje: 'Error de comunicación' });
        })
      );
  }

  /**
   * ✅ VERIFICAR CONECTIVIDAD
   */
  verificarConectividad(): Observable<any> {
    return this.http.get(`${this.API_URL}/health`)
      .pipe(
        catchError(error => {
          console.warn('⚠️ PinPad no disponible');
          return of({ conectado: false });
        })
      );
  }

  /**
   * ✅ REINICIAR ESTADO
   */
  reiniciarEstado(): void {
    this.actualizarEstado('esperando', 'Listo para procesar pago');
  }

  /**
   * ✅ FORMATEAR MONTO A 13 DÍGITOS DATAFAST
   */
  private formatearMonto(valorEnCentavos: number): string {
    // ✅ CORREGIR: Ya recibimos centavos, solo formatear a 12 dígitos
    const montoFormateado = valorEnCentavos.toString().padStart(12, '0');
    
    console.log(`💰 Formateando ${valorEnCentavos} centavos → ${montoFormateado}`);
    return montoFormateado;
  }

  /**
   * ✅ ACTUALIZAR ESTADO INTERNO
   */
  private actualizarEstado(estado: EstadoPago['estado'], mensaje: string, respuesta?: PagoResponse): void {
    this.estadoPagoSubject.next({ estado, mensaje, respuesta });
  }

  /**
   * ✅ OBTENER ESTADO ACTUAL
   */
  obtenerEstadoActual(): EstadoPago {
    return this.estadoPagoSubject.value;
  }

  /**
   * ✅ ANULAR TRANSACCIÓN (para implementar a futuro)
   */
  anularTransaccion(referencia: string, autorizacion: string): Observable<PagoResponse> {
    const request = {
      tipoTransaccion: 3, // 03 = Anulación
      redAdquirente: 1,
      referencia: referencia,
      autorizacion: autorizacion
    };

    return this.http.post<PagoResponse>(`${this.API_URL}/anular`, request)
      .pipe(
        catchError(error => {
          console.error('❌ Error anulando:', error);
          return of({
            exitoso: false,
            codigoRespuesta: 'ER',
            mensajeRespuesta: 'Error en anulación'
          } as PagoResponse);
        })
      );
  }
}