import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs'; // ✅ AGREGAR throwError
import { map, catchError } from 'rxjs/operators'; // ✅ AGREGAR map y catchError
import { Producto, Categoria, Estado, Menu, Ingrediente } from '../models/catalogo.model';
import { environment } from '../../environments/environment';
import { Tamano } from '../models/tamano.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {

  private apiUrl = `${environment.apiUrl}`;

  private baseUrl = environment.baseUrl; 

  constructor(private http: HttpClient) { }

  crearProducto(productoData: FormData): Observable<Producto> {
    const url = `${this.apiUrl}/catalogo/productos/`;
    return this.http.post<Producto>(url, productoData);
  }

  getProductos(): Observable<Producto[]> {
    const url = `${this.apiUrl}/catalogo/productos/`;
    return this.http.get<Producto[]>(url);
  }

  getCategorias(): Observable<any[]> {
    console.log('📂 [SERVICE] Solicitando categorías');
    return this.http.get<any[]>(`${this.apiUrl}/catalogo/categorias/`).pipe(
      map((response: any) => {
        console.log('✅ [SERVICE] Categorías recibidas:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ [SERVICE] Error al obtener categorías:', error);
        return throwError(() => error);
      })
    );
  }

  getEstados(): Observable<Estado[]> {
    const url = `${this.apiUrl}/comun/estados/`;
    return this.http.get<Estado[]>(url);
  }

  getProductoImagen(productoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/catalogo/productos/${productoId}/imagen/`);
  }

  getIngredientesPorCategoria(categoria: string): Observable<any[]> {
    console.log('🔍 [SERVICE] Solicitando ingredientes para categoría:', categoria);

    return this.http.get<any>(`${this.apiUrl}/catalogo/ingredientes/categoria/${categoria}/`)
      .pipe(
        map((response: any) => {
          console.log('✅ [SERVICE] Respuesta recibida:', response);
          return response.ingredientes || response || [];
        }),
        catchError((error: any) => {
          console.error('❌ [SERVICE] Error al obtener ingredientes:', error);

          if (error.status === 401) {
            console.error('🚫 [SERVICE] Error de autenticación - El interceptor redirigirá automáticamente');
          }

          return throwError(() => error);
        })
      );
  }

  // Actualizar el método getFullImageUrl:
  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) {
      return 'assets/placeholder-ingrediente.png';
    }

    // Si ya es una URL completa, devolverla tal como está
    if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
      return imagenUrl;
    }

    // Si empieza con /media/, construir URL completa
    if (imagenUrl.startsWith('/media/')) {
      return `${this.baseUrl}${imagenUrl}`;
    }

    // Si no tiene prefijo, asumir que está en /media/
    return `${this.baseUrl}/media/${imagenUrl}`;
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

  // === MÉTODOS PARA INGREDIENTES ===

  // Obtener todos los ingredientes
  getIngredientes(): Observable<Ingrediente[]> {
    const url = `${this.apiUrl}/catalogo/ingredientes/`;
    return this.http.get<Ingrediente[]>(url);
  }

  // Obtener ingredientes por categoría
  getIngredientesPorCategoriaFiltro(categoria: string): Observable<Ingrediente[]> {
    const url = `${this.apiUrl}/catalogo/ingredientes/?categoria=${categoria}`;
    return this.http.get<Ingrediente[]>(url);
  }

  // Obtener un ingrediente por ID
  obtenerIngredientePorId(id: number): Observable<Ingrediente> {
    const url = `${this.apiUrl}/catalogo/ingredientes/${id}/`;
    return this.http.get<Ingrediente>(url);
  }

  // Crear ingrediente
  crearIngrediente(ingredienteData: FormData): Observable<Ingrediente> {
    const url = `${this.apiUrl}/catalogo/ingredientes/`;
    return this.http.post<Ingrediente>(url, ingredienteData);
  }

  // Actualizar ingrediente
  actualizarIngrediente(id: number, ingredienteData: FormData): Observable<Ingrediente> {
    const url = `${this.apiUrl}/catalogo/ingredientes/${id}/`;
    return this.http.put<Ingrediente>(url, ingredienteData);
  }

  // Eliminar ingrediente
  eliminarIngrediente(id: number): Observable<any> {
    const url = `${this.apiUrl}/catalogo/ingredientes/${id}/`;
    return this.http.delete<any>(url);
  }

  // Verificar si ingrediente existe
  verificarIngredienteExiste(id: number): Observable<boolean> {
    return new Observable(observer => {
      this.obtenerIngredientePorId(id).subscribe({
        next: () => observer.next(true),
        error: () => observer.next(false)
      });
    });
  }

  // ✅ NUEVO: Obtener ingredientes específicos de un producto
  // Actualizar el método getIngredientesPorProducto:

  // ✅ MEJORAR: Obtener ingredientes específicos de un producto
  getIngredientesPorProducto(productoId: number, tamanoCode?: string): Observable<any> {
    // ✅ CONSTRUIR URL con parámetro opcional
    let url = `${this.apiUrl}/catalogo/productos/${productoId}/ingredientes/`;
    
    // ✅ AGREGAR parámetro de tamaño si existe
    if (tamanoCode) {
      url += `?tamano_codigo=${tamanoCode}`;
    }

    console.log('🔍 [SERVICE] Solicitando ingredientes para producto ID:', productoId);
    if (tamanoCode) {
      console.log('📏 [SERVICE] Con tamaño:', tamanoCode);
    }
    console.log('🔗 [SERVICE] URL completa:', url);

    return this.http.get<any>(url).pipe(
      map((response: any) => {
        console.log('✅ [SERVICE] Ingredientes del producto recibidos:', response);

        // ✅ DEBUG: Mostrar algunas imágenes para verificar
        if (response.ingredientes && response.ingredientes.length > 0) {
          console.log('🖼️ [SERVICE] Primeras 3 imágenes de ingredientes:');
          response.ingredientes.slice(0, 3).forEach((ing: any) => {
            console.log(`   • ${ing.nombre}: ${ing.imagen_url}`);
          });
        }

        return response;
      }),
      catchError((error: any) => {
        console.error('❌ [SERVICE] Error al obtener ingredientes del producto:', error);
        console.error('🔍 [SERVICE] Detalles del error:', {
          status: error.status,
          message: error.message,
          url: url
        });
        return throwError(() => error);
      })
    );
  }
}
