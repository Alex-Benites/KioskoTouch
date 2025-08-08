import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Producto, Categoria, Estado, Menu, Ingrediente } from '../models/catalogo.model';
import { environment } from '../../environments/environment';
import { Tamano } from '../models/tamano.model';
import { PedidoRequest, PedidoResponse } from '../models/pedido-request.models';

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
    return this.http.get<any[]>(`${this.apiUrl}/catalogo/categorias/`).pipe(
      map((response: any) => {
        return response;
      }),
      catchError((error: any) => {
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

    return this.http.get<any>(`${this.apiUrl}/catalogo/ingredientes/categoria/${categoria}/`)
      .pipe(
        map((response: any) => {
          return response.ingredientes || response || [];
        }),
        catchError((error: any) => {

          return throwError(() => error);
        })
      );
  }

  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) {
      return '';
    }

    if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
      return imagenUrl;
    }

    if (imagenUrl.startsWith('/media/')) {
      return `${this.baseUrl}${imagenUrl}`;
    }

    return `${this.baseUrl}/media/${imagenUrl}`;
  }

  obtenerProductosPorIds(ids: number[]): Observable<any[]> {
    const requests = ids.map(id => this.obtenerProductoPorId(id));
    return forkJoin(requests);
  }

  obtenerProductos(): Observable<Producto[]> {
    return this.getProductos();
  }

  obtenerProductoPorId(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/catalogo/productos/${id}/`);
  }

  actualizarProducto(id: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/catalogo/productos/${id}/`, formData);
  }

  eliminarProducto(id: number): Observable<any> {
    const url = `${this.apiUrl}/catalogo/productos/${id}/`;
    return this.http.delete<any>(url);
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

  getMenusActivos(): Observable<any> {
    const url = `${this.apiUrl}/catalogo/menus/activos/`;

    return this.http.get<any>(url).pipe(
      map((response: any) => {
        return response;
      }),
      catchError((error: any) => {
        return throwError(() => error);
      })
    );
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
    return this.getMenusActivos().pipe(
      map((response: any) => {
        return response.menus || response || [];
      })
    );
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


  getIngredientes(): Observable<Ingrediente[]> {
    const url = `${this.apiUrl}/catalogo/ingredientes/`;
    return this.http.get<Ingrediente[]>(url);
  }

  getIngredientesPorCategoriaFiltro(categoria: string): Observable<Ingrediente[]> {
    const url = `${this.apiUrl}/catalogo/ingredientes/?categoria=${categoria}`;
    return this.http.get<Ingrediente[]>(url);
  }

  obtenerIngredientePorId(id: number): Observable<Ingrediente> {
    const url = `${this.apiUrl}/catalogo/ingredientes/${id}/`;
    return this.http.get<Ingrediente>(url);
  }

  crearIngrediente(ingredienteData: FormData): Observable<Ingrediente> {
    const url = `${this.apiUrl}/catalogo/ingredientes/`;
    return this.http.post<Ingrediente>(url, ingredienteData);
  }

  actualizarIngrediente(id: number, ingredienteData: FormData): Observable<Ingrediente> {
    const url = `${this.apiUrl}/catalogo/ingredientes/${id}/`;
    return this.http.put<Ingrediente>(url, ingredienteData);
  }

  eliminarIngrediente(id: number): Observable<any> {
    const url = `${this.apiUrl}/catalogo/ingredientes/${id}/`;
    return this.http.delete<any>(url);
  }

  verificarIngredienteExiste(id: number): Observable<boolean> {
    return new Observable(observer => {
      this.obtenerIngredientePorId(id).subscribe({
        next: () => observer.next(true),
        error: () => observer.next(false)
      });
    });
  }

  getIngredientesPorProducto(productoId: number, tamanoCode?: string): Observable<any> {
    let url = `${this.apiUrl}/catalogo/productos/${productoId}/ingredientes/`;

    if (tamanoCode) {
      url += `?tamano_codigo=${tamanoCode}`;
    }


    return this.http.get<any>(url).pipe(
      map((response: any) => {

        return response;
      }),
      catchError((error: any) => {
        return throwError(() => error);
      })
    );
  }

  getIvaActual(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/comun/iva/actual/`);
  }

  crearIva(datosIva: { porcentaje_iva: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/comun/iva/crear/`, datosIva);
  }

  actualizarIva(datosIva: { porcentaje_iva: number }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/comun/iva/actualizar/`, datosIva);
  }

  // ===== 🆕 MÉTODOS PARA CONFIGURACIÓN EMPRESARIAL COMPLETA =====

  /**
   * Obtener configuración empresarial completa (para edición)
   */
  getConfiguracionEmpresa(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/comun/empresa/gestionar/`).pipe(
      map((response: any) => {
        console.log('🏢 Configuración empresarial recibida:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Error al obtener configuración empresarial:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener datos de empresa para facturas (público)
   */
  getDatosEmpresaPublico(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/comun/empresa/configuracion/`).pipe(
      map((response: any) => {
        console.log('📄 Datos empresa para facturas:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Error al obtener datos empresa:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Crear nueva configuración empresarial
   */
  crearConfiguracionEmpresa(datosEmpresa: {
    porcentaje_iva: number;
    ruc?: string;
    razon_social?: string;
    nombre_comercial?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    codigo_postal?: string;
    telefono?: string;
    email?: string;
  }): Observable<any> {
    console.log('🆕 Creando configuración empresarial:', datosEmpresa);
    
    return this.http.post<any>(`${this.apiUrl}/comun/empresa/gestionar/`, datosEmpresa).pipe(
      map((response: any) => {
        console.log('✅ Configuración empresarial creada:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Error al crear configuración empresarial:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar configuración empresarial existente
   */
  actualizarConfiguracionEmpresa(datosEmpresa: {
    porcentaje_iva: number;
    ruc?: string;
    razon_social?: string;
    nombre_comercial?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    codigo_postal?: string;
    telefono?: string;
    email?: string;
  }): Observable<any> {
    console.log('🔄 Actualizando configuración empresarial:', datosEmpresa);
    
    return this.http.put<any>(`${this.apiUrl}/comun/empresa/gestionar/`, datosEmpresa).pipe(
      map((response: any) => {
        console.log('✅ Configuración empresarial actualizada:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Error al actualizar configuración empresarial:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Listar todas las configuraciones empresariales (para admin)
   */
  listarConfiguracionesEmpresa(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/comun/empresa/configuraciones/`).pipe(
      map((response: any) => {
        console.log('📋 Lista de configuraciones:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Error al listar configuraciones:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Activar una configuración específica
   */
  activarConfiguracionEmpresa(configId: number): Observable<any> {
    console.log(`🔄 Activando configuración ID: ${configId}`);
    
    return this.http.patch<any>(`${this.apiUrl}/comun/empresa/activar/${configId}/`, {}).pipe(
      map((response: any) => {
        console.log('✅ Configuración activada:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Error al activar configuración:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar una configuración específica
   */
  eliminarConfiguracionEmpresa(configId: number): Observable<any> {
    console.log(`🗑️ Eliminando configuración ID: ${configId}`);
    
    return this.http.delete<any>(`${this.apiUrl}/comun/empresa/eliminar/${configId}/`).pipe(
      map((response: any) => {
        console.log('✅ Configuración eliminada:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Error al eliminar configuración:', error);
        return throwError(() => error);
      })
    );
  }

  // ===== 🔧 MÉTODOS DE UTILIDAD =====

  /**
   * Validar RUC ecuatoriano
   */
  validarRucEcuatoriano(ruc: string): boolean {
    if (!ruc || ruc.length !== 13) {
      return false;
    }
    
    // Verificar que solo contenga números
    if (!/^\d{13}$/.test(ruc)) {
      return false;
    }
    
    // Aquí se podría agregar validación más específica del RUC ecuatoriano
    // Por ahora, solo verificamos longitud y que sean números
    return true;
  }

  /**
   * Formatear RUC para mostrar (con guiones)
   */
  formatearRuc(ruc: string): string {
    if (!ruc || ruc.length !== 13) {
      return ruc;
    }
    
    return `${ruc.substring(0, 2)}-${ruc.substring(2, 10)}-${ruc.substring(10, 13)}`;
  }

  /**
   * Limpiar RUC (quitar guiones y espacios)
   */
  limpiarRuc(ruc: string): string {
    if (!ruc) {
      return '';
    }
    
    return ruc.replace(/[-\s]/g, '');
  }

  /**
   * Obtener configuración para uso en facturas o documentos
   * (Método de conveniencia que maneja errores internamente)
   */
  obtenerDatosParaFactura(): Observable<any> {
    return this.getDatosEmpresaPublico().pipe(
      map((response: any) => {
        if (response.success && response.data) {
          return {
            success: true,
            configuracion: response.data
          };
        } else {
          // Devolver configuración por defecto si no hay datos
          return {
            success: true,
            configuracion: {
              ruc: '1791310199001',
              razon_social: 'KIOSKO TOUCH',
              nombre_comercial: 'Kiosko de Autoservicio',
              direccion: 'Dirección no configurada',
              ciudad: 'Ciudad no configurada',
              telefono: '',
              email: '',
              porcentaje_iva: 15.00
            },
            esConfiguracionPorDefecto: true
          };
        }
      }),
      catchError((error: any) => {
        console.warn('⚠️ Error al obtener configuración, usando valores por defecto');
        
        // En caso de error, devolver configuración por defecto
        return [{
          success: true,
          configuracion: {
            ruc: '1791310199001',
            razon_social: 'KIOSKO TOUCH',
            nombre_comercial: 'Kiosko de Autoservicio',
            direccion: 'Dirección no configurada',
            ciudad: 'Ciudad no configurada',
            telefono: '',
            email: '',
            porcentaje_iva: 15.00
          },
          esConfiguracionPorDefecto: true,
          error: error
        }];
      })
    );
  }

  crearPedido(pedidoData: PedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(`${this.apiUrl}/ventas/pedidos/crear/`, pedidoData);
  }

  obtenerPedido(pedidoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ventas/pedidos/${pedidoId}/`);
  }

  getMenuImagen(menuId: number): Observable<any> {
    const url = `${this.apiUrl}/catalogo/menus/${menuId}/imagen/`;

    return this.http.get<any>(url).pipe(
      map((response: any) => {
        return response;
      }),
      catchError((error: any) => {
        return throwError(() => error);
      })
    );
  }
}
