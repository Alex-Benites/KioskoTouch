import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const publicAPIs = [
    '/cliente',                                   
    '/api/marketing/publicidades/activas/',       
    '/api/comun/estados/',                      
    '/auth/login/',
    '/api/catalogo/categorias/',
    '/api/catalogo/menus/',    
    '/api/catalogo/productos/',
    '/api/marketing/promociones/'                      
  ];

  const isPublicRoute = publicAPIs.some(api => req.url.includes(api));

  if (isPublicRoute) {
    return next(req);
  }

  const token = authService.getAccessToken();
  const isLoginRoute = req.url.includes('/auth/login/');
  
  let authReq = req;
  
  if (token && !isLoginRoute) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`  
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      if (error.status === 401 && !isLoginRoute) {
        console.warn('🔑 Token inválido o expirado. Redirigiendo al login...');
        
        // Limpiar localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Redirigir al login
        router.navigate(['/administrador/login'], { replaceUrl: true });
      }
      
      if (error.status === 403) {
        console.warn('🚫 Acceso denegado. Sin permisos suficientes...');
        router.navigate(['/administrador/unauthorized']);
      }
      
      return throwError(() => error);
    })
  );
};