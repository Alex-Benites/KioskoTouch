import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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


  getPublicidades(): Observable<Publicidad[]> {
    return this.http.get<Publicidad[]>(`${this.apiUrl}/publicidades/`)
      .pipe(catchError(this.handleError));
  }

  getPublicidadById(id: number): Observable<Publicidad> {
    return this.http.get<Publicidad>(`${this.apiUrl}/publicidades/${id}/`)
      .pipe(catchError(this.handleError));
  }

  createPublicidad(formData: FormData): Observable<Publicidad> {
    return this.http.post<Publicidad>(`${this.apiUrl}/publicidades/`, formData)
      .pipe(catchError(this.handleError));
  }

  updatePublicidad(id: number, formData: FormData): Observable<Publicidad> {
    return this.http.patch<Publicidad>(`${this.apiUrl}/publicidades/${id}/`, formData)
      .pipe(catchError(this.handleError));
  }

  deletePublicidad(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/publicidades/${id}/`)
      .pipe(catchError(this.handleError));
  }

  toggleEstadoPublicidad(id: number): Observable<Publicidad> {
    return this.http.patch<Publicidad>(`${this.apiUrl}/publicidades/${id}/toggle-estado/`, {})
      .pipe(catchError(this.handleError));
  }

  getPublicidadStats(): Observable<PublicidadStats> {
    return this.http.get<PublicidadStats>(`${this.apiUrl}/publicidades/stats/`)
      .pipe(catchError(this.handleError));
  }

  getEstados(): Observable<Estado[]> {
    return this.http.get<Estado[]>(`${environment.apiUrl}/comun/estados/`)
      .pipe(catchError(this.handleError));
  }


  getPublicidadesActivasParaCarrusel(tipo?: string, seccion?: string): Observable<Publicidad[]> {
    let url = `${this.apiUrl}/publicidades/activas/`;
    
    const params = new URLSearchParams();
    if (tipo) {
      params.append('tipo_publicidad', tipo);
    }
    if (seccion) {
      params.append('seccion', seccion);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.http.get<Publicidad[]>(url)
      .pipe(catchError(this.handleError));
  }

  crearPromocion(promocionData: FormData): Observable<Promocion> {
    return this.http.post<Promocion>(`${this.apiUrl}/promociones/`, promocionData)
      .pipe(catchError(this.handleError));
  }

  getPromociones(): Observable<Promocion[]> {
    return this.http.get<Promocion[]>(`${this.apiUrl}/promociones/`)
      .pipe(catchError(this.handleError));
  }

  getPromocionImagen(promocionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/promociones/${promocionId}/imagen/`)
      .pipe(catchError(this.handleError));
  }

  obtenerPromocionPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/promociones/${id}/`)
      .pipe(catchError(this.handleError));
  }

  actualizarPromocion(id: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/promociones/${id}/`, formData)
      .pipe(catchError(this.handleError));
  }

  eliminarPromocion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/promociones/${id}/`)
      .pipe(catchError(this.handleError));
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

  getTamanos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tamanos/`)
      .pipe(catchError(this.handleError));
  }

  getFullMediaUrl(mediaUrl: string | undefined): string {
    if (!mediaUrl) {
      return 'assets/images/placeholder-banner.png';
    }

    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      return mediaUrl;
    }

    if (mediaUrl.startsWith('/media/')) {
      return `${environment.baseUrl}${mediaUrl}`;
    }

    return `${environment.baseUrl}/media/${mediaUrl}`;
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

}