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

  // Tipos de gráficos
  barChartType: ChartType = 'bar';
  doughnutChartType: ChartType = 'doughnut';
  horizontalBarChartType: ChartType = 'bar';

  // KPIs
  porcentajeUsuarios = 0;
  totalDescuentos = 0;
  totalPedidosSistema = 0;
  totalPedidosPeriodo = 0;
  
  // Tabla de pedidos por mes
  pedidosPorMes: PedidoPorMes[] = [];

  // Colores para los gráficos
  private readonly colores = [
    '#AC2125', '#8B1A1D', '#C9282C', '#D63031', '#E74C3C'
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
    
    console.log('🚫 No se cargarán datos por defecto. Mostrando error al usuario.');
  }

  private procesarDatos(data: EstadisticasPromociones): void {
    console.log('🔄 Procesando datos recibidos...');
    
    try {
      this.configurarGraficoBarras(data);
      this.configurarGraficoDoughnut(data);
      this.configurarGraficoBarrasHorizontales(data);
      this.configurarKPIs(data);
      this.configurarTablaMensual(data);
      
      console.log('✅ Todos los gráficos y tablas configurados correctamente');
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
    this.totalDescuentos = data.total_descuentos_aplicados || 0;
    this.totalPedidosSistema = data.total_pedidos_sistema || 0;
    this.totalPedidosPeriodo = data.total_pedidos_periodo || 0;
    
    console.log('📈 KPIs configurados:', {
      porcentajeUsuarios: this.porcentajeUsuarios,
      totalDescuentos: this.totalDescuentos,
      totalPedidosSistema: this.totalPedidosSistema,
      totalPedidosPeriodo: this.totalPedidosPeriodo
    });
  }

  private configurarTablaMensual(data: EstadisticasPromociones): void {
    this.pedidosPorMes = data.pedidos_por_mes || [];
    console.log('📅 Tabla mensual configurada:', this.pedidosPorMes.length, 'meses');
  }

  reintentarCarga(): void {
    console.log('🔄 Reintentando cargar estadísticas...');
    this.cargarEstadisticas();
  }

  volver(): void {
    this.router.navigate(['/administrador/gestion-promociones']);
  }
}