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
    BaseChartDirective
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
    this.errorMessage = '';

    console.log('🔄 Cargando estadísticas desde el backend...');

    const sub = this.estadisticasService.getEstadisticasPromociones().subscribe({
      next: (data: EstadisticasPromociones) => {
        console.log('📊 Estadísticas recibidas del backend:', data);
        
        // ✅ VALIDAR QUE LLEGUEN DATOS
        if (!data || typeof data !== 'object') {
          console.error('❌ Datos inválidos recibidos del backend:', data);
          this.mostrarError('Los datos recibidos del backend son inválidos');
          return;
        }

        this.procesarDatos(data);
        this.isLoading = false;
        console.log('✅ Estadísticas procesadas correctamente');
      },
      error: (error: ApiError) => {
        console.error('❌ Error al cargar estadísticas:', error);
        this.mostrarError(error.message || 'Error al conectar con el servidor');
      }
    });

    this.subscription.add(sub);
  }

  private mostrarError(mensaje: string): void {
    this.hasError = true;
    this.errorMessage = mensaje;
    this.isLoading = false;
    
    // ✅ NO CARGAR DATOS POR DEFECTO - Mostrar el error
    console.log('🚫 No se cargarán datos por defecto. Mostrando error al usuario.');
  }

  private procesarDatos(data: EstadisticasPromociones): void {
    console.log('🔄 Procesando datos recibidos...');
    
    try {
      this.configurarGraficoBarras(data);
      this.configurarGraficoDoughnut(data);
      this.configurarGraficoBarrasHorizontales(data);
      this.configurarKPIs(data);
      
      console.log('✅ Todos los gráficos configurados correctamente');
    } catch (error) {
      console.error('❌ Error procesando datos:', error);
      this.mostrarError('Error al procesar los datos recibidos');
    }
  }

  private configurarGraficoBarras(data: EstadisticasPromociones): void {
    const ventas = data.ventas_por_promocion || [];
    console.log('📊 Configurando gráfico de barras con:', ventas);
    
    if (ventas.length === 0) {
      console.log('⚠️ No hay datos de ventas por promoción');
      this.barChartData = {
        labels: ['Sin datos'],
        datasets: [{
          data: [0],
          backgroundColor: ['#e0e0e0'],
          borderColor: ['#e0e0e0'],
          borderWidth: 1
        }]
      };
      return;
    }
    
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
    const activas = data.promociones_activas || 0;
    const inactivas = data.promociones_inactivas || 0;
    
    console.log('🍩 Configurando gráfico doughnut - Activas:', activas, 'Inactivas:', inactivas);
    
    this.doughnutChartData = {
      labels: ['Activas', 'Inactivas'],
      datasets: [
        {
          data: [activas, inactivas],
          backgroundColor: ['#28a745', '#dc3545'],
          borderColor: ['#28a745', '#dc3545'],
          borderWidth: 2
        }
      ]
    };
  }

  private configurarGraficoBarrasHorizontales(data: EstadisticasPromociones): void {
    const promociones = data.promociones_mas_usadas || [];
    console.log('📊 Configurando gráfico horizontal con:', promociones);

    if (promociones.length === 0) {
      console.log('⚠️ No hay datos de promociones más usadas');
      this.horizontalBarChartData = {
        labels: ['Sin datos'],
        datasets: [{
          data: [0],
          backgroundColor: ['#e0e0e0'],
          borderColor: ['#e0e0e0'],
          borderWidth: 1
        }]
      };
      return;
    }

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
    this.porcentajeUsuarios = Math.round(data.porcentaje_usuarios_promocion || 0);
    this.ingresoAdicional = data.ingresos_adicionales || 0;
    
    console.log('📈 KPIs configurados - Porcentaje usuarios:', this.porcentajeUsuarios, 'Ingresos adicionales:', this.ingresoAdicional);
  }

  reintentarCarga(): void {
    console.log('🔄 Reintentando cargar estadísticas...');
    this.cargarEstadisticas();
  }

  volver(): void {
    this.router.navigate(['/administrador/gestion-promociones']);
  }
}