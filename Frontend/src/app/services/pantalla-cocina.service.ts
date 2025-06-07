import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PantallaCocinaService {
  private apiUrl = `${environment.apiUrl}/establecimientos/pantallas-cocina`;

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    const token = localStorage.getItem('access_token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  crearPantallaCocina(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/crear/`, data, this.getHttpOptions());
  }

  obtenerPantallasCocina(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/`, this.getHttpOptions());
  }

  obtenerPantallaCoci‌naPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/`, this.getHttpOptions());
  }

  actualizarPantallaCocina(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/`, data, this.getHttpOptions());
  }

  eliminarPantallaCocina(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/`, this.getHttpOptions());
  }
}