import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { EstadisticasService } from '../../../services/estadisticas.service';

// Importar ng2-charts
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';

// Interfaces locales
interface EstadisticasPromociones {
  ventas_por_promocion: VentaPromocion[];
  promociones_activas: number;
  promociones_inactivas: number;
  promociones_mas_usadas: PromocionMasUsada[];
  porcentaje_usuarios_promocion: number;
  total_descuentos_aplicados: number;
  total_pedidos_sistema: number;
  total_pedidos_periodo: number;
  pedidos_por_mes: PedidoPorMes[];
}

interface VentaPromocion {
  promocion__nombre: string;
  total_ventas: number;
  total_ingresos: number;
  tiene_productos: boolean;
  tiene_menus: boolean;
}

interface PromocionMasUsada {
  promocion__nombre: string;
  veces_usada: number;
}

interface PedidoPorMes {
  mes: string;
  mes_nombre: string;
  total_pedidos: number;
  pedidos_con_promocion: number;
  ingresos_totales: number;
  descuentos_aplicados: number;
  porcentaje_promocion: number;
}

interface ApiError {
  message: string;
  status: number;
  errors?: Array<{ field: string; message: string }>;
}

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

  barChartType: ChartType = 'bar';
  doughnutChartType: ChartType = 'doughnut';
  horizontalBarChartType: ChartType = 'bar';

  porcentajeUsuarios = 0;
  totalDescuentos = 0;
  totalPedidosSistema = 0;
  totalPedidosPeriodo = 0;
  
  pedidosPorMes: PedidoPorMes[] = [];

  private readonly colorPrincipal = '#D63031';
  private readonly colorInactivo = '#9E9E9E';

  private crearGradiente(ctx: CanvasRenderingContext2D, chartArea: any): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, '#B71C1C');
    gradient.addColorStop(0.5, this.colorPrincipal);
    gradient.addColorStop(1, '#E57373');
    return gradient;
  }

  constructor() {
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


    const sub = this.estadisticasService.getEstadisticasPromociones().subscribe({
      next: (data: EstadisticasPromociones) => {
        
        // ✅ VALIDAR QUE LLEGUEN DATOS
        if (!data || typeof data !== 'object') {
          this.mostrarError('Los datos recibidos del backend son inválidos');
          return;
        }

        this.procesarDatos(data);
        this.isLoading = false;
      },
      error: (error: ApiError) => {
        this.mostrarError(error.message || 'Error al conectar con el servidor');
      }
    });

    this.subscription.add(sub);
  }

  private mostrarError(mensaje: string): void {
    this.hasError = true;
    this.errorMessage = mensaje;
    this.isLoading = false;
    
  }

  private procesarDatos(data: EstadisticasPromociones): void {
    
    try {
      this.configurarGraficoBarras(data);
      this.configurarGraficoDoughnut(data);
      this.configurarGraficoBarrasHorizontales(data);
      this.configurarKPIs(data);
      this.configurarTablaMensual(data);
      
    } catch (error) {
      this.mostrarError('Error al procesar los datos recibidos');
    }
  }

  private configurarGraficoBarras(data: EstadisticasPromociones): void {
    const ventas = data.ventas_por_promocion || [];
    
    if (ventas.length === 0) {
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
    
    const coloresArray = Array(ventas.length).fill(this.colorPrincipal);
    
    this.barChartData = {
      labels: ventas.map(item => item.promocion__nombre),
      datasets: [
        {
          data: ventas.map(item => item.total_ventas),
          backgroundColor: coloresArray,
          borderColor: coloresArray,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    };
  }

  private configurarGraficoDoughnut(data: EstadisticasPromociones): void {
    const activas = data.promociones_activas || 0;
    const inactivas = data.promociones_inactivas || 0;
    
    
    this.doughnutChartData = {
      labels: ['Activas', 'Inactivas'],
      datasets: [
        {
          data: [activas, inactivas],
          backgroundColor: [this.colorPrincipal, this.colorInactivo],
          borderColor: [this.colorPrincipal, this.colorInactivo],
          borderWidth: 3
        }
      ]
    };
  }

  private configurarGraficoBarrasHorizontales(data: EstadisticasPromociones): void {
    const promociones = data.promociones_mas_usadas || [];

    if (promociones.length === 0) {
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

    const coloresArray = Array(promociones.length).fill(this.colorPrincipal);

    this.horizontalBarChartData = {
      labels: promociones.map(item => item.promocion__nombre),
      datasets: [
        {
          data: promociones.map(item => item.veces_usada),
          backgroundColor: coloresArray,
          borderColor: coloresArray,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    };
  }

  private configurarKPIs(data: EstadisticasPromociones): void {
    this.porcentajeUsuarios = Math.round(data.porcentaje_usuarios_promocion || 0);
    this.totalDescuentos = data.total_descuentos_aplicados || 0;
    this.totalPedidosSistema = data.total_pedidos_sistema || 0;
    this.totalPedidosPeriodo = data.total_pedidos_periodo || 0;
    
  }

  private configurarTablaMensual(data: EstadisticasPromociones): void {
    this.pedidosPorMes = data.pedidos_por_mes || [];
  }

  reintentarCarga(): void {
    this.cargarEstadisticas();
  }

  volver(): void {
    this.router.navigate(['/administrador/gestion-promociones']);
  }

  // Métodos para calcular totales de la tabla
  getTotalPedidos(): number {
    return this.pedidosPorMes.reduce((sum, mes) => sum + (mes.total_pedidos || 0), 0);
  }

  getTotalPromocion(): number {
    return this.pedidosPorMes.reduce((sum, mes) => sum + (mes.pedidos_con_promocion || 0), 0);
  }

  getPromedioPromocion(): number {
    if (this.pedidosPorMes.length === 0) return 0;
    const totalPromedio = this.pedidosPorMes.reduce((sum, mes) => sum + (mes.porcentaje_promocion || 0), 0);
    return Math.round(totalPromedio / this.pedidosPorMes.length * 100) / 100;
  }

  getTotalIngresos(): number {
    return this.pedidosPorMes.reduce((sum, mes) => sum + (mes.ingresos_totales || 0), 0);
  }
}