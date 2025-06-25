import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EstadisticasPromociones {
  ventas_por_promocion: VentaPromocion[];
  promociones_activas: number;
  promociones_inactivas: number;
  promociones_mas_usadas: PromocionMasUsada[];
  porcentaje_usuarios_promocion: number;
  total_descuentos_aplicados: number;
  total_pedidos_sistema: number;
  total_pedidos_periodo: number;
  pedidos_por_mes: PedidoPorMes[];
}

export interface VentaPromocion {
  promocion__nombre: string;
  total_ventas: number;
  total_ingresos: number;
  tiene_productos: boolean;
  tiene_menus: boolean;
}

export interface PromocionMasUsada {
  promocion__nombre: string;
  veces_usada: number;
}

export interface PedidoPorMes {
  mes: string;
  mes_nombre: string;
  total_pedidos: number;
  pedidos_con_promocion: number;
  ingresos_totales: number;
  descuentos_aplicados: number;
  porcentaje_promocion: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Array<{ field: string; message: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private readonly apiUrl = `${environment.apiUrl}/marketing`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener estadísticas completas de promociones
   */
  getEstadisticasPromociones(): Observable<EstadisticasPromociones> {
    return this.http.get<EstadisticasPromociones>(`${this.apiUrl}/estadisticas/`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let apiError: ApiError = {
      message: 'Ha ocurrido un error inesperado',
      status: error.status || 500
    };

    if (error.error) {
      if (typeof error.error === 'string') {
        apiError.message = error.error;
      } else if (error.error.detail) {
        apiError.message = error.error.detail;
      } else if (error.error.message) {
        apiError.message = error.error.message;
      }
    } else if (error.status === 0) {
      apiError.message = 'No se puede conectar con el servidor';
    } else if (error.status === 404) {
      apiError.message = 'Recurso no encontrado';
    } else if (error.status === 403) {
      apiError.message = 'No tienes permisos para realizar esta acción';
    } else if (error.status >= 500) {
      apiError.message = 'Error interno del servidor';
    }

    console.error('Error en EstadisticasService:', apiError);
    return throwError(() => apiError);
  };
}