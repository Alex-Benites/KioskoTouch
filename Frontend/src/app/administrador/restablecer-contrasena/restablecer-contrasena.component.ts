import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-restablecer-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './restablecer-contrasena.component.html',
  styleUrls: ['./restablecer-contrasena.component.scss']
})
export class RestablecerContrasenaComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  // 📝 Datos del formulario
  codigoValidacion: string = '';
  nuevaPassword: string = '';
  confirmarPassword: string = '';

  // 🎭 Estados del componente
  mostrarPopup: boolean = false;
  loading: boolean = false;
  mensaje: string = '';
  error: string = '';

  // 🔐 Datos extraídos de la URL o formulario
  uid: string = '';
  token: string = '';
  vieneDeEnlace: boolean = false;

  ngOnInit() {
    // Verificar si viene del enlace del email
    this.route.params.subscribe(params => {
      if (params['uid'] && params['token']) {
        this.uid = params['uid'];
        this.token = params['token'];
        this.vieneDeEnlace = true;
        this.codigoValidacion = `${this.uid}/${this.token}`;
        console.log('📧 Llegaste desde el enlace del email');
      } else {
        this.vieneDeEnlace = false;
        console.log('📱 Llegaste desde la app manualmente');
      }
    });
  }

  // 🔐 Restablecer contraseña
  restablecer() {
    // Limpiar errores
    this.error = '';
    this.mensaje = '';

    // Validaciones
    if (!this.codigoValidacion && !this.vieneDeEnlace) {
      this.error = 'Por favor, ingrese el código de validación';
      return;
    }

    if (!this.nuevaPassword) {
      this.error = 'Por favor, ingrese la nueva contraseña';
      return;
    }

    if (!this.confirmarPassword) {
      this.error = 'Por favor, confirme la nueva contraseña';
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    if (this.nuevaPassword.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    // Extraer uid y token
    let uidToUse = this.uid;
    let tokenToUse = this.token;

    if (!this.vieneDeEnlace) {
      // Si no viene del enlace, extraer del código manual
      const partes = this.codigoValidacion.split('/');
      if (partes.length !== 2) {
        this.error = 'Código de validación inválido. Debe tener el formato: uid/token';
        return;
      }
      uidToUse = partes[0];
      tokenToUse = partes[1];
    }

    // Enviar solicitud
    this.loading = true;

    this.authService.confirmPasswordReset(uidToUse, tokenToUse, this.nuevaPassword).subscribe({
      next: (response) => {
        console.log('✅ Contraseña actualizada:', response);
        this.loading = false;
        this.mensaje = 'Contraseña actualizada exitosamente';
        this.mostrarPopup = true;
      },
      error: (error) => {
        console.error('❌ Error al actualizar contraseña:', error);
        this.loading = false;
        this.error = error.error?.error || 'Error al actualizar la contraseña';
      }
    });
  }

  // 🎉 Continuar después del éxito
  continuar() {
    this.mostrarPopup = false;
    this.router.navigate(['/administrador/login']);
  }

  // 🔙 Volver al login
  volverAlLogin() {
    this.router.navigate(['/administrador/login']);
  }

  // 🧹 Limpiar errores cuando el usuario escriba
  onInputChange() {
    if (this.error) {
      this.error = '';
    } 
  }

  // 🔄 Limpiar formulario
  limpiarFormulario() {
    if (!this.vieneDeEnlace) {
      this.codigoValidacion = '';
    }
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.error = '';
    this.mensaje = '';
  }
}