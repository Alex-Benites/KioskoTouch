import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PantallaCocinaService {
  private apiUrl = `${environment.apiUrl}/establecimientos/pantallas-cocina`;

  constructor(private http: HttpClient) {}

  crearPantallaCocina(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/crear/`, data);
  }

  obtenerPantallasCocina(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/`);
  }

  obtenerPantallaCoci‌naPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/`);
  }

  actualizarPantallaCocina(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/`, data);
  }

  eliminarPantallaCocina(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/`);
  }
}