import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-restablecer-contrasena',
  standalone: true, // Si quieres mantenerlo como standalone
  imports: [CommonModule, FormsModule],
  templateUrl: './restablecer-contrasena.component.html',
  styleUrls: ['./restablecer-contrasena.component.css']
})
export class RestablecerContrasenaComponent {
  mostrarPopup = false;

  constructor(private router: Router) {}

  restablecer() {
    this.mostrarPopup = true;
  }

  continuar() {
    this.mostrarPopup = false;
    this.router.navigate(['administrador/login']);
  }

  volverAlLogin() {
    this.router.navigate(['administrador/login']);
  }
}