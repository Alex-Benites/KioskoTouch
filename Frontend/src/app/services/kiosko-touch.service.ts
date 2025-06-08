import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KioskoTouchService {
    private apiUrl = `${environment.apiUrl}/establecimientos/kioscos-touch`;

    constructor(private http: HttpClient) {}

    crearKioscoTouch(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/crear/`, data);
    }

    obtenerKioscosTouch(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/`);
    }

    obtenerKioscoTouchPorId(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}/`);
    }

    actualizarKioscoTouch(id: number, data: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}/`, data);
    }

    eliminarKioscoTouch(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}/`);
    }
}