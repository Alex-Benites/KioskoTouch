import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { EstadisticasService, EstadisticasPromociones, ApiError } from '../../../services/estadisticas.service';

// Importar ng2-charts
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';

@Component({
  selector: 'app-estadisticas-promocion',
  standalone: true,
  imports: [
    CommonModule,
    HeaderAdminComponent,
    CurrencyPipe,
    FooterAdminComponent,
    BaseChartDirective // Agregar para los gráficos
  ],
  templateUrl: './estadisticas-promocion.component.html',
  styleUrl: './estadisticas-promocion.component.scss'
})
export class EstadisticasPromocionComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private estadisticasService = inject(EstadisticasService);
  private subscription = new Subscription();

  // Estados de carga
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Datos de Chart.js
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: []
  };

  horizontalBarChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  // Configuraciones de Chart.js
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10
        }
      }
    }
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    }
  };

  horizontalBarChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true
      }
    }
  };

  // Tipos de gráficos
  barChartType: ChartType = 'bar';
  doughnutChartType: ChartType = 'doughnut';
  horizontalBarChartType: ChartType = 'bar';

  // KPIs
  porcentajeUsuarios = 0;
  ingresoAdicional = 0;

  // Colores para los gráficos
  private readonly colores = [
    '#f08a5d', '#e54f6d', '#7a28cb', '#5c3c4c', '#3498db'
  ];

  constructor() {
    // Registrar componentes de Chart.js
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarEstadisticas(): void {
    this.isLoading = true;
    this.hasError = false;

    const sub = this.estadisticasService.getEstadisticasPromociones().subscribe({
      next: (data: EstadisticasPromociones) => {
        console.log('📊 Estadísticas recibidas:', data);
        this.procesarDatos(data);
        this.isLoading = false;
      },
      error: (error: ApiError) => {
        console.error('❌ Error al cargar estadísticas:', error);
        this.hasError = true;
        this.errorMessage = error.message;
        this.isLoading = false;
        this.cargarDatosPorDefecto();
      }
    });

    this.subscription.add(sub);
  }

  private procesarDatos(data: EstadisticasPromociones): void {
    this.configurarGraficoBarras(data);
    this.configurarGraficoDoughnut(data);
    this.configurarGraficoBarrasHorizontales(data);
    this.configurarKPIs(data);
  }

  private configurarGraficoBarras(data: EstadisticasPromociones): void {
    const ventas = data.ventas_por_promocion;

    this.barChartData = {
      labels: ventas.map(item => item.promocion__nombre),
      datasets: [
        {
          data: ventas.map(item => item.total_ventas),
          backgroundColor: this.colores.slice(0, ventas.length),
          borderColor: this.colores.slice(0, ventas.length),
          borderWidth: 1
        }
      ]
    };
  }

  private configurarGraficoDoughnut(data: EstadisticasPromociones): void {
    this.doughnutChartData = {
      labels: ['Activas', 'Inactivas'],
      datasets: [
        {
          data: [data.promociones_activas, data.promociones_inactivas],
          backgroundColor: ['#28a745', '#dc3545'],
          borderColor: ['#28a745', '#dc3545'],
          borderWidth: 2
        }
      ]
    };
  }

  private configurarGraficoBarrasHorizontales(data: EstadisticasPromociones): void {
    const promociones = data.promociones_mas_usadas;

    this.horizontalBarChartData = {
      labels: promociones.map(item => item.promocion__nombre),
      datasets: [
        {
          data: promociones.map(item => item.veces_usada),
          backgroundColor: this.colores.slice(0, promociones.length),
          borderColor: this.colores.slice(0, promociones.length),
          borderWidth: 1
        }
      ]
    };
  }

  private configurarKPIs(data: EstadisticasPromociones): void {
    this.porcentajeUsuarios = Math.round(data.porcentaje_usuarios_promocion);
    this.ingresoAdicional = data.ingresos_adicionales;
  }

  private cargarDatosPorDefecto(): void {
    this.barChartData = {
      labels: ['Promo 1', 'Promo 2', 'Promo 3', 'Promo 4', 'Promo 5'],
      datasets: [
        {
          data: [28, 15, 20, 35, 22],
          backgroundColor: this.colores,
          borderColor: this.colores,
          borderWidth: 1
        }
      ]
    };

    this.doughnutChartData = {
      labels: ['Activas', 'Inactivas'],
      datasets: [
        {
          data: [5, 0],
          backgroundColor: ['#28a745', '#dc3545'],
          borderColor: ['#28a745', '#dc3545'],
          borderWidth: 2
        }
      ]
    };

    this.horizontalBarChartData = {
      labels: ['Promo 4', 'Promo 1', 'Promo 5', 'Promo 3'],
      datasets: [
        {
          data: [35, 28, 22, 20],
          backgroundColor: ['#5c3c4c', '#f08a5d', '#3498db', '#7a28cb'],
          borderColor: ['#5c3c4c', '#f08a5d', '#3498db', '#7a28cb'],
          borderWidth: 1
        }
      ]
    };

    this.porcentajeUsuarios = 75;
    this.ingresoAdicional = 2847.50;
  }

  reintentarCarga(): void {
    this.cargarEstadisticas();
  }

  volver(): void {
    this.router.navigate(['/administrador/gestion-promociones']);
  }
}
