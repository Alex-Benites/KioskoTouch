import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';

@Component({
  selector: 'app-estadisticas-promocion',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeaderAdminComponent,
    CurrencyPipe
  ],
  templateUrl: './estadisticas-promocion.component.html',
  styleUrl: './estadisticas-promocion.component.scss'
})
export class EstadisticasPromocionComponent {
  private router = inject(Router);

  // Datos quemados para los gráficos
  ventasPorPromocion = [
    { label: 'P1', valor: 42, color: '#f08a5d' },
    { label: 'P2', valor: 58, color: '#e54f6d' },
    { label: 'P3', valor: 75, color: '#7a28cb' },
    { label: 'P4', valor: 92, color: '#5c3c4c' }
  ];

  promocionesActivas = [
    { label: 'Promo 1', color: '#f08a5d' },
    { label: 'Promo 2', color: '#e54f6d' },
    { label: 'Promo 3', color: '#7a28cb' },
    { label: 'Promo 4', color: '#5c3c4c' }
  ];

  promocionesMasUsadas = [
    { nombre: 'Promo 4', veces: 41, porcentaje: 95, color: '#5c3c4c' },
    { nombre: 'Promo 1', veces: 28, porcentaje: 70, color: '#f08a5d' },
    { nombre: 'Promo 3', veces: 15, porcentaje: 55, color: '#7a28cb' },
    { nombre: 'Promo 2', veces: 10, porcentaje: 40, color: '#e54f6d' }
  ];

  porcentajeUsuarios = 60;
  ingresoAdicional = 2750.00;

  volver(): void {
    this.router.navigate(['/administrador/gestion-promociones']);
  }
}