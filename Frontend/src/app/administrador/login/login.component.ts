import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // 📝 Datos del formulario
  usuario: string = '';
  password: string = '';
  
  // 🎭 Estados del componente
  mostrarPopupRecuperar: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  // 🚪 Método de login actualizado
  ingresar() {
    // Limpiar errores previos
    this.errorMessage = '';
    
    // Validaciones básicas
    if (!this.usuario || !this.password) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    // Mostrar loading
    this.isLoading = true;

    // 🔐 Llamar al AuthService
    this.authService.login(this.usuario, this.password).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso:', response);
        
        // Mostrar información del usuario logueado
        if (response.user.empleado) {
          console.log(`👤 Empleado: ${response.user.empleado.nombres} ${response.user.empleado.apellidos}`);
        }
        
        // 🎉 Redirigir al dashboard
        this.router.navigate(['/administrador/home']);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        this.errorMessage = error || 'Error al iniciar sesión. Intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  // 📧 Métodos del popup 
  abrirPopupRecuperar() {
    this.mostrarPopupRecuperar = true;
  }

  cerrarPopupRecuperar() {
    this.mostrarPopupRecuperar = false;
  }

  redirigirRecuperacion() {
    this.cerrarPopupRecuperar();
    this.router.navigate(['/administrador/restablecer-contrasena']);
  }

  // 🧹 Limpiar errores cuando el usuario empiece a escribir
  onInputChange() {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }
}