import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Publicidad, 
  PublicidadCreateRequest,
  PublicidadUpdateRequest,
  PublicidadStats, 
  PublicidadFilters, 
  PaginatedResponse,
  ApiResponse,
  ApiError
} from '../models/marketing.model';
import { Estado } from '../models/catalogo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PublicidadService {
  private readonly apiUrl = `${environment.apiUrl}/marketing`;

  constructor(private http: HttpClient) {}

  // Obtener todas las publicidades con filtros
  getPublicidades(filters?: PublicidadFilters): Observable<PaginatedResponse<Publicidad>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.estado !== undefined) {
        params = params.set('estado', filters.estado.toString());
      }
      if (filters.tipo_publicidad) {
        params = params.set('tipo_publicidad', filters.tipo_publicidad);
      }
      if (filters.activo !== undefined) {
        params = params.set('activo', filters.activo.toString());
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.ordering) {
        params = params.set('ordering', filters.ordering);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.page_size) {
        params = params.set('page_size', filters.page_size.toString());
      }
    }

    return this.http.get<PaginatedResponse<Publicidad>>(`${this.apiUrl}/publicidades/`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener una publicidad por ID
  getPublicidad(id: number): Observable<Publicidad> {
    return this.http.get<Publicidad>(`${this.apiUrl}/publicidades/${id}/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Crear nueva publicidad
  createPublicidad(publicidadData: FormData): Observable<Publicidad> {
    return this.http.post<Publicidad>(`${this.apiUrl}/publicidades/`, publicidadData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Actualizar publicidad
  updatePublicidad(id: number, publicidadData: FormData | PublicidadUpdateRequest): Observable<Publicidad> {
    return this.http.patch<Publicidad>(`${this.apiUrl}/publicidades/${id}/`, publicidadData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Eliminar publicidad
  deletePublicidad(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/publicidades/${id}/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Cambiar estado de publicidad (activo/inactivo)
  toggleEstadoPublicidad(id: number): Observable<Publicidad> {
    return this.http.patch<Publicidad>(`${this.apiUrl}/publicidades/${id}/toggle-estado/`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener estadísticas de publicidades
  getPublicidadStats(): Observable<PublicidadStats> {
    return this.http.get<PublicidadStats>(`${this.apiUrl}/publicidades/stats/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener estados desde el endpoint común (SIN filtrar aquí)
  getEstados(): Observable<Estado[]> {
    return this.http.get<Estado[]>(`${environment.apiUrl}/comun/estados/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // SIMPLIFICADO: buildFormDataForCreate SIN conversión de estados
  buildFormDataForCreate(formValues: any, selectedFile: File): FormData {
    const formData = new FormData();
    
    // Mapear campos básicos
    formData.append('nombre', formValues.nombre || '');
    formData.append('descripcion', formValues.descripcion || '');
    formData.append('tipo_publicidad', formValues.tipoPublicidad || '');
    
    // Formatear fechas
    if (formValues.fechaInicial instanceof Date) {
      formData.append('fecha_inicio_publicidad', formValues.fechaInicial.toISOString().split('T')[0]);
    }
    if (formValues.fechaFinal instanceof Date) {
      formData.append('fecha_fin_publicidad', formValues.fechaFinal.toISOString().split('T')[0]);
    }

      
    // AGREGAR DEBUG PARA ESTADO
    console.log('=== DEBUG ESTADO EN SERVICIO ===');
    console.log('formValues.estado:', formValues.estado);
    console.log('Tipo de formValues.estado:', typeof formValues.estado);
    console.log('Es número?', typeof formValues.estado === 'number');
    console.log('Es string?', typeof formValues.estado === 'string');
    
    // SIMPLIFICADO: Estado ya viene como ID desde el formulario
    if (formValues.estado) {
      formData.append('estado', formValues.estado.toString());
    }
    
    formData.append('media_type', formValues.mediaType || '');
    
    // Solo incluir duración de video si es video
    if (formValues.mediaType === 'video' && formValues.videoDuration) {
      formData.append('videoDuration', formValues.videoDuration.toString());
    }
    
    // Solo incluir tiempo de intervalo si es imagen
    if (formValues.mediaType === 'image') {
      formData.append('tiempo_intervalo_valor', formValues.tiempoIntervaloValor?.toString() || '5');
      formData.append('tiempo_intervalo_unidad', formValues.tiempoIntervaloUnidad || 'segundos');
    }

    // Añadir el archivo
    if (selectedFile) {
      formData.append('media_file', selectedFile, selectedFile.name);
    }

    return formData;
  }

  // Método para construir FormData para actualización
  buildFormDataForUpdate(formValues: any, selectedFile?: File): FormData {
    const formData = new FormData();
    
    // Mapear campos básicos
    if (formValues.nombre) formData.append('nombre', formValues.nombre);
    if (formValues.descripcion) formData.append('descripcion', formValues.descripcion);
    if (formValues.tipo_publicidad) formData.append('tipo_publicidad', formValues.tipo_publicidad);
    
    // Formatear fechas
    if (formValues.fecha_inicio_publicidad instanceof Date) {
      formData.append('fecha_inicio_publicidad', formValues.fecha_inicio_publicidad.toISOString().split('T')[0]);
    } else if (formValues.fecha_inicio_publicidad) {
      formData.append('fecha_inicio_publicidad', formValues.fecha_inicio_publicidad);
    }
    
    if (formValues.fecha_fin_publicidad instanceof Date) {
      formData.append('fecha_fin_publicidad', formValues.fecha_fin_publicidad.toISOString().split('T')[0]);
    } else if (formValues.fecha_fin_publicidad) {
      formData.append('fecha_fin_publicidad', formValues.fecha_fin_publicidad);
    }
    
    // Estado como ID directo
    if (formValues.estado) {
      formData.append('estado', formValues.estado.toString());
    }
    
    // Manejar archivos de media
    if (selectedFile) {
      const mediaType = this.getMediaTypeFromFile(selectedFile);
      formData.append('media_file', selectedFile, selectedFile.name);
      formData.append('media_type', mediaType || '');
      
      // Solo incluir duración de video si es video
      if (mediaType === 'video' && formValues.videoDuration) {
        formData.append('videoDuration', formValues.videoDuration.toString());
      }
      
      // Solo incluir tiempo de intervalo si es imagen
      if (mediaType === 'image') {
        formData.append('tiempo_intervalo_valor', formValues.tiempo_intervalo_valor?.toString() || '5');
        formData.append('tiempo_intervalo_unidad', formValues.tiempo_intervalo_unidad || 'segundos');
      }
    }
    
    // Flag para eliminar media existente
    if (formValues.remove_media) {
      formData.append('remove_media', 'true');
    }

    return formData;
  }

  // Validar archivo antes de subirlo
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'El archivo no puede ser mayor a 50MB' };
    }
    
    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);
    
    if (!isImage && !isVideo) {
      return { valid: false, error: 'Tipo de archivo no soportado' };
    }
    
    return { valid: true };
  }

  // Formatear duración de video
  formatDuration(seconds: number): string {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Determinar tipo de media por extensión
  getMediaTypeFromFile(file: File): 'image' | 'video' | null {
    if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.type.startsWith('video/')) {
      return 'video';
    }
    return null;
  }

  // Obtener publicidades activas (para el kiosco)
  getPublicidadesActivas(): Observable<Publicidad[]> {
    return this.getPublicidades({ activo: true })
      .pipe(
        map(response => response.results)
      );
  }

  // Búsqueda de publicidades
  searchPublicidades(query: string): Observable<Publicidad[]> {
    return this.getPublicidades({ search: query })
      .pipe(
        map(response => response.results)
      );
  }

  // Filtrar por tipo de publicidad
  getPublicidadesByTipo(tipo: string): Observable<Publicidad[]> {
    return this.getPublicidades({ tipo_publicidad: tipo })
      .pipe(
        map(response => response.results)
      );
  }

  // Método para eliminar media de una publicidad
  removeMediaFromPublicidad(id: number): Observable<Publicidad> {
    const formData = new FormData();
    formData.append('remove_media', 'true');
    
    return this.http.patch<Publicidad>(`${this.apiUrl}/publicidades/${id}/`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Manejo de errores
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let apiError: ApiError = {
      message: 'Ha ocurrido un error inesperado',
      status: error.status || 500
    };

    console.error('=== ERROR HTTP RESPONSE ===');
    console.error('Status:', error.status);
    console.error('Error object:', error.error);
    console.error('Headers:', error.headers);

    if (error.error) {
      // Error del backend Django
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
            errors.push({
              field,
              message: messages.join(', ')
            });
          } else if (typeof messages === 'string') {
            errors.push({
              field,
              message: messages
            });
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

    console.error('Error en PublicidadService:', apiError);
    return throwError(() => apiError);
  };
}