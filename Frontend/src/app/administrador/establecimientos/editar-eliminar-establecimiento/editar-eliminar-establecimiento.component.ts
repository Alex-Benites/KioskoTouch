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
    this.establecimientosFiltrados = this.establecimientos.filter(establecimiento => {
      // ✅ MEJOR: Usar estado_nombre si el backend lo devuelve
      const cumpleFiltroEstado = !this.filtroEstado || 
        (establecimiento.estado_nombre && establecimiento.estado_nombre === this.filtroEstado);
      
      const cumpleFiltroProvincia = !this.filtroProvincia || establecimiento.provincia === this.filtroProvincia;
      
      const cumpleBusquedaTexto = !this.textoBusqueda ||
        establecimiento.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()) ||
        establecimiento.ciudad.toLowerCase().includes(this.textoBusqueda.toLowerCase());
        
      return cumpleFiltroEstado && cumpleFiltroProvincia && cumpleBusquedaTexto;
    });
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
        alert(`Establecimiento "${establecimiento.nombre}" eliminado exitosamente.`);
      },
      error: () => {
        alert('Error al eliminar el establecimiento.');
      }
    });
  }
}