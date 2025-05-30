import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, Categoria, Estado } from '../models/catalogo.model'; 

@Injectable({
  providedIn: 'root' // Angular CLI añade esto por defecto
})
export class CatalogoService {

  private apiUrl = 'http://127.0.0.1:8000/api/'; // URL para desarrollo

  // Ejemplo para producción:
  // private apiUrl = 'https://tu-dominio-de-produccion.com/api/';

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
}