import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule, Router } from '@angular/router';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { PermissionDeniedDialogComponent } from '../../../shared/permission-denied-dialog/permission-denied-dialog.component';
import { PantallaCocinaService } from '../../../services/pantalla-cocina.service';
import { PantallaCocina } from '../../../models/pantalla-cocina-editar.model';
import { KioskoTouchService } from '../../../services/kiosko-touch.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-editar-eliminar-pantalla-cocina',
  templateUrl: './editar-eliminar-pantalla-cocina.component.html',
  styleUrls: ['./editar-eliminar-pantalla-cocina.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatInputModule,
    RouterModule,
    FooterAdminComponent,
    HeaderAdminComponent
  ]
})
export class EditarEliminarPantallaCocinaComponent implements OnInit {
  pantallas: any[] = [];
  pantallasFiltradas: any[] = [];
  filasExpandidas: any[] = [];
  kioscos: any[] = [];

  filtroEstado: string = '';
  filtroKiosco: string = '';
  loading: boolean = false;
  textoBusqueda: string = '';

  todasLasFilasExpandidas: any[] = [];

  constructor(
    private pantallaCocinaService: PantallaCocinaService,
    private kioskoTouchService: KioskoTouchService,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarKioscos();
    this.cargarPantallas();
  }

  cargarKioscos(): void {
    this.loading = true;
    this.kioskoTouchService.obtenerKioscosTouch().subscribe({
      next: (data: any) => {
        this.kioscos = data;
        this.loading = false;
        console.log('✅ Kioscos cargados para filtro:', this.kioscos);
      },
      error: (error: any) => {
        console.error('❌ Error cargando kioscos:', error);
        this.kioscos = [];
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.expandirTodasLasPantallas();

    let filasResultado = [...this.todasLasFilasExpandidas];

    if (this.filtroEstado && this.filtroEstado !== '') {
      filasResultado = filasResultado.filter(fila =>
        fila.pantalla.estado === this.filtroEstado  // ✅ CAMBIO: Sin toLowerCase() porque es exacto
      );
    }

    if (this.filtroKiosco && this.filtroKiosco !== '') {
      filasResultado = filasResultado.filter(fila =>
        fila.kiosco && fila.kiosco.id === parseInt(this.filtroKiosco)
      );
    }

    this.filasExpandidas = filasResultado;

    console.log('🔍 Filtros aplicados:', {
      estado: this.filtroEstado,
      kiosco: this.filtroKiosco,
      filasResultado: this.filasExpandidas.length
    });
  }

  expandirTodasLasPantallas(): void {
    this.todasLasFilasExpandidas = [];

    this.pantallas.forEach(pantalla => {
      if (pantalla.kioskos_asociados && pantalla.kioskos_asociados.length > 0) {
        pantalla.kioskos_asociados.forEach((kiosco: any) => {
          this.todasLasFilasExpandidas.push({
            pantalla: pantalla,
            kiosco: kiosco
          });
        });
      } else {
        this.todasLasFilasExpandidas.push({
          pantalla: pantalla,
          kiosco: null
        });
      }
    });
  }

  cargarPantallas(): void {
    this.loading = true;
    this.pantallaCocinaService.obtenerPantallasCocina().subscribe({
      next: (data: any) => {
        this.pantallas = data;
        this.expandirTodasLasPantallas();
        this.filasExpandidas = [...this.todasLasFilasExpandidas];
        this.loading = false;
        console.log('✅ Pantallas cargadas:', this.pantallas);
      },
      error: (error: any) => {
        console.error('❌ Error cargando pantallas:', error);
        this.filasExpandidas = [];
        this.loading = false;
      }
    });
  }

  expandirPantallasConKioscos(): void {
    this.filasExpandidas = [];

    this.pantallasFiltradas.forEach(pantalla => {
      if (pantalla.kioskos_asociados && pantalla.kioskos_asociados.length > 0) {
        pantalla.kioskos_asociados.forEach((kiosco: any) => {
          this.filasExpandidas.push({
            pantalla: pantalla,
            kiosco: kiosco
          });
        });
      } else {
        this.filasExpandidas.push({
          pantalla: pantalla,
          kiosco: null
        });
      }
    });
  }

  cambiarEstado(pantalla: PantallaCocina, event: any): void {
    const nuevoEstado = event.checked ? 'activo' : 'inactivo';
    const estadoAnterior = pantalla.estado;

    pantalla.estado = nuevoEstado;

    console.log(`Estado de ${pantalla.nombre} cambiado a: ${nuevoEstado}`);

    const datosActualizacion = {
      nombre: pantalla.nombre,
      token: pantalla.token,
      estado: nuevoEstado,
      kiosco_touch_asociado: pantalla.kiosco_touch ? pantalla.kiosco_touch.id : null
    };

    this.pantallaCocinaService.actualizarPantallaCocina(pantalla.id, datosActualizacion).subscribe({
      next: () => {
        console.log('✅ Estado actualizado en el backend');
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('❌ Error actualizando estado:', error);
        pantalla.estado = estadoAnterior;
        event.source.checked = estadoAnterior === 'activo';
        alert('Error al actualizar el estado de la pantalla');
      }
    });
  }

  editarPantalla(pantalla: PantallaCocina): void {
    console.log('🔧 Intentando editar pantalla:', pantalla.nombre);
    
    if (!this.authService.hasPermission('establecimientos.change_appkioskopantallascocina')) {
      console.log('❌ Sin permisos para editar pantallas de cocina');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, redirigiendo a edición');
    this.router.navigate(['/administrador/gestion-pantallas-cocina/crear', pantalla.id]);
  }

  abrirDialogoEliminar(pantalla: PantallaCocina): void {
    console.log('🗑️ Intentando eliminar pantalla:', pantalla.nombre);
    
    if (!this.authService.hasPermission('establecimientos.delete_appkioskopantallascocina')) {
      console.log('❌ Sin permisos para eliminar pantallas de cocina');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, mostrando confirmación');
    const dialogData: ConfirmationDialogData = {
      itemType: 'pantalla',
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Confirmado eliminar pantalla:', pantalla.nombre);
        this.eliminarPantalla(pantalla);
      } else {
        console.log('❌ Eliminación cancelada');
      }
    });
  }

  eliminarPantalla(pantalla: PantallaCocina): void {
    this.pantallaCocinaService.eliminarPantallaCocina(pantalla.id).subscribe({
      next: () => {
        this.pantallas = this.pantallas.filter(p => p.id !== pantalla.id);
        this.aplicarFiltros();
        alert(`Pantalla "${pantalla.nombre}" eliminada exitosamente.`);
      },
      error: (error) => {
        console.error('❌ Error al eliminar pantalla:', error);
        alert('Error al eliminar la pantalla.');
      }
    });
  }

  private mostrarDialogoSinPermisos(): void {
    console.log('🔒 Mostrando diálogo de sin permisos');
    this.dialog.open(PermissionDeniedDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'permission-denied-dialog-panel'
    });
  }

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.filtroKiosco = '';
    this.textoBusqueda = '';
    this.filasExpandidas = [...this.todasLasFilasExpandidas];
    console.log('🧹 Filtros limpiados');
  }

  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.filtroEstado = '';
    this.filtroKiosco = '';
    this.aplicarFiltros();
  }
}