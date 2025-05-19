import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true, // Si quieres mantenerlo como standalone
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  usuario: string = '';
  password: string = '';
  mostrarPopupRecuperar: boolean = false;

  constructor(private router: Router) {}

  ingresar() {

    this.router.navigate(['/administrador/home']);

    // (this.usuario && this.password) {
    //this.router.navigate(['/administrador/menu']);
    //
  }

  abrirPopupRecuperar() {
    this.mostrarPopupRecuperar = true;
  }

  cerrarPopupRecuperar() {
    this.mostrarPopupRecuperar = false;
  }

  redirigirRecuperacion() {
    // Primero cerramos el pop-up (opcional)
    this.cerrarPopupRecuperar();
    // Navegamos al componente "recuperar-contrasena"
    this.router.navigate(['/administrador/restablecer-contrasena']);
  }
}
