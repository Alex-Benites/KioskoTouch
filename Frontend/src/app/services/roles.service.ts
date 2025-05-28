import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 📦 Importar modelos
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
  private baseUrl = 'http://localhost:8000/api/usuarios';

  constructor(private http: HttpClient) {}

  /**
   * 📋 Obtener gestiones y permisos organizados
   */
  getGestiones(): Observable<GestionesResponse> {
    return this.http.get<GestionesResponse>(`${this.baseUrl}/permisos/`);
  }

  /**
   * 🆕 Crear nuevo rol
   */
  crearRol(data: CrearRolRequest): Observable<RolResponse> {
    return this.http.post<RolResponse>(`${this.baseUrl}/grupos/crear/`, data);
  }

  /**
   * 📄 Obtener todos los grupos/roles
   */
  getRoles(): Observable<GruposResponse> {
    return this.http.get<GruposResponse>(`${this.baseUrl}/grupos/`);
  }

  /**
   * 🔍 Obtener detalles de un rol específico
   */
  getDetalleRol(rolId: number): Observable<DetalleRol> {
    return this.http.get<DetalleRol>(`${this.baseUrl}/grupos/${rolId}/`);
  }

  /**
   * 🔍 Alias para mantener compatibilidad con el componente
   */
  obtenerDetalleRol(rolId: number): Observable<DetalleRol> {
    return this.getDetalleRol(rolId);
  }

  /**
   * ✏️ Editar rol existente
   */
  editarRol(rolId: number, data: EditarRolRequest): Observable<RolResponse> {
    return this.http.put<RolResponse>(`${this.baseUrl}/grupos/${rolId}/editar/`, data);
  }

  /**
   * 🗑️ Eliminar rol
   */
  eliminarRol(rolId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/grupos/${rolId}/eliminar/`);
  }

  /**
   * 👤 Asignar rol a empleado
   */
  asignarRolEmpleado(empleadoId: number, rolNombre: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/empleados/${empleadoId}/asignar-rol/`, {
      rol: rolNombre
    });
  }
}