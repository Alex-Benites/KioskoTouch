import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Para diálogos de confirmación

// Angular Material Modules
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Shared Components
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
// import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component'; // Si tienes un diálogo genérico

// Services (Asegúrate de crear este servicio)
// import { PublicidadService } from '../../../services/publicidad.service';

// Models (Opcional, pero recomendado)
export interface PublicidadCard { // Define una interfaz básica para tus datos
  id: number;
  nombre: string;
  descripcion?: string;
  tipo?: string; // 'banner', 'slider', 'video', 'popup'
  estado?: string; // 'activo', 'inactivo'
  imagenUrl?: string;
  // Agrega más campos según necesites
}

@Component({
  selector: 'app-editar-eliminar-publicidad',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    // MatDialogModule, // Descomentar si usarás diálogos
    HeaderAdminComponent,
    FooterAdminComponent,
    // ConfirmationDialogComponent // Si es standalone y lo usas
  ],
  templateUrl: './editar-eliminar-publicidad.component.html',
  styleUrls: ['./editar-eliminar-publicidad.component.scss']
})
export class EditarEliminarPublicidadComponent implements OnInit {

  filtroForm!: FormGroup;
  todasLasPublicidades: PublicidadCard[] = []; // Datos originales del backend
  publicidadesFiltradas: PublicidadCard[] = []; // Datos mostrados después de filtrar
  isLoading: boolean = false;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  // private dialog = inject(MatDialog); // Descomentar si usarás diálogos
  // private publicidadService = inject(PublicidadService); // Descomentar cuando tengas el servicio

  constructor() { }

  ngOnInit(): void {
    this.initializeForm();
    this.cargarPublicidades();
  }

  private initializeForm(): void {
    this.filtroForm = this.fb.group({
      tipoBanner: [false],
      tipoSlider: [false],
      tipoVideo: [false],
      tipoPopUp: [false],
      estadoActivo: [false],
      estadoInactivo: [false]
    });

    // Opcional: aplicar filtros automáticamente al cambiar un checkbox
    // this.filtroForm.valueChanges.subscribe(() => this.aplicarFiltros());
  }

  cargarPublicidades(): void {
    this.isLoading = true;
    // Simulación de carga de datos (reemplazar con llamada al servicio)
    setTimeout(() => {
      this.todasLasPublicidades = [
        { id: 1, nombre: 'Publicidad Hamburguesa Feliz', descripcion: 'La mejor hamburguesa de la ciudad, ahora con descuento especial para ti. ¡No te la pierdas!', tipo: 'banner', estado: 'activo', imagenUrl: 'https://via.placeholder.com/600x338/FF6347/FFFFFF?Text=Banner+Comida+1' },
        { id: 2, nombre: 'Oferta Slider Electrónicos', descripcion: 'Descuentos increíbles en todos nuestros electrónicos. Solo por tiempo limitado.', tipo: 'slider', estado: 'activo', imagenUrl: 'https://via.placeholder.com/600x338/4682B4/FFFFFF?Text=Slider+Tech+2' },
        { id: 3, nombre: 'Video Promocional Viajes', descripcion: 'Descubre destinos soñados con nuestros paquetes turísticos. ¡Aventura te espera!', tipo: 'video', estado: 'inactivo', imagenUrl: 'https://via.placeholder.com/600x338/32CD32/FFFFFF?Text=Video+Viajes+3' },
        { id: 4, nombre: 'PopUp Nueva Colección Moda', descripcion: '¡Ya llegó! Explora la nueva colección de temporada. Estilo y elegancia.', tipo: 'popup', estado: 'activo', imagenUrl: 'https://via.placeholder.com/600x338/FFD700/000000?Text=PopUp+Moda+4' },
        { id: 5, nombre: 'Banner Deportes Extremos', descripcion: 'Adrenalina pura con nuestros equipos para deportes extremos. ¡Vive al límite!', tipo: 'banner', estado: 'inactivo', imagenUrl: 'https://via.placeholder.com/600x338/8A2BE2/FFFFFF?Text=Banner+Deportes+5' },
        { id: 6, nombre: 'Slider Restaurante Gourmet', descripcion: 'Experiencia culinaria única. Reserva tu mesa y deléitate con sabores inolvidables.', tipo: 'slider', estado: 'activo', imagenUrl: 'https://via.placeholder.com/600x338/FF8C00/FFFFFF?Text=Slider+Gourmet+6' },
      ];
      this.publicidadesFiltradas = [...this.todasLasPublicidades]; // Inicialmente mostrar todas
      this.isLoading = false;
    }, 1500);

    // Llamada real al servicio:
    // this.publicidadService.getPublicidades().subscribe({
    //   next: (data) => {
    //     this.todasLasPublicidades = data;
    //     this.publicidadesFiltradas = [...this.todasLasPublicidades];
    //     this.isLoading = false;
    //   },
    //   error: (err) => {
    //     console.error('Error al cargar publicidades:', err);
    //     this.mostrarError('No se pudieron cargar las publicidades.');
    //     this.isLoading = false;
    //   }
    // });
  }

  aplicarFiltros(): void {
    this.isLoading = true; // Opcional, para feedback visual si el filtrado es pesado
    const filtros = this.filtroForm.value;
    console.log('Aplicando filtros:', filtros);

    this.publicidadesFiltradas = this.todasLasPublicidades.filter(publi => {
      const coincideTipo =
        (!filtros.tipoBanner && !filtros.tipoSlider && !filtros.tipoVideo && !filtros.tipoPopUp) || // Si no hay filtro de tipo, todos pasan
        (filtros.tipoBanner && publi.tipo?.toLowerCase() === 'banner') ||
        (filtros.tipoSlider && publi.tipo?.toLowerCase() === 'slider') ||
        (filtros.tipoVideo && publi.tipo?.toLowerCase() === 'video') ||
        (filtros.tipoPopUp && publi.tipo?.toLowerCase() === 'popup');

      const coincideEstado =
        (!filtros.estadoActivo && !filtros.estadoInactivo) || // Si no hay filtro de estado, todos pasan
        (filtros.estadoActivo && publi.estado?.toLowerCase() === 'activo') ||
        (filtros.estadoInactivo && publi.estado?.toLowerCase() === 'inactivo');

      return coincideTipo && coincideEstado;
    });
    this.isLoading = false; // Opcional
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      tipoBanner: false,
      tipoSlider: false,
      tipoVideo: false,
      tipoPopUp: false,
      estadoActivo: false,
      estadoInactivo: false
    });
    this.publicidadesFiltradas = [...this.todasLasPublicidades]; // Mostrar todas de nuevo
    console.log('Filtros limpiados');
  }

  editarPublicidad(id: number): void {
    console.log('Editar publicidad con ID:', id);
    this.router.navigate(['/administrador/gestion-publicidad/editar', id]); // Ajusta la ruta de edición
  }

  confirmarEliminacion(id: number, nombre: string): void {
    console.log('Eliminar publicidad con ID:', id, 'Nombre:', nombre);
    // Aquí implementarías la lógica con MatDialog si lo deseas
    // const dialogData: ConfirmationDialogData = {
    //   title: 'Confirmar Eliminación',
    //   message: `¿Estás seguro de que deseas eliminar la publicidad "${nombre}"? Esta acción no se puede deshacer.`,
    //   confirmButtonText: 'Eliminar',
    //   cancelButtonText: 'Cancelar'
    // };
    // const dialogRef = this.dialog.open(ConfirmationDialogComponent, { data: dialogData, width: '400px' });
    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     this.procederEliminacion(id);
    //   }
    // });

    // Simulación de confirmación directa (sin diálogo)
    if (confirm(`¿Estás seguro de que deseas eliminar la publicidad "${nombre}"?`)) {
      this.procederEliminacion(id);
    }
  }

  private procederEliminacion(id: number): void {
    this.isLoading = true;
    // this.publicidadService.eliminarPublicidad(id).subscribe({
    //   next: () => {
    //     this.mostrarExito('Publicidad eliminada correctamente.');
    //     this.cargarPublicidades(); // Recargar la lista
    //     this.isLoading = false;
    //   },
    //   error: (err) => {
    //     console.error('Error al eliminar publicidad:', err);
    //     this.mostrarError('No se pudo eliminar la publicidad.');
    //     this.isLoading = false;
    //   }
    // });

    // Simulación de eliminación
    console.log('Procediendo a eliminar ID:', id);
    setTimeout(() => {
      this.todasLasPublicidades = this.todasLasPublicidades.filter(p => p.id !== id);
      this.aplicarFiltros(); // Re-aplicar filtros sobre la lista modificada
      this.mostrarExito('Publicidad eliminada correctamente (simulación).');
      this.isLoading = false;
    }, 1000);
  }


  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'OK', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}