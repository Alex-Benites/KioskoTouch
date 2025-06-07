import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Establecimiento } from '../models/establecimiento.model';

@Injectable({
  providedIn: 'root'
})
export class EstablecimientosService {
    private apiUrl = `${environment.apiUrl}/establecimientos`;

    constructor(private http: HttpClient) {
        console.log('🏗️ EstablecimientosService inicializado');
        console.log('🏗️ apiUrl:', this.apiUrl);
    }

    private getHttpOptions() {
        const token = localStorage.getItem('access_token');
        return {
            headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            })
        };
    }

    private getHttpOptionsForUpload() {
        const token = localStorage.getItem('access_token');
        return {
            headers: new HttpHeaders({
            'Authorization': `Bearer ${token}`
            })
        };
    }

    // 🔥 MÉTODO SIMPLIFICADO - crearEstablecimiento (SIEMPRE FormData)
    crearEstablecimiento(establecimiento: FormData): Observable<any> {
        console.log('📤 Creando establecimiento con FormData');
        return this.http.post<any>(`${this.apiUrl}/crear/`, establecimiento, this.getHttpOptionsForUpload());
    }

    // 🔥 MÉTODO SIMPLIFICADO - actualizarEstablecimiento (SIEMPRE FormData)
    actualizarEstablecimiento(id: number, establecimiento: FormData): Observable<any> {
        console.log('📤 Actualizando establecimiento con FormData');
        return this.http.put<any>(`${this.apiUrl}/${id}/`, establecimiento, this.getHttpOptionsForUpload());
    }

    obtenerEstablecimientos(): Observable<Establecimiento[]> {
        return this.http.get<Establecimiento[]>(`${this.apiUrl}/`, this.getHttpOptions());
    }

    eliminarEstablecimiento(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}/`, this.getHttpOptions());
    }

    obtenerEstablecimientoPorId(id: number): Observable<Establecimiento> {
        return this.http.get<Establecimiento>(`${this.apiUrl}/${id}/`, this.getHttpOptions());
    }

    // 🗑️ ELIMINAR: obtenerImagenes() y subirImagen() - Ya no los necesitamos
}