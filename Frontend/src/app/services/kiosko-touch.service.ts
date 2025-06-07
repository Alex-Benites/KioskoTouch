import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KioskoTouchService {
    private apiUrl = `${environment.apiUrl}/establecimientos/kioscos-touch`; // <-- Cambia esta línea

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

    crearKioscoTouch(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/crear/`, data, this.getHttpOptions());
    }

    obtenerKioscosTouch(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/`, this.getHttpOptions());
    }

    obtenerKioscoTouchPorId(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}/`, this.getHttpOptions());
    }

    actualizarKioscoTouch(id: number, data: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}/`, data, this.getHttpOptions());
    }

    eliminarKioscoTouch(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}/`, this.getHttpOptions());
    }
}
