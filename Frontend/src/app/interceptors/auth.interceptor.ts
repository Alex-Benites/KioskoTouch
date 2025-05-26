import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getAccessToken();
  
  let authReq = req;
  if (token && !req.url.includes('/auth/login/') && !req.url.includes('/auth/logout/')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 🚨 SOLO manejar 401 si NO es login o logout 
      if (error.status === 401 && 
          !req.url.includes('/auth/login/') && 
          !req.url.includes('/auth/logout/')) {
        
        console.warn('🔑 Token inválido o expirado. Limpiando sesión...');
        
        // Limpiar localStorage directamente 
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Redirigir al login
        router.navigate(['/administrador/login']);
      }
      
      return throwError(() => error);
    })
  );
};