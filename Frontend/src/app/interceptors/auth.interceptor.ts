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
  // ✅ NUEVO: Excluir rutas de cliente y login del token
  const isClientRoute = req.url.includes('/cliente');
  const isLoginRoute = req.url.includes('/auth/login/');
  
  if (token && !isLoginRoute && !isClientRoute) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`  
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // 🔑 401 = No autenticado → Ir al LOGIN (pero NO para login ni cliente)
      if (error.status === 401 && !isLoginRoute && !isClientRoute) {
        
        console.warn('🔑 Token inválido o expirado. Redirigiendo al login...');
        
        // Limpiar localStorage directamente 
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // ✅ 401 → LOGIN (usar replaceUrl para limpiar historial)
        router.navigate(['/administrador/login'], { replaceUrl: true });
      }
      
      // 🚫 403 = Sin permisos → Ir a UNAUTHORIZED (solo para rutas de admin)
      if (error.status === 403 && !isClientRoute) {
        console.warn('🚫 Acceso denegado. Sin permisos suficientes...');
        
        // ✅ 403 → UNAUTHORIZED (mantener sesión)
        router.navigate(['/administrador/unauthorized']);
      }
      
      return throwError(() => error);
    })
  );
};