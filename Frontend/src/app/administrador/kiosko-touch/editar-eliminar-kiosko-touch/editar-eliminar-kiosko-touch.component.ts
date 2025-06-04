import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

interface KioscoTouch {
  id: number;
  nombre: string;
  token: string;
  establecimiento: string;
  estado: 'activo' | 'inactivo';
}

@Component({
  selector: 'app-editar-eliminar-kiosko-touch',
  templateUrl: './editar-eliminar-kiosko-touch.component.html',
  styleUrls: ['./editar-eliminar-kiosko-touch.component.scss'],
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
export class EditarEliminarKioskoTouchComponent implements OnInit {

  // Datos de ejemplo
  kioscos: KioscoTouch[] = [
    { id: 1, nombre: 'Kiosco Sur', token: '012345678', establecimiento: 'Local 1: Sur', estado: 'activo' },
    { id: 2, nombre: 'Kiosco Norte', token: '012345678', establecimiento: 'Local 2: Norte', estado: 'activo' },
    { id: 3, nombre: 'Kiosco Centro', token: '012345678', establecimiento: 'Local 3: Centro', estado: 'inactivo' },
    { id: 4, nombre: 'Kiosco Plaza', token: '012345678', establecimiento: 'Local 4: Sur', estado: 'inactivo' },
    { id: 5, nombre: 'Kiosco Mall', token: '012345678', establecimiento: 'Local 5: Centro', estado: 'activo' },
    { id: 6, nombre: 'Kiosco Express', token: '012345678', establecimiento: 'Local 1: Sur', estado: 'inactivo' },
    { id: 7, nombre: 'Kiosco Plus', token: '012345678', establecimiento: 'Local 2: Norte', estado: 'activo' }
  ];

  kioscosFiltrados: KioscoTouch[] = [];
  filtroEstado: string = '';
  filtroEstablecimiento: string = '';

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.kioscosFiltrados = [...this.kioscos];
  }

  aplicarFiltros(): void {
    this.kioscosFiltrados = this.kioscos.filter(kiosco => {
      const cumpleFiltroEstado = !this.filtroEstado || kiosco.estado === this.filtroEstado;
      const cumpleFiltroEstablecimiento = !this.filtroEstablecimiento || kiosco.establecimiento === this.filtroEstablecimiento;

      return cumpleFiltroEstado && cumpleFiltroEstablecimiento;
    });

    console.log('Filtros aplicados:', {
      filtroEstado: this.filtroEstado,
      filtroEstablecimiento: this.filtroEstablecimiento,
      resultados: this.kioscosFiltrados.length
    });
  }

  cambiarEstado(kiosco: KioscoTouch, event: any): void {
    const nuevoEstado = event.checked ? 'activo' : 'inactivo';
    kiosco.estado = nuevoEstado;

    console.log(`Estado de ${kiosco.nombre} cambiado a: ${nuevoEstado}`);

    // Aquí puedes agregar la lógica para actualizar en el backend
    // this.kioscoService.actualizarEstado(kiosco.id, nuevoEstado).subscribe(...);

    this.aplicarFiltros();
  }

  editarKiosco(kiosco: KioscoTouch): void {
    console.log('Editar kiosco:', kiosco);

    // Aquí puedes navegar a la página de edición
    // this.router.navigate(['/administrador/kiosko-touch/editar', kiosco.id]);

    alert(`Funcionalidad de edición para "${kiosco.nombre}" en desarrollo.`);
  }

  // Método que abre el diálogo de confirmación
  abrirDialogoEliminar(kiosco: KioscoTouch): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'kiosco', // Cambiar a 'kiosco'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eliminarKiosco(kiosco);
      } else {
        console.log('❌ Eliminación cancelada');
      }
    });
  }

  // Método privado que realiza la eliminación
  private eliminarKiosco(kiosco: KioscoTouch): void {
    console.log('🗑️ Eliminando kiosco:', kiosco);

    // Eliminar de la lista local
    this.kioscos = this.kioscos.filter(k => k.id !== kiosco.id);

    // Aquí puedes agregar la lógica para eliminar en el backend
    // this.kioscoService.eliminar(kiosco.id).subscribe(...);

    console.log(`Kiosco "${kiosco.nombre}" eliminado exitosamente.`);

    // Reaplicar filtros para actualizar la vista
    this.aplicarFiltros();
  }
}
