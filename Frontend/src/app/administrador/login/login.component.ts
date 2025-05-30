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
  emailRecuperacion: string = '';
  loadingRecuperacion: boolean = false;
  mensajeRecuperacion: string = '';
  errorRecuperacion: string = '';

  // 🎭 Estados del componente
  mostrarPopupRecuperar: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  // 🚪 Método de login (agrega este si no lo tienes)
  ingresar() {
    this.errorMessage = '';
    
    if (!this.usuario || !this.password) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.isLoading = true;

    this.authService.login(this.usuario, this.password).subscribe({
      next: (response: any) => {
        console.log('✅ Login exitoso:', response);
        this.router.navigate(['/administrador/home'], { replaceUrl: true });
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error en login:', error);
        this.errorMessage = error || 'Error al iniciar sesión. Intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  // 📧 Abrir popup de recuperación
  abrirPopupRecuperar() {
    this.mostrarPopupRecuperar = true;
    this.emailRecuperacion = '';
    this.mensajeRecuperacion = '';
    this.errorRecuperacion = '';
    this.loadingRecuperacion = false;
  }

  // 📨 Solicitar recuperación de contraseña
  solicitarRecuperacion() {
    if (!this.emailRecuperacion) {
      this.errorRecuperacion = 'Por favor, ingrese un email válido';
      return;
    }

    this.loadingRecuperacion = true;
    this.errorRecuperacion = '';
    this.mensajeRecuperacion = '';

    this.authService.requestPasswordReset(this.emailRecuperacion).subscribe({
      next: (response: any) => {
        console.log('✅ Solicitud de recuperación enviada:', response);
        this.mensajeRecuperacion = response.message;
        this.loadingRecuperacion = false;
        
        // Redirigir al componente de restablecer contraseña después de 2 segundos
        setTimeout(() => {
          this.redirigirRecuperacion();
        }, 2000);
      },
      error: (error: any) => {
        console.error('❌ Error en recuperación:', error);
        this.errorRecuperacion = error.error?.error || 'Error al enviar el email';
        this.loadingRecuperacion = false;
      }
    });
  }

  // 🧹 Limpiar errores de recuperación
  onRecuperacionInputChange() {
    if (this.errorRecuperacion) {
      this.errorRecuperacion = '';
    }
  }

  // 🧹 Limpiar errores de login
  onInputChange() {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  // Cerrar popup de recuperación
  cerrarPopupRecuperar() {
    this.mostrarPopupRecuperar = false;
    this.emailRecuperacion = '';
    this.mensajeRecuperacion = '';
    this.errorRecuperacion = '';
    this.loadingRecuperacion = false;
  }

  // Redirigir a restablecer contraseña
  redirigirRecuperacion() {
    this.cerrarPopupRecuperar();
    this.router.navigate(['/administrador/restablecer-contrasena']);
  }
}