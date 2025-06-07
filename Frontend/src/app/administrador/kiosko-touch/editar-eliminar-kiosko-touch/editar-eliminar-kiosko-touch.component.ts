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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// ✅ IMPORTAR LA INTERFAZ DESDE EL ARCHIVO SEPARADO:
import { KioscoTouch } from '../../../models/kiosco-touch-editar.model';

// ❌ ELIMINAR LA INTERFAZ LOCAL:
// interface KioscoTouch {
//   id: number;
//   nombre: string;
//   token: string;
//   estado: string;
//   establecimiento?: {
//     id: number;
//     nombre: string;
//   } | null;
// }

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
    MatSlideToggleModule,
    MatInputModule,
    RouterModule,
    FooterAdminComponent,
    HeaderAdminComponent
  ]
})
export class EditarEliminarKioskoTouchComponent implements OnInit {
  kioscos: KioscoTouch[] = [];
  kioscosFiltrados: KioscoTouch[] = [];
  filtroEstado: string = '';
  filtroEstablecimiento: string = '';
  textoBusqueda: string = '';
  loading = false;

  constructor(
    private dialog: MatDialog,
    private kioskoTouchService: KioskoTouchService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarKioscos();
  }

  cargarKioscos(): void {
    this.loading = true;
    this.kioskoTouchService.obtenerKioscosTouch().subscribe({
      next: (data) => {
        this.kioscos = data;
        this.kioscosFiltrados = [...data];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al cargar kioscos:', error);
        alert('Error al cargar kioscos');
      }
    });
  }

  aplicarFiltros(): void {
    this.kioscosFiltrados = this.kioscos.filter(kiosco => {
      const cumpleFiltroEstado = !this.filtroEstado || kiosco.estado === this.filtroEstado;
      const cumpleFiltroEstablecimiento = !this.filtroEstablecimiento || 
        (kiosco.establecimiento && kiosco.establecimiento.nombre === this.filtroEstablecimiento);
      const cumpleBusquedaTexto = !this.textoBusqueda ||
        kiosco.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()) ||
        (kiosco.establecimiento && kiosco.establecimiento.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()));
      
      return cumpleFiltroEstado && cumpleFiltroEstablecimiento && cumpleBusquedaTexto;
    });
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
    this.kioskoTouchService.eliminarKioscoTouch(kiosco.id).subscribe({
      next: () => {
        this.kioscos = this.kioscos.filter(k => k.id !== kiosco.id);
        this.aplicarFiltros();
        alert(`Kiosco "${kiosco.nombre}" eliminado exitosamente.`);
      },
      error: (error) => {
        console.error('Error al eliminar kiosco:', error);
        alert('Error al eliminar el kiosco.');
      }
    });
  }

  cambiarEstado(kiosco: KioscoTouch, event: any): void {
    const nuevoEstado = event.checked ? 'activo' : 'inactivo';
    kiosco.estado = nuevoEstado;

    console.log(`Estado de ${kiosco.nombre} cambiado a: ${nuevoEstado}`);

    this.aplicarFiltros();
  }
}