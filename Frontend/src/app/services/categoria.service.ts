// ✅ CREAR Frontend/src/app/administrador/gestion-categorias/categoria.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Categoria {
  id?: number;
  nombre: string;
  imagen_url?: string | null;
  productos_count?: number;
  ingredientes_count?: number;
  puede_eliminar?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaResponse {
  success: boolean;
  mensaje: string;
  categoria?: Categoria;
  error?: string;
  detalles?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl = `${environment.apiUrl}/categoria`;

  constructor(private http: HttpClient) {}

  // ✅ LISTAR todas las categorías
  getCategorias(): Observable<Categoria[]> {
    console.log('🔍 Obteniendo lista de categorías...');
    return this.http.get<Categoria[]>(`${this.apiUrl}/`).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ OBTENER una categoría específica
  getCategoria(id: number): Observable<Categoria> {
    console.log(`🔍 Obteniendo categoría ID: ${id}`);
    return this.http.get<Categoria>(`${this.apiUrl}/${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ CREAR nueva categoría
  crearCategoria(categoriaData: FormData): Observable<CategoriaResponse> {
    console.log('➕ Creando nueva categoría...');
    return this.http.post<CategoriaResponse>(`${this.apiUrl}/`, categoriaData).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ ACTUALIZAR categoría existente
  actualizarCategoria(id: number, categoriaData: FormData): Observable<CategoriaResponse> {
    console.log(`📝 Actualizando categoría ID: ${id}`);
    return this.http.put<CategoriaResponse>(`${this.apiUrl}/${id}/`, categoriaData).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ ELIMINAR categoría
  eliminarCategoria(id: number): Observable<CategoriaResponse> {
    console.log(`🗑️ Eliminando categoría ID: ${id}`);
    return this.http.delete<CategoriaResponse>(`${this.apiUrl}/${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  // ✅ HELPER: Crear FormData para envío
  crearFormData(categoria: Partial<Categoria>, imagen?: File): FormData {
    const formData = new FormData();
    
    if (categoria.nombre) {
      formData.append('nombre', categoria.nombre);
    }
    
    if (imagen) {
      formData.append('imagen', imagen);
    }
    
    return formData;
  }

  // ✅ HELPER: Obtener URL completa de imagen
  getFullImageUrl(imagenUrl: string | null | undefined): string {
    if (!imagenUrl) {
      return 'assets/placeholder-categoria.png';
    }
    
    if (imagenUrl.startsWith('http')) {
      return imagenUrl;
    }
    
    return `${environment.apiUrl.replace('/api', '')}${imagenUrl}`;
  }

  // ✅ MANEJO DE ERRORES
  private handleError(error: any): Observable<never> {
    console.error('❌ Error en CategoriaService:', error);
    
    let errorMessage = 'Ocurrió un error inesperado';
    
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}