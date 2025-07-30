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

  codigoValidacion: string = '';
  nuevaPassword: string = '';
  confirmarPassword: string = '';

  mostrarPopup: boolean = false;
  loading: boolean = false;
  mensaje: string = '';
  error: string = '';

  uid: string = '';
  token: string = '';
  vieneDeEnlace: boolean = false;

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['uid'] && params['token']) {
        this.uid = params['uid'];
        this.token = params['token'];
        this.vieneDeEnlace = true;
        this.codigoValidacion = `${this.uid}/${this.token}`;
      } else {
        this.vieneDeEnlace = false;
      }
    });
  }

  restablecer() {
    this.error = '';
    this.mensaje = '';

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

    let uidToUse = this.uid;
    let tokenToUse = this.token;

    if (!this.vieneDeEnlace) {
      const partes = this.codigoValidacion.split('/');
      if (partes.length !== 2) {
        this.error = 'Código de validación inválido. Debe tener el formato: uid/token';
        return;
      }
      uidToUse = partes[0];
      tokenToUse = partes[1];
    }

    this.loading = true;

    this.authService.confirmPasswordReset(uidToUse, tokenToUse, this.nuevaPassword).subscribe({
      next: (response) => {
        this.loading = false;
        this.mensaje = 'Contraseña actualizada exitosamente';
        this.mostrarPopup = true;
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }

  continuar() {
    this.mostrarPopup = false;
    this.router.navigate(['/administrador/login']);
  }

  volverAlLogin() {
    this.router.navigate(['/administrador/login']);
  }

  onInputChange() {
    if (this.error) {
      this.error = '';
    } 
  }

  
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