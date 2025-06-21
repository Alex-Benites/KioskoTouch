import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface PagoRequest {
  tipoTransaccion: number;
  redAdquirente: string;
  montoTotal: string;
  baseImponible: string;
  base0: string;
  iva: string;
  servicio: string;
  propina: string;
}

export interface PagoResponse {
  codigoRespuesta: string;
  mensajeRespuesta: string;
  autorizacion?: string;
  referencia?: string;
  lote?: string;
  numeroTarjeta?: string;
  tarjetaHabiente?: string;
  exitoso: boolean;
}

export interface EstadoPago {
  estado: 'esperando' | 'procesando' | 'exitoso' | 'error' | 'cancelado';
  mensaje: string;
  respuesta?: PagoResponse;
}

@Injectable({
  providedIn: 'root'
})
export class PinpadService {
  
  private apiUrl = 'http://localhost:8080/api/pinpad';
  private estadoPagoSubject = new BehaviorSubject<EstadoPago>({
    estado: 'esperando',
    mensaje: 'Listo para procesar pago'
  });

  public estadoPago$ = this.estadoPagoSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  /**
   * ✅ PROCESAR PAGO CON TARJETA
   */
  procesarPago(monto: number): Observable<PagoResponse> {
    this.actualizarEstado('procesando', 'Procesando pago con tarjeta...');

    const request: PagoRequest = {
      tipoTransaccion: 1, // 1 = Venta
      redAdquirente: "001",
      montoTotal: this.formatearMonto(monto),
      baseImponible: this.formatearMonto(monto * 0.893), // 89.3% base imponible
      base0: "000000000000",
      iva: this.formatearMonto(monto * 0.107), // 10.7% IVA
      servicio: "000000000000",
      propina: "000000000000"
    };

    return this.http.post<PagoResponse>(`${this.apiUrl}/pagar`, request, this.httpOptions)
      .pipe(
        timeout(120000), // 2 minutos timeout
        catchError(error => {
          this.actualizarEstado('error', `Error de comunicación: ${error.message}`);
          return throwError(error);
        })
      );
  }

  /**
   * ✅ CONSULTAR TARJETA (sin cobrar)
   */
  consultarTarjeta(): Observable<PagoResponse> {
    this.actualizarEstado('procesando', 'Consultando tarjeta...');

    return this.http.post<PagoResponse>(`${this.apiUrl}/consultar-tarjeta`, {}, this.httpOptions)
      .pipe(
        timeout(60000), // 1 minuto timeout
        catchError(error => {
          this.actualizarEstado('error', `Error consultando tarjeta: ${error.message}`);
          return throwError(error);
        })
      );
  }

  /**
   * ✅ ANULAR TRANSACCIÓN
   */
  anularTransaccion(referencia: string, autorizacion: string, monto: number): Observable<PagoResponse> {
    this.actualizarEstado('procesando', 'Anulando transacción...');

    const request = {
      tipoTransaccion: 3, // 3 = Anulación
      referencia: referencia,
      autorizacion: autorizacion,
      montoTotal: this.formatearMonto(monto)
    };

    return this.http.post<PagoResponse>(`${this.apiUrl}/anular`, request, this.httpOptions)
      .pipe(
        timeout(60000),
        catchError(error => {
          this.actualizarEstado('error', `Error anulando: ${error.message}`);
          return throwError(error);
        })
      );
  }

  /**
   * ✅ VERIFICAR CONECTIVIDAD
   */
  verificarConectividad(): Observable<string> {
    return this.http.get(`${this.apiUrl}/health`, { responseType: 'text' })
      .pipe(
        timeout(5000),
        catchError(error => {
          return throwError('Servicio PinPad no disponible');
        })
      );
  }

  /**
   * ✅ FORMATEAR MONTO A FORMATO DATAFAST
   * Convierte 10.50 a "000000001050"
   */
  private formatearMonto(monto: number): string {
    const centavos = Math.round(monto * 100);
    return centavos.toString().padStart(12, '0');
  }

  /**
   * ✅ ACTUALIZAR ESTADO DEL PAGO
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
   * ✅ REINICIAR ESTADO
   */
  reiniciarEstado(): void {
    this.actualizarEstado('esperando', 'Listo para procesar pago');
  }
}