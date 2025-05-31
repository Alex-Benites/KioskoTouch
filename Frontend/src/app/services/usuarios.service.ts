import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private baseUrl = `${environment.apiUrl}/usuarios`;
  private http = inject(HttpClient);

  constructor() { }

  crearUsuario(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/empleados/crear/`, userData);
  }

  obtenerEmpleados(): Observable<any> {
    return this.http.get(`${this.baseUrl}/empleados/lista/`);
  }

obtenerEmpleado(id: number): Observable<any> {
  console.log(`🔍 Solicitando empleado con ID: ${id}`);
  console.log(`🔍 URL completa: ${this.baseUrl}/empleados/${id}/`);
  return this.http.get<any>(`${this.baseUrl}/empleados/${id}/`);
}

  actualizarEmpleado(id: number, empleadoData: any): Observable<any> {
  return this.http.put<any>(`${this.baseUrl}/empleados/${id}/`, empleadoData);
  }

  eliminarEmpleado(id: number): Observable<any> {
  return this.http.delete<any>(`${this.baseUrl}/empleados/${id}/eliminar/`);
  }


}
