import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';

@Component({
  selector: 'app-turno',
  standalone: true,
  imports: [
    CommonModule,
    PublicidadSectionComponent
  ],
  templateUrl: './turno.component.html',
  styleUrls: ['./turno.component.scss']
})
export class TurnoComponent {
  numeroTurno: string = '';
  readonly MAX_DIGITS = 3; // Corregido a 3

  constructor(private router: Router) {}

  onPublicidadCambio(publicidad: Publicidad): void {
    // Manejar cambio de publicidad si es necesario
  }

  agregarNumero(numero: string): void {
    if (this.numeroTurno.length < this.MAX_DIGITS) {
      this.numeroTurno += numero;
    }
  }

  /**
   * Elimina el último dígito del turno.
   */
  eliminarNumero(): void {
    this.numeroTurno = this.numeroTurno.slice(0, -1);
  }

  continuar(): void {
    if (this.numeroTurno) {
      console.log(`Turno seleccionado: ${this.numeroTurno}`);
      alert(`Turno ${this.numeroTurno} confirmado.`);
      this.numeroTurno = ''; // Limpiar el turno después de confirmar
    }
  }
}