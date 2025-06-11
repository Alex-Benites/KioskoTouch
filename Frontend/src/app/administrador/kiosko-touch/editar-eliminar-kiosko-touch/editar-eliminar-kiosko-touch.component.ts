import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule, Router } from '@angular/router';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { KioskoTouchService } from '../../../services/kiosko-touch.service';
import { EstablecimientosService } from '../../../services/establecimientos.service'; // ✅ AGREGAR
import { KioscoTouch } from '../../../models/kiosco-touch-editar.model';
@Component({
  selector: 'app-editar-eliminar-kiosko-touch',
  templateUrl: './editar-eliminar-kiosko-touch.component.html',
  styleUrls: ['./editar-eliminar-kiosko-touch.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    RouterModule,
    FooterAdminComponent,
    HeaderAdminComponent
  ]
})
export class EditarEliminarKioskoTouchComponent implements OnInit {
  kioscos: any[] = [];
  kioscosFiltrados: any[] = [];
  filtroEstado: string = '';
  filtroEstablecimiento: string = '';
  establecimientos: any[] = [];
  loading: boolean = false;

  constructor(
    private dialog: MatDialog,
    private kioscoTouchService: KioskoTouchService,
    private establecimientosService: EstablecimientosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEstablecimientos();
    this.cargarKioscos();
  }

  cargarEstablecimientos(): void {
    console.log('🔄 Cargando establecimientos...');
    this.establecimientosService.obtenerEstablecimientos().subscribe({
      next: (data: any[]) => {
        this.establecimientos = data;
        console.log('✅ Establecimientos cargados:', this.establecimientos);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar establecimientos:', error);
        this.establecimientos = [];
      }
    });
  }

  cargarKioscos(): void {
    this.loading = true;
    // ✅ CORREGIR: Usar el método correcto del servicio
    this.kioscoTouchService.obtenerKioscosTouch().subscribe({
      next: (data: any[]) => {
        this.kioscos = data;
        this.kioscosFiltrados = [...data];
        this.loading = false;
        console.log('✅ Kioscos cargados:', this.kioscos);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar kioscos:', error);
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros:', {
      filtroEstado: this.filtroEstado,
      filtroEstablecimiento: this.filtroEstablecimiento
    });

    this.kioscosFiltrados = this.kioscos.filter(kiosco => {
      // Filtro por estado
      const estadoKiosco = this.getEstadoNombre(kiosco);
      const cumpleEstado = !this.filtroEstado ||
                          estadoKiosco.toLowerCase() === this.filtroEstado.toLowerCase();

      // ✅ CORREGIR: Filtro por establecimiento
      const establecimientoId = kiosco.establecimiento?.id;

      // Convertir ambos a string y hacer comparación estricta
      const cumpleEstablecimiento = !this.filtroEstablecimiento ||
                                   String(establecimientoId) === String(this.filtroEstablecimiento);

      console.log(`Kiosco ${kiosco.nombre}:`);
      console.log(`  Estado: "${estadoKiosco}" vs filtro: "${this.filtroEstado}" = ${cumpleEstado}`);
      console.log(`  Establecimiento: "${establecimientoId}" (${typeof establecimientoId}) vs filtro: "${this.filtroEstablecimiento}" (${typeof this.filtroEstablecimiento}) = ${cumpleEstablecimiento}`);

      const resultado = cumpleEstado && cumpleEstablecimiento;
      console.log(`  ✅ Resultado final: ${resultado}`);

      return resultado;
    });

    console.log('🎯 Total kioscos filtrados:', this.kioscosFiltrados.length);
  }

  editarKiosco(kiosco: KioscoTouch): void {
    console.log('🚀 Navegando a editar kiosco:', kiosco.id);
    this.router.navigate(['/administrador/gestion-kiosko-touch/crear', kiosco.id]);
  }

  abrirDialogoEliminar(kiosco: KioscoTouch): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'kiosco',
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eliminarKiosco(kiosco);
      }
    });
  }

  eliminarKiosco(kiosco: KioscoTouch): void {
    // ✅ CORREGIR: Nombre correcto del servicio
    this.kioscoTouchService.eliminarKioscoTouch(kiosco.id).subscribe({
      next: () => {
        this.kioscos = this.kioscos.filter(k => k.id !== kiosco.id);
        this.aplicarFiltros();
        console.log('✅ Kiosco eliminado correctamente');
      },
      error: (error: any) => {
        console.error('❌ Error al eliminar kiosco:', error);
        alert('Error al eliminar el kiosco.');
      }
    });
  }

  getEstadoNombre(kiosco: any): string {
    return typeof kiosco.estado === 'string' ? kiosco.estado : kiosco.estado?.nombre || '';
  }
}