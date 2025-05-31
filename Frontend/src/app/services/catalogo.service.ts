import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, Categoria, Estado } from '../models/catalogo.model'; 
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root' 
})
export class CatalogoService {

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { } 

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }
 
  crearProducto(productoData: FormData): Observable<Producto> {
    const url = `${this.apiUrl}catalogo/productos/`;
    return this.http.post<Producto>(url, productoData);
  }

  getProductos(): Observable<Producto[]> {
    const url = `${this.apiUrl}catalogo/productos/`;
    return this.http.get<Producto[]>(url, this.getHttpOptions());
  }

  getCategorias(): Observable<Categoria[]> {
    const url = `${this.apiUrl}catalogo/categorias/`;
    return this.http.get<Categoria[]>(url, this.getHttpOptions());
  }

  getEstados(): Observable<Estado[]> {
    const url = `${this.apiUrl}comun/estados/`; 
    return this.http.get<Estado[]>(url, this.getHttpOptions());
  }

  getProductoImagen(productoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}catalogo/productos/${productoId}/imagen/`);
  }

  getIngredientesPorCategoria(categoria: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}catalogo/ingredientes/${categoria}/`);
  }

  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) return 'assets/images/no-image.png'; 
    return `http://127.0.0.1:8000${imagenUrl}`;
  }

  //   // ⚠️ CAMBIAR: Método para URL completa de imagen dinámico
  // getFullImageUrl(imagenUrl: string | undefined): string {
  //   if (!imagenUrl) return 'assets/images/no-image.png';
    
  //   // Si ya es una URL completa, devolverla tal como está
  //   if (imagenUrl.startsWith('http')) {
  //     return imagenUrl;
  //   }
    
  //   // Construir URL base dinámicamente
  //   const baseUrl = environment.production 
  //     ? environment.apiUrl.replace('/api', '')  // Remover /api para imágenes
  //     : 'http://127.0.0.1:8000';
    
  //   return `${baseUrl}${imagenUrl}`;
  // }
}