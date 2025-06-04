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

// Actualizar la interface para ser más realista
interface Establecimiento {
  id: number;
  nombre: string;
  direccion: string; // Dirección específica
  provincia: string; // Para filtros
  ciudad: string; // Información adicional
  telefono: string;
  estado: 'activo' | 'inactivo';
}

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

  // Datos de ejemplo con más establecimientos
  establecimientos: Establecimiento[] = [
    {
      id: 1,
      nombre: 'Burguer King Centro',
      direccion: '9 de Octubre y Malecón 2000',
      provincia: 'Guayas',
      ciudad: 'Guayaquil',
      telefono: '0995842167',
      estado: 'activo'
    },
    {
      id: 2,
      nombre: 'KFC Norte',
      direccion: 'Av. La Prensa y Eloy Alfaro',
      provincia: 'Pichincha',
      ciudad: 'Quito',
      telefono: '0987231940',
      estado: 'activo'
    },
    {
      id: 3,
      nombre: 'Pizza Hut Mall',
      direccion: 'Centro Comercial Portoviejo, Local 201',
      provincia: 'Manabí',
      ciudad: 'Portoviejo',
      telefono: '0961023589',
      estado: 'inactivo'
    },
    {
      id: 4,
      nombre: 'Subway Plaza',
      direccion: 'Av. Las Américas y 25 de Julio',
      provincia: 'Esmeraldas',
      ciudad: 'Esmeraldas',
      telefono: '0957684321',
      estado: 'inactivo'
    },
    {
      id: 5,
      nombre: 'Dominos Sur',
      direccion: 'Av. Pedro Menéndez Gilbert y Francisco de Orellana',
      provincia: 'Guayas',
      ciudad: 'Guayaquil',
      telefono: '0974519038',
      estado: 'activo'
    },
    {
      id: 6,
      nombre: 'Telepizza Centro',
      direccion: 'Av. Amazonas y Jorge Washington',
      provincia: 'Pichincha',
      ciudad: 'Quito',
      telefono: '0942037816',
      estado: 'inactivo'
    },
    {
      id: 7,
      nombre: 'Papa Johns Mall',
      direccion: 'Centro Comercial El Bosque, Local 45',
      provincia: 'Manabí',
      ciudad: 'Portoviejo',
      telefono: '0998376204',
      estado: 'activo'
    }
  ];

  establecimientosFiltrados: Establecimiento[] = [];
  filtroEstado: string = '';
  filtroProvincia: string = '';
  textoBusqueda: string = '';

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.establecimientosFiltrados = [...this.establecimientos];
  }

  // Método de filtros actualizado
  aplicarFiltros(): void {
    this.establecimientosFiltrados = this.establecimientos.filter(establecimiento => {
      const cumpleFiltroEstado = !this.filtroEstado || establecimiento.estado === this.filtroEstado;
      const cumpleFiltroProvincia = !this.filtroProvincia || establecimiento.provincia === this.filtroProvincia;

      // Búsqueda por texto en NOMBRE o CIUDAD (ya no en dirección)
      const cumpleBusquedaTexto = !this.textoBusqueda ||
        establecimiento.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()) ||
        establecimiento.ciudad.toLowerCase().includes(this.textoBusqueda.toLowerCase());

      return cumpleFiltroEstado && cumpleFiltroProvincia && cumpleBusquedaTexto;
    });

    console.log('Filtros aplicados:', {
      filtroEstado: this.filtroEstado,
      filtroProvincia: this.filtroProvincia,
      textoBusqueda: this.textoBusqueda,
      resultados: this.establecimientosFiltrados.length
    });
  }

  editarEstablecimiento(establecimiento: Establecimiento): void {
    console.log('Editar establecimiento:', establecimiento);

    // Aquí puedes navegar a la página de edición
    // this.router.navigate(['/administrador/establecimientos/editar', establecimiento.id]);

    alert(`Funcionalidad de edición para "${establecimiento.nombre}" en desarrollo.`);
  }

  // Método que abre el diálogo de confirmación
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
      } else {
        console.log('❌ Eliminación cancelada');
      }
    });
  }

  // Método privado que realiza la eliminación
  private eliminarEstablecimiento(establecimiento: Establecimiento): void {
    console.log('🗑️ Eliminando establecimiento:', establecimiento);

    // Eliminar de la lista local
    this.establecimientos = this.establecimientos.filter(e => e.id !== establecimiento.id);

    // Aquí puedes agregar la lógica para eliminar en el backend
    // this.establecimientoService.eliminar(establecimiento.id).subscribe(...);

    console.log(`Establecimiento "${establecimiento.nombre}" eliminado exitosamente.`);

    // Reaplicar filtros para actualizar la vista
    this.aplicarFiltros();
  }
}
