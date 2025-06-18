import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TurnoConfirmationDialogComponent } from '../../shared/turno-confirmation-dialog/turno-confirmation-dialog.component';

@Component({
  selector: 'app-turno',
  standalone: true,
  imports: [
    CommonModule,
    PublicidadSectionComponent,
    MatDialogModule // Añadir módulo de diálogo
  ],
  templateUrl: './turno.component.html',
  styleUrls: ['./turno.component.scss']
})
export class TurnoComponent {
  numeroTurno: string = '';
  readonly MAX_DIGITS = 3;

  constructor(
    private router: Router,
    private dialog: MatDialog // Inyectar MatDialog
  ) {}

  onPublicidadCambio(publicidad: Publicidad): void {
    // Manejar cambio de publicidad si es necesario
  }

  agregarNumero(numero: string): void {
    if (this.numeroTurno.length < this.MAX_DIGITS) {
      this.numeroTurno += numero;
    }
  }

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

  // ✅ NUEVO: Método para abrir el diálogo de prueba
  abrirDialogoPrueba(): void {
    const dialogRef = this.dialog.open(TurnoConfirmationDialogComponent, {

    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        alert('El usuario seleccionó "Sí"');
      } else {
        alert('El usuario seleccionó "No"');
      }
    });
  }
}