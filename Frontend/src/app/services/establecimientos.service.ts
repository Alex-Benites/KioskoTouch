import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

    crearEstablecimiento(establecimiento: FormData): Observable<any> {
        console.log('📤 Creando establecimiento con FormData');
        return this.http.post<any>(`${this.apiUrl}/crear/`, establecimiento);
    }

    actualizarEstablecimiento(id: number, establecimiento: FormData): Observable<any> {
        console.log('📤 Actualizando establecimiento con FormData');
        return this.http.put<any>(`${this.apiUrl}/${id}/`, establecimiento);
    }

    obtenerEstablecimientos(): Observable<Establecimiento[]> {
        return this.http.get<Establecimiento[]>(`${this.apiUrl}/`);
    }

    eliminarEstablecimiento(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}/`);
    }

    obtenerEstablecimientoPorId(id: number): Observable<Establecimiento> {
        return this.http.get<Establecimiento>(`${this.apiUrl}/${id}/`);
    }
}