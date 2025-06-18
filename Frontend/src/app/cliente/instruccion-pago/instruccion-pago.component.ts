import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';

@Component({
  selector: 'app-instruccion-pago',
  standalone: true,
  imports: [
    CommonModule,
    PublicidadSectionComponent
  ],
  templateUrl: './instruccion-pago.component.html',
  styleUrls: ['./instruccion-pago.component.scss']
})
export class InstruccionPagoComponent {

  private router = inject(Router);

  onPublicidadCambio(publicidad: Publicidad): void {
    console.log('📺 Nueva publicidad en pantalla de pago:', publicidad.nombre);
  }

  /**
   * Navega a la siguiente pantalla o simula el proceso de pago.
   */
  continuar(): void {
    console.log('💳 Procediendo al siguiente paso del pago...');
    // Ejemplo de navegación:
    // this.router.navigate(['/cliente/pago-exitoso']);
  }
}