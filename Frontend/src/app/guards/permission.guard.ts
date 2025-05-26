import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard = (requiredPermissions: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      console.warn('🚫 Usuario no autenticado');
      router.navigate(['/administrador/login']);
      return false;
    }

    if (authService.hasAnyPermission(requiredPermissions)) {
      console.log('✅ Usuario tiene permisos:', requiredPermissions);
      return true;
    } else {
      console.warn('❌ Usuario sin permisos suficientes:', requiredPermissions);
      console.log('👤 Permisos del usuario:', authService.getCurrentUser()?.permissions);
      router.navigate(['/administrador/unauthorized']);
      return false;
    }
  };
};
