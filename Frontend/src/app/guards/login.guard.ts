import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya está autenticado, redirigir al home en lugar de mostrar login
  if (authService.isAuthenticated()) {
    router.navigate(['/administrador/home']);
    return false;
  }

  return true;
};