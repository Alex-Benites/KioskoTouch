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
import { PantallaCocinaService } from '../../../services/pantalla-cocina.service';
import { PantallaCocina } from '../../../models/pantalla-cocina-editar.model';


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
  pantallas: PantallaCocina[] = [];
  pantallasFiltradas: PantallaCocina[] = [];
  filtroEstado: string = '';
  filtroKiosco: string = '';
  textoBusqueda: string = '';
  loading = false;

  constructor(
    private dialog: MatDialog,
    private pantallaCocinaService: PantallaCocinaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPantallas();
  }

  cargarPantallas(): void {
    this.loading = true;
    this.pantallaCocinaService.obtenerPantallasCocina().subscribe({
      next: (data) => {
        this.pantallas = data;
        this.pantallasFiltradas = [...data];
        this.loading = false;
        console.log('✅ Pantallas cargadas:', this.pantallas.length);
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error al cargar pantallas:', error);
        alert('Error al cargar pantallas');
        this.pantallas = [];
        this.pantallasFiltradas = [];
      }
    });
  }

  aplicarFiltros(): void {
    this.pantallasFiltradas = this.pantallas.filter(pantalla => {
      const cumpleFiltroEstado = !this.filtroEstado || pantalla.estado === this.filtroEstado;
      const cumpleFiltroKiosco = !this.filtroKiosco || 
        (pantalla.kiosco_touch && pantalla.kiosco_touch.nombre === this.filtroKiosco);
      const cumpleBusquedaTexto = !this.textoBusqueda ||
        pantalla.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()) ||
        (pantalla.kiosco_touch && pantalla.kiosco_touch.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()));
      
      return cumpleFiltroEstado && cumpleFiltroKiosco && cumpleBusquedaTexto;
    });
    
    console.log(`🔍 Filtros aplicados: ${this.pantallasFiltradas.length} de ${this.pantallas.length} pantallas`);
  }

  cambiarEstado(pantalla: PantallaCocina, event: any): void {
    const nuevoEstado = event.checked ? 'activo' : 'inactivo';
    const estadoAnterior = pantalla.estado;
    
    // Actualizar localmente primero
    pantalla.estado = nuevoEstado;

    console.log(`Estado de ${pantalla.nombre} cambiado a: ${nuevoEstado}`);

    // ✅ ACTUALIZAR EN EL BACKEND:
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
        // Revertir el cambio local si falla
        pantalla.estado = estadoAnterior;
        event.source.checked = estadoAnterior === 'activo';
        alert('Error al actualizar el estado de la pantalla');
      }
    });
  }

  editarPantalla(pantalla: PantallaCocina): void {
    console.log('🚀 Navegando a editar pantalla:', pantalla.id);
    this.router.navigate(['/administrador/gestion-pantallas-cocina/crear', pantalla.id]);
  }

  abrirDialogoEliminar(pantalla: PantallaCocina): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'pantalla',
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eliminarPantalla(pantalla);
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

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.filtroKiosco = '';
    this.textoBusqueda = '';
    this.pantallasFiltradas = [...this.pantallas];
    console.log('🧹 Filtros limpiados');
  }
}