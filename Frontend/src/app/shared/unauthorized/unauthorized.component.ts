import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/usuarios.model';

@Component({
  selector: 'app-unauthorized',
  imports: [],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.scss'
})
export class UnauthorizedComponent {

  private router = inject(Router);
  private authService = inject(AuthService);

  currentUser: User | null = null;
  isAuthenticated: boolean = false;

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.isAuthenticated = this.authService.isAuthenticated();
    
    console.log('🚫 Unauthorized - Usuario autenticado:', this.isAuthenticated);
    console.log('👤 Usuario actual:', this.currentUser?.email);
  }

  // 🏠 Ir al panel correspondiente del usuario autenticado
  goToUserHome() {
    if (!this.isAuthenticated || !this.currentUser) {
      this.goToClientHome();
      return;
    }

    // Redirigir según el tipo de usuario
    if (this.currentUser.is_superuser) {
      this.router.navigate(['/administrador/home']);
    } else if (this.currentUser.empleado) {
      // Empleado normal
      this.router.navigate(['/administrador/home']);
    } else {
      // Por defecto, cliente
      this.router.navigate(['/cliente/home']);
    }
  }

  // 🔑 Ir al login
  goToLogin() {
    this.router.navigate(['/administrador/login']);
  }

  // 🏠 Ir al inicio del cliente (público)
  goToClientHome() {
    this.router.navigate(['/cliente/home']);
  }
}
