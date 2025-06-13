import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse,HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Publicidad,
  PublicidadStats,
  ApiError,
  Promocion
} from '../models/marketing.model';
import { Estado } from '../models/catalogo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PublicidadService {
  private readonly apiUrl = `${environment.apiUrl}/marketing`;

  constructor(private http: HttpClient) {}


  // Obtener TODAS las publicidades
  getPublicidades(): Observable<Publicidad[]> {
    return this.http.get<Publicidad[]>(`${this.apiUrl}/publicidades/`)
      .pipe(catchError(this.handleError));
  }

  // Obtener una publicidad por ID
  getPublicidadById(id: number): Observable<Publicidad> {
    return this.http.get<Publicidad>(`${this.apiUrl}/publicidades/${id}/`)
      .pipe(catchError(this.handleError));
  }

  // Crear nueva publicidad
  createPublicidad(formData: FormData): Observable<Publicidad> {
    return this.http.post<Publicidad>(`${this.apiUrl}/publicidades/`, formData)
      .pipe(catchError(this.handleError));
  }

  // Actualizar publicidad
  updatePublicidad(id: number, formData: FormData): Observable<Publicidad> {
    return this.http.patch<Publicidad>(`${this.apiUrl}/publicidades/${id}/`, formData)
      .pipe(catchError(this.handleError));
  }

  // Eliminar publicidad
  deletePublicidad(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/publicidades/${id}/`)
      .pipe(catchError(this.handleError));
  }

  // Cambiar estado de publicidad (activo/inactivo)
  toggleEstadoPublicidad(id: number): Observable<Publicidad> {
    return this.http.patch<Publicidad>(`${this.apiUrl}/publicidades/${id}/toggle-estado/`, {})
      .pipe(catchError(this.handleError));
  }

  // Obtener estadísticas de publicidades
  getPublicidadStats(): Observable<PublicidadStats> {
    return this.http.get<PublicidadStats>(`${this.apiUrl}/publicidades/stats/`)
      .pipe(catchError(this.handleError));
  }

  // Obtener estados desde el endpoint común
  getEstados(): Observable<Estado[]> {
    return this.http.get<Estado[]>(`${environment.apiUrl}/comun/estados/`)
      .pipe(catchError(this.handleError));
  }
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
      } else {
        // Errores de validación de campos
        const errors = [];
        for (const [field, messages] of Object.entries(error.error)) {
          if (Array.isArray(messages)) {
            errors.push({ field, message: messages.join(', ') });
          } else if (typeof messages === 'string') {
            errors.push({ field, message: messages });
          }
        }
        if (errors.length > 0) {
          apiError.errors = errors;
          apiError.message = 'Por favor, corrige los errores en el formulario';
        }
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

    return throwError(() => apiError);
  };
  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) return 'assets/images/no-image.png';
    return `${environment.baseUrl}${imagenUrl}`;
  }
  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }
  crearPromocion(PromocionData: FormData): Observable<Promocion> {
    const url = `${this.apiUrl}/promociones/`;
    return this.http.post<Promocion>(url, PromocionData);
  }
  getPromociones(): Observable<Promocion[]> {
    const url = `${this.apiUrl}/promociones/`;
    return this.http.get<Promocion[]>(url, this.getHttpOptions());
  }
  getPromocionImagen(PromocionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/promociones/${PromocionId}/imagen/`);
  }
  obtenerPromocionPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/promociones/${id}/`);
  }

  actualizarPromocion(id: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/promociones/${id}/`, formData);
  }

  eliminarPromocion(id: number): Observable<any> {
    const url = `${this.apiUrl}/promociones/${id}/`;
    return this.http.delete<any>(url, this.getHttpOptions());
  }

  obtenerPromociones(): Observable<Promocion[]> {
    return this.getPromociones();
  }

  verificarPromocionExiste(id: number): Observable<boolean> {
    return new Observable(observer => {
      this.obtenerPromocionPorId(id).subscribe({
        next: () => observer.next(true),
        error: () => observer.next(false)
      });
    });
  }

  // ✅ SOLO AGREGAR este método
  getTamanos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tamanos/`)
      .pipe(catchError(this.handleError));
  }
}
