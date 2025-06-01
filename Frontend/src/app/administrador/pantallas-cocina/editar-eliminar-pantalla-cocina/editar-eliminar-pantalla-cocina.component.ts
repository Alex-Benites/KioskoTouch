import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog'; // Agregar
import { RouterModule } from '@angular/router';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component'; // Agregar

interface PantallaCocina {
  id: number;
  nombre: string;
  token: string;
  kiosco: string;
  estado: 'activo' | 'inactivo';
}

@Component({
  selector: 'app-editar-eliminar-pantalla-cocina',
  templateUrl: './editar-eliminar-pantalla-cocina.component.html',
  styleUrls: ['./editar-eliminar-pantalla-cocina.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    RouterModule,
    FooterAdminComponent,
    HeaderAdminComponent
  ]
})
export class EditarEliminarPantallaCocinaComponent implements OnInit {

  // Datos de ejemplo
  pantallas: PantallaCocina[] = [
    { id: 1, nombre: 'Cocina Sur', token: '012345678', kiosco: 'Kiosco 1', estado: 'activo' },
    { id: 2, nombre: 'Cocina Norte', token: '012345678', kiosco: 'Kiosco 2', estado: 'activo' },
    { id: 3, nombre: 'Cocina Urdesa', token: '012345678', kiosco: 'Kiosco 3', estado: 'inactivo' },
    { id: 4, nombre: 'Cocina Centro', token: '012345678', kiosco: 'Kiosco 4', estado: 'inactivo' },
    { id: 5, nombre: 'Cocina Sur', token: '012345678', kiosco: 'Kiosco 1', estado: 'activo' },
    { id: 6, nombre: 'Cocina Norte', token: '012345678', kiosco: 'Kiosco 2', estado: 'inactivo' },
    { id: 7, nombre: 'Cocina Urdesa', token: '012345678', kiosco: 'Kiosco 3', estado: 'activo' }
  ];

  pantallasFiltradas: PantallaCocina[] = [];
  filtroEstado: string = '';
  filtroKiosco: string = '';

  constructor(private dialog: MatDialog) {} // Inyectar MatDialog

  ngOnInit(): void {
    this.pantallasFiltradas = [...this.pantallas];
  }

  aplicarFiltros(): void {
    this.pantallasFiltradas = this.pantallas.filter(pantalla => {
      const cumpleFiltroEstado = !this.filtroEstado || pantalla.estado === this.filtroEstado;

      // Corregir el filtro de kiosco
      let cumpleFiltroKiosco = true;
      if (this.filtroKiosco) {
        // Mapear los valores del select a los textos reales en los datos
        const mapeoKioscos: { [key: string]: string } = {
          'kiosco1': 'Kiosco 1',
          'kiosco2': 'Kiosco 2',
          'kiosco3': 'Kiosco 3',
          'kiosco4': 'Kiosco 4'
        };

        const kioscoABuscar = mapeoKioscos[this.filtroKiosco] || this.filtroKiosco;
        cumpleFiltroKiosco = pantalla.kiosco === kioscoABuscar;
      }

      return cumpleFiltroEstado && cumpleFiltroKiosco;
    });

    console.log('Filtros aplicados:', {
      filtroEstado: this.filtroEstado,
      filtroKiosco: this.filtroKiosco,
      resultados: this.pantallasFiltradas.length
    });
  }

  cambiarEstado(pantalla: PantallaCocina, event: any): void {
    const nuevoEstado = event.checked ? 'activo' : 'inactivo';
    pantalla.estado = nuevoEstado;

    console.log(`Estado de ${pantalla.nombre} cambiado a: ${nuevoEstado}`);

    // Aquí puedes agregar la lógica para actualizar en el backend
    // this.pantallaService.actualizarEstado(pantalla.id, nuevoEstado).subscribe(...);

    this.aplicarFiltros();
  }

  editarPantalla(pantalla: PantallaCocina): void {
    console.log('Editar pantalla:', pantalla);

    // Aquí puedes navegar a la página de edición
    // this.router.navigate(['/administrador/pantallas-cocina/editar', pantalla.id]);

    alert(`Funcionalidad de edición para "${pantalla.nombre}" en desarrollo.`);
  }

  // Método que abre el diálogo de confirmación
  abrirDialogoEliminar(pantalla: PantallaCocina): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'pantalla', // Cambiar de 'usuario' a 'pantalla'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eliminarPantalla(pantalla);
      } else {
        console.log('❌ Eliminación cancelada');
      }
    });
  }

  // Método privado que realiza la eliminación
  private eliminarPantalla(pantalla: PantallaCocina): void {
    console.log('🗑️ Eliminando pantalla:', pantalla);

    // Eliminar de la lista local
    this.pantallas = this.pantallas.filter(p => p.id !== pantalla.id);

    // Aquí puedes agregar la lógica para eliminar en el backend
    // this.pantallaService.eliminar(pantalla.id).subscribe(...);

    console.log(`Pantalla "${pantalla.nombre}" eliminada exitosamente.`);

    // Reaplicar filtros para actualizar la vista
    this.aplicarFiltros();
  }
}
