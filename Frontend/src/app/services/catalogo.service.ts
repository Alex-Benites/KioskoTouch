import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, Categoria, Estado, Menu } from '../models/catalogo.model';
import { environment } from '../../environments/environment';
import { Tamano } from '../models/tamano.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  crearProducto(productoData: FormData): Observable<Producto> {
    const url = `${this.apiUrl}/catalogo/productos/`;
    return this.http.post<Producto>(url, productoData);
  }

  getProductos(): Observable<Producto[]> {
    const url = `${this.apiUrl}/catalogo/productos/`;
    return this.http.get<Producto[]>(url);
  }

  getCategorias(): Observable<Categoria[]> {
    const url = `${this.apiUrl}/catalogo/categorias/`;
    return this.http.get<Categoria[]>(url);
  }

  getEstados(): Observable<Estado[]> {
    const url = `${this.apiUrl}/comun/estados/`;
    return this.http.get<Estado[]>(url);
  }

  getProductoImagen(productoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/catalogo/productos/${productoId}/imagen/`);
  }

  getIngredientesPorCategoria(categoria: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/catalogo/ingredientes/${categoria}/`);
  }

  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) return 'assets/images/no-image.png';
    return `${environment.baseUrl}${imagenUrl}`;
  }

  obtenerProductoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/catalogo/productos/${id}/`);
  }

  actualizarProducto(id: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/catalogo/productos/${id}/`, formData);
  }

  eliminarProducto(id: number): Observable<any> {
    const url = `${this.apiUrl}/catalogo/productos/${id}/`;
    return this.http.delete<any>(url);
  }

  obtenerProductos(): Observable<Producto[]> {
    return this.getProductos();
  }

  verificarProductoExiste(id: number): Observable<boolean> {
    return new Observable(observer => {
      this.obtenerProductoPorId(id).subscribe({
        next: () => observer.next(true),
        error: () => observer.next(false)
      });
    });
  }

  crearMenu(MenuData: FormData): Observable<Menu> {
    const url = `${this.apiUrl}/catalogo/menus/`;
    return this.http.post<Menu>(url, MenuData);
  }

  getMenus(): Observable<Menu[]> {
    const url = `${this.apiUrl}/catalogo/menus/`;
    return this.http.get<Menu[]>(url);
  }

  getMenuImagen(menuId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/catalogo/menus/${menuId}/imagen/`);
  }

  obtenerMenuPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/catalogo/menus/${id}/`);
  }

  actualizarMenu(id: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/catalogo/menus/${id}/`, formData);
  }

  eliminarMenu(id: number): Observable<any> {
    const url = `${this.apiUrl}/catalogo/menus/${id}/`;
    return this.http.delete<any>(url);
  }

  obtenerMenus(): Observable<Menu[]> {
    return this.getMenus();
  }

  verificarMenuExiste(id: number): Observable<boolean> {
    return new Observable(observer => {
      this.obtenerMenuPorId(id).subscribe({
        next: () => observer.next(true),
        error: () => observer.next(false)
      });
    });
  }

  getEstablecimientos(): Observable<any[]> {
    const url = `${this.apiUrl}/establecimientos/`;
    return this.http.get<any[]>(url);
  }

  getTamanos(): Observable<Tamano[]> {
    const url = `${this.apiUrl}/catalogo/tamanos/`;
    return this.http.get<Tamano[]>(url);
  }

  getProductosConTamanos(): Observable<Producto[]> {
    const url = `${this.apiUrl}/catalogo/productos/listado-completo/?aplica_tamanos=true`;
    return this.http.get<Producto[]>(url);
  }

  getPrecioPorTamano(producto: Producto, codigoTamano: string): number {
    if (!producto.aplica_tamanos || !producto.tamanos_detalle) {
      return producto.precio;
    }
    
    const tamanoEncontrado = producto.tamanos_detalle.find(
      t => t.codigo_tamano.toLowerCase() === codigoTamano.toLowerCase()
    );
    
    return tamanoEncontrado ? tamanoEncontrado.precio : producto.precio;
  }
}
