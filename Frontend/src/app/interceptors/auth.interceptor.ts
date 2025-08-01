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
    '/api/marketing/promociones/',
    '/api/comun/iva/actual/'                      
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
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        router.navigate(['/administrador/login'], { replaceUrl: true });
      }
      
      if (error.status === 403) {
        router.navigate(['/administrador/unauthorized']);
      }
      
      return throwError(() => error);
    })
  );
};