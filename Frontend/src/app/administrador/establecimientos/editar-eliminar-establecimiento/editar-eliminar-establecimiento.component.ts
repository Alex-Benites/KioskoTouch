import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Agregar esta línea
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input'; // ✅ Agregar para el input
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { Establecimiento } from '../../../models/establecimiento.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editar-eliminar-establecimiento',
  templateUrl: './editar-eliminar-establecimiento.component.html',
  styleUrls: ['./editar-eliminar-establecimiento.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // ✅ Agregar FormsModule
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule, // ✅ Agregar MatInputModule
    RouterModule,
    FooterAdminComponent,
    HeaderAdminComponent
  ]
})
export class EditarEliminarEstablecimientoComponent implements OnInit {
  establecimientos: Establecimiento[] = [];
  establecimientosFiltrados: Establecimiento[] = [];
  filtroEstado: string = '';
  filtroProvincia: string = '';
  textoBusqueda: string = '';
  loading = false;

  constructor(
    private dialog: MatDialog,
    private establecimientosService: EstablecimientosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEstablecimientos();
  }


  editarEstablecimiento(establecimiento: Establecimiento): void {
    this.router.navigate(['/administrador/gestion-establecimientos/crear', establecimiento.id]);
  }

  cargarEstablecimientos(): void {
    this.loading = true;
    this.establecimientosService.obtenerEstablecimientos().subscribe({
      next: (data) => {
        this.establecimientos = data;
        this.establecimientosFiltrados = [...data];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        alert('Error al cargar establecimientos');
      }
    });
  }

  aplicarFiltros(): void {
    console.log('🔍 Filtro Estado:', this.filtroEstado);

    this.establecimientosFiltrados = this.establecimientos.filter(establecimiento => {
      // Usar acceso dinámico para evitar errores de TypeScript
      const establecimientoAny = establecimiento as any;

      // El estado viene como número desde el backend
      const estadoActual = establecimientoAny.estado;

      console.log(`🔍 Comparando: estadoActual="${estadoActual}" vs filtro="${this.filtroEstado}"`);

      // Filtro por estado - comparar como números
      const cumpleEstado = !this.filtroEstado ||
                           estadoActual.toString() === this.filtroEstado;

      // Filtro por provincia
      const cumpleProvincia = !this.filtroProvincia ||
                             establecimiento.provincia === this.filtroProvincia;

      // Filtro por texto
      const cumpleTexto = !this.textoBusqueda ||
                         establecimiento.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()) ||
                         establecimiento.ciudad.toLowerCase().includes(this.textoBusqueda.toLowerCase());

      const resultado = cumpleEstado && cumpleProvincia && cumpleTexto;
      console.log(`✅ ${establecimiento.nombre}: cumpleEstado=${cumpleEstado}, resultado final=${resultado}`);

      return resultado;
    });

    console.log('🎯 Total filtrados:', this.establecimientosFiltrados.length);
  }

  abrirDialogoEliminar(establecimiento: Establecimiento): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'establecimiento',
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eliminarEstablecimiento(establecimiento);
      }
    });
  }

  eliminarEstablecimiento(establecimiento: Establecimiento): void {
    this.establecimientosService.eliminarEstablecimiento(establecimiento.id!).subscribe({
      next: () => {
        this.establecimientos = this.establecimientos.filter(e => e.id !== establecimiento.id);
        this.aplicarFiltros();

      },
      error: () => {
        alert('Error al eliminar el establecimiento.');
      }
    });
  }

  // Métodos helper para el estado
  obtenerEstadoTexto(establecimiento: any): string {
    return establecimiento.estado === 1 ? 'Activo' : 'Inactivo';
  }

  estaActivo(establecimiento: any): boolean {
    return establecimiento.estado === 1;
  }

  estaInactivo(establecimiento: any): boolean {
    return establecimiento.estado === 2;
  }
}