import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import {
  GestionesResponse,
  GruposResponse,
  CrearRolRequest,
  EditarRolRequest,
  DetalleRol,
  RolResponse,
  Grupo
} from '../models/roles.model';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  
  private baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  getGestiones(): Observable<GestionesResponse> {
    return this.http.get<GestionesResponse>(`${this.baseUrl}/permisos/`);
  }

  crearRol(data: CrearRolRequest): Observable<RolResponse> {
    return this.http.post<RolResponse>(`${this.baseUrl}/grupos/crear/`, data);
  }

  getRoles(): Observable<GruposResponse> {
    return this.http.get<GruposResponse>(`${this.baseUrl}/grupos/`);
  }

  getDetalleRol(rolId: number): Observable<DetalleRol> {
    return this.http.get<DetalleRol>(`${this.baseUrl}/grupos/${rolId}/`);
  }

  obtenerDetalleRol(rolId: number): Observable<DetalleRol> {
    return this.getDetalleRol(rolId);
  }

  editarRol(rolId: number, data: EditarRolRequest): Observable<RolResponse> {
    return this.http.put<RolResponse>(`${this.baseUrl}/grupos/${rolId}/editar/`, data);
  }

  eliminarRol(rolId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/grupos/${rolId}/eliminar/`);
  }

  asignarRolEmpleado(empleadoId: number, rolNombre: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/empleados/${empleadoId}/asignar-rol/`, {
      rol: rolNombre
    });
  }
}