import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, Empleado, LoginResponse, LoginRequest, ApiResponse } from '../models/usuarios.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/usuarios`;
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  // BehaviorSubjects para reactive programming
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  private permissionsSubject = new BehaviorSubject<string[]>(this.getPermissionsFromStorage());

  // Observables públicos
  public currentUser$ = this.currentUserSubject.asObservable();
  public permissions$ = this.permissionsSubject.asObservable();

  constructor() {}

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/password-reset/`, { email });
  }

  // 🔐 Confirmar reset de contraseña
  confirmPasswordReset(uid: string, token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/password-reset-confirm/${uid}/${token}/`, {
      new_password: newPassword
    });
  }


  // 📝 Login del usuario
  login(emailOrUsername: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = {
      email_or_username: emailOrUsername,
      password: password
    };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login/`, loginData).pipe(
      tap(response => {
        // Guardar tokens y usuario en localStorage
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access_token);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh_token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        
        // Actualizar BehaviorSubjects
        this.currentUserSubject.next(response.user);
        this.permissionsSubject.next(response.user.permissions);
        
        console.log('Login exitoso:', response.user.email);
        console.log('Empleado:', response.user.empleado);
      }),
      catchError(this.handleError)
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/logout/`, {}).pipe(
      tap(() => {
        this.clearStorage();
        this.router.navigate(['/administrador/login']);
      }),
      catchError(error => {
        // Aunque falle el logout del servidor, limpiar localmente
        this.clearStorage();
        this.router.navigate(['/administrador/login']);
        return throwError(error);
      })
    );
  }

  verifyToken(): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.API_URL}/auth/verify/`, {}).pipe(
      tap(response => {
        if (response.user) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
          this.permissionsSubject.next(response.user.permissions);
        }
      }),
      catchError(error => {
        this.clearStorage();
        return throwError(error);
      })
    );
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (!token) return false;
    
    // Verificar si el token no ha expirado
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentEmpleado(): Empleado | null {
    const user = this.currentUserSubject.value;
    return user?.empleado || null;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }



  hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    if (user?.is_superuser) return true; // Superuser siempre tiene acceso
    
    const permissions = this.permissionsSubject.value;
    return permissions.includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    const user = this.currentUserSubject.value;
    if (user?.is_superuser) return true; // Superuser siempre tiene acceso
    
    const userPermissions = this.permissionsSubject.value;
    return permissions.some(permission => userPermissions.includes(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    const user = this.currentUserSubject.value;
    if (user?.is_superuser) return true; // Superuser siempre tiene acceso
    
    const userPermissions = this.permissionsSubject.value;
    return permissions.every(permission => userPermissions.includes(permission));
  }

  isInGroup(groupName: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.groups.includes(groupName) || false;
  }

  isSuperuser(): boolean {
    const user = this.currentUserSubject.value;
    return user?.is_superuser || false;
  }

  isStaff(): boolean {
    const user = this.currentUserSubject.value;
    return user?.is_staff || false;
  }


  isEmpleado(): boolean {
    const user = this.currentUserSubject.value;
    return !!user?.empleado;
  }

  getEmpleadoCedula(): string | null {
    const empleado = this.getCurrentEmpleado();
    return empleado?.cedula || null;
  }

  getEmpleadoNombreCompleto(): string | null {
    const empleado = this.getCurrentEmpleado();
    if (empleado) {
      return `${empleado.nombres} ${empleado.apellidos}`;
    }
    return null;
  }


  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private getPermissionsFromStorage(): string[] {
    const user = this.getUserFromStorage();
    return user?.permissions || [];
  }

  public clearStorage(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.currentUserSubject.next(null);
    this.permissionsSubject.next([]);
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.error?.error) {
        errorMessage = error.error.error;
      } else {
        errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
      }
    }
    
    console.error('Error en AuthService:', errorMessage);
    return throwError(() => errorMessage);
  }

  public clearSession(): void {
    console.log('🧹 Limpiando sesión...');
    this.clearStorage();
  }
}