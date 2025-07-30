import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TurnoConfirmationDialogComponent } from '../../shared/turno-confirmation-dialog/turno-confirmation-dialog.component';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-turno',
  standalone: true,
  imports: [
    CommonModule,
    PublicidadSectionComponent,
    MatDialogModule
  ],
  templateUrl: './turno.component.html',
  styleUrls: ['./turno.component.scss']
})
export class TurnoComponent {
  numeroTurno: string = '';
  readonly MAX_DIGITS = 3;

  private router = inject(Router);
  private dialog = inject(MatDialog);
  private pedidoService = inject(PedidoService);

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
    if (!this.numeroTurno) {
      return;
    }

    const turnoNumerico = parseInt(this.numeroTurno);

    if (isNaN(turnoNumerico) || turnoNumerico <= 0) {
      alert('Por favor ingresa un número de turno válido');
      return;
    }

    const cantidadProductos = this.pedidoService.cantidadItems();
    if (cantidadProductos === 0) {
      alert('No tienes productos en tu pedido. Agrega productos antes de continuar.');
      return;
    }


  this.pedidoService.establecerTurno(parseInt(this.numeroTurno, 10));


    this.router.navigate(['/cliente/resumen-pedido']);

    this.numeroTurno = '';
  }

  abrirDialogoPrueba(): void {
    const dialogRef = this.dialog.open(TurnoConfirmationDialogComponent, {
      width: '450px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
      } else {
      }
    });
  }

  verificarEstadoPedido(): void {
  }
}