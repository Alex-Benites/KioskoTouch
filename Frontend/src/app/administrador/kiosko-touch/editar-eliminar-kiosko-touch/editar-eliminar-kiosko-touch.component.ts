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
import { PermissionDeniedDialogComponent } from '../../../shared/permission-denied-dialog/permission-denied-dialog.component'; // ✅ AGREGADO
import { KioskoTouchService } from '../../../services/kiosko-touch.service';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { AuthService } from '../../../services/auth.service'; // ✅ AGREGADO
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
    private authService: AuthService, // ✅ AGREGADO
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
      const estadoKiosco = this.getEstadoNombre(kiosco);
      const cumpleEstado = !this.filtroEstado ||
                          estadoKiosco.toLowerCase() === this.filtroEstado.toLowerCase();

      const establecimientoId = kiosco.establecimiento?.id;
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
    console.log('🔧 Intentando editar kiosco:', kiosco.nombre);

    // ✅ AGREGADO: Validación de permisos para editar
    if (!this.authService.hasPermission('establecimientos.change_appkioskokioskostouch')) {
      console.log('❌ Sin permisos para editar kioscos touch');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, redirigiendo a edición');
    this.router.navigate(['/administrador/gestion-kiosko-touch/crear', kiosco.id]);
  }

  abrirDialogoEliminar(kiosco: KioscoTouch): void {
    console.log('🗑️ Intentando eliminar kiosco:', kiosco.nombre);

    // ✅ AGREGADO: Validación de permisos para eliminar
    if (!this.authService.hasPermission('establecimientos.delete_appkioskokioskostouch')) {
      console.log('❌ Sin permisos para eliminar kioscos touch');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, mostrando confirmación');
    const dialogData: ConfirmationDialogData = {
      itemType: 'kiosco',
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Confirmado eliminar kiosco:', kiosco.nombre);
        this.eliminarKiosco(kiosco);
      } else {
        console.log('❌ Eliminación cancelada');
      }
    });
  }

  // ✅ SOLUCIÓN DEFINITIVA: Usar el estado original directamente
  get kioscosActivos(): number {
    return this.kioscosFiltrados.filter(kiosco => {
      // ✅ Usar directamente el estado del objeto kiosco
      const estado = kiosco.estado;
      const esActivo = estado === "Activado";

      console.log(`${kiosco.nombre}: estado="${estado}", esActivo=${esActivo}`);
      return esActivo;
    }).length;
  }

  get kioscosInactivos(): number {
    return this.kioscosFiltrados.filter(kiosco => {
      // ✅ Usar directamente el estado del objeto kiosco
      const estado = kiosco.estado;
      const esInactivo = estado === "Desactivado";

      console.log(`${kiosco.nombre}: estado="${estado}", esInactivo=${esInactivo}`);
      return esInactivo;
    }).length;
  }

  eliminarKiosco(kiosco: KioscoTouch): void {
    this.loading = true; // ✅ MEJORAR: Agregar loading state
    this.kioscoTouchService.eliminarKioscoTouch(kiosco.id).subscribe({
      next: () => {
        this.kioscos = this.kioscos.filter(k => k.id !== kiosco.id);
        this.aplicarFiltros(); // ✅ Esto actualizará automáticamente los contadores
        this.loading = false;
        console.log('✅ Kiosco eliminado correctamente');
      },
      error: (error: any) => {
        console.error('❌ Error al eliminar kiosco:', error);
        this.loading = false;
        alert('Error al eliminar el kiosco.');
      }
    });
  }

  // ✅ AGREGADO: Método para mostrar diálogo sin permisos
  private mostrarDialogoSinPermisos(): void {
    console.log('🔒 Mostrando diálogo de sin permisos');
    this.dialog.open(PermissionDeniedDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'permission-denied-dialog-panel'
    });
  }


  getEstadoNombre(kiosco: any): string {
    return typeof kiosco.estado === 'string' ? kiosco.estado : kiosco.estado?.nombre || '';
  }
}