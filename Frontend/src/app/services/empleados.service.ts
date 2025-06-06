import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmpleadoDropdown {
  id: number;
  user_id: number;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  cargo: string;
  cedula: string;
  telefono: string;
  email: string;
}

export interface EmpleadosResponse {
  empleados: EmpleadoDropdown[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * 📋 Obtener empleados para dropdown
   */
  getEmpleadosParaDropdown(): Observable<EmpleadosResponse> {
    return this.http.get<EmpleadosResponse>(`${this.apiUrl}/empleados/dropdown/`, {
      headers: this.getHeaders()
    });
  }

  /**
   * 📝 Obtener empleado por ID (método adicional para futuro uso)
   */
  getEmpleadoPorId(id: number): Observable<EmpleadoDropdown> {
    return this.http.get<EmpleadoDropdown>(`${this.apiUrl}/empleados/${id}/`, {
      headers: this.getHeaders()
    });
  }
}