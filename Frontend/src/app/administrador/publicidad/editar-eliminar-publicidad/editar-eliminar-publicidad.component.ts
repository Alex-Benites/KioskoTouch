import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';
import { PermissionDeniedDialogComponent } from '../../../shared/permission-denied-dialog/permission-denied-dialog.component';

import { PublicidadService } from '../../../services/publicidad.service';
import { AuthService } from '../../../services/auth.service';
import { Publicidad, ApiError } from '../../../models/marketing.model';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-editar-eliminar-publicidad',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    HeaderAdminComponent,
    FooterAdminComponent,
    RouterLink
  ],
  templateUrl: './editar-eliminar-publicidad.component.html',
  styleUrls: ['./editar-eliminar-publicidad.component.scss']
})
export class EditarEliminarPublicidadComponent implements OnInit {

  filtroForm!: FormGroup;
  todasLasPublicidades: Publicidad[] = [];
  publicidadesFiltradas: Publicidad[] = [];
  isLoading: boolean = false;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private publicidadService = inject(PublicidadService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.initializeForm();
    this.cargarPublicidades();
  }

  private initializeForm(): void {
    this.filtroForm = this.fb.group({
      tipoBanner: [false],
      tipoVideo: [false],
      estadoActivo: [false],
      estadoInactivo: [false]
    });
  }

  cargarPublicidades(): void {
    this.isLoading = true;
    
    this.publicidadService.getPublicidades().subscribe({
      next: (data) => {
        
        this.todasLasPublicidades = data;
        this.publicidadesFiltradas = [...this.todasLasPublicidades];
        this.isLoading = false;
        
        this.mostrarEstadisticas();
      },
      error: (error: ApiError) => {
        alert('❌ No se pudieron cargar las publicidades.');
        this.isLoading = false;
      }
    });
  }

  private mostrarEstadisticas(): void {
    const stats = {
      total: this.todasLasPublicidades.length,
      banners: this.todasLasPublicidades.filter(p => p.tipo_publicidad === 'banner').length,
      videos: this.todasLasPublicidades.filter(p => p.tipo_publicidad === 'video').length,
      activos: this.todasLasPublicidades.filter(p => p.estado_nombre === 'Activado').length,
      inactivos: this.todasLasPublicidades.filter(p => p.estado_nombre === 'Desactivado').length
    };
    
  }

  aplicarFiltros(): void {
    this.isLoading = true;
    
    const filtros = this.filtroForm.value;

    this.publicidadesFiltradas = this.todasLasPublicidades.filter(publicidad => {
      const coincideTipo = this.verificarFiltroTipo(publicidad, filtros);
      const coincideEstado = this.verificarFiltroEstado(publicidad, filtros);
      const coincide = coincideTipo && coincideEstado;
      
      if (coincide) {
      }
      
      return coincide;
    });
    
    this.isLoading = false;
  }

  private verificarFiltroTipo(publicidad: Publicidad, filtros: any): boolean {
    const hayFiltroTipo = filtros.tipoBanner || filtros.tipoVideo;
    
    if (!hayFiltroTipo) {
      return true;
    }
    
    const esBanner = filtros.tipoBanner && publicidad.tipo_publicidad === 'banner';
    const esVideo = filtros.tipoVideo && publicidad.tipo_publicidad === 'video';
    
    return esBanner || esVideo;
  }

  private verificarFiltroEstado(publicidad: Publicidad, filtros: any): boolean {
    const hayFiltroEstado = filtros.estadoActivo || filtros.estadoInactivo;
    
    if (!hayFiltroEstado) {
      return true;
    }
    
    const esActivo = filtros.estadoActivo && publicidad.estado_nombre === 'Activado';
    const esInactivo = filtros.estadoInactivo && publicidad.estado_nombre === 'Desactivado';
    
    return esActivo || esInactivo;
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      tipoBanner: false,
      tipoVideo: false,
      estadoActivo: false,
      estadoInactivo: false
    });
    this.publicidadesFiltradas = [...this.todasLasPublicidades];
  }

  editarPublicidad(id: number): void {
    
    if (!this.authService.hasPermission('marketing.change_appkioskopublicidades')) {
      this.mostrarDialogoSinPermisos();
      return;
    }

    this.router.navigate(['/administrador/gestion-publicidad/crear', id]);
  }

  confirmarEliminacion(id: number, nombre: string): void {
    
    if (!this.authService.hasPermission('marketing.delete_appkioskopublicidades')) {
      this.mostrarDialogoSinPermisos();
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        itemType: 'publicidad',
      } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eliminarPublicidad(id, nombre);
      } else {
      }
    });
  }

  eliminarPublicidad(id: number, nombre: string): void {
    this.isLoading = true;
    
    this.publicidadService.deletePublicidad(id).subscribe({
      next: () => {
        
        // Remover de la lista local
        this.todasLasPublicidades = this.todasLasPublicidades.filter(p => p.id !== id);
        this.publicidadesFiltradas = this.publicidadesFiltradas.filter(p => p.id !== id);
        this.isLoading = false;

        // Sin dialog de éxito - eliminación silenciosa
      },
      error: (error: ApiError) => {
        this.isLoading = false;

        let mensajeError = '❌ Error al eliminar la publicidad.';
        if (error.status === 404) {
          mensajeError = '❌ La publicidad no existe o ya fue eliminada.';
        } else if (error.status === 403) {
          mensajeError = '❌ No tienes permisos para eliminar esta publicidad.';
        } else if (error.message) {
          mensajeError = `❌ ${error.message}`;
        }

        alert(mensajeError);
        this.cargarPublicidades();
      }
    });
  }

  private mostrarDialogoSinPermisos(): void {
    this.dialog.open(PermissionDeniedDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'permission-denied-dialog-panel'
    });
  }

  private mostrarDialogExito(title: string, message: string, buttonText: string = 'Continuar'): void {
    const dialogData: SuccessDialogData = {
      title,
      message,
      buttonText
    };

    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(() => {
      // La lista ya se actualizó localmente
    });
  }

  getMediaUrl(publicidad: Publicidad): string {
    if (publicidad.media_url) {
      if (publicidad.media_url.startsWith('/media/')) {
        return `${environment.baseUrl}${publicidad.media_url}`;
      }
      return publicidad.media_url;
    }
    return '';
  }

  isVideoFile(publicidad: Publicidad): boolean {
    return publicidad.media_type === 'video' && !!publicidad.media_url;
  }

  onMediaLoaded(event: Event): void {
  }

  onMediaError(event: Event): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  playVideo(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video && video.tagName === 'VIDEO') {
      video.play().catch(error => {
      });
    }
  }

  pauseVideo(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video && video.tagName === 'VIDEO') {
      video.pause();
      video.currentTime = 0;
    }
  }

  getTipoDisplayName(tipo: string): string {
    const tiposMap: { [key: string]: string } = {
      'banner': 'Banner',
      'video': 'Video'
    };
    return tiposMap[tipo] || tipo;
  }

  getEstadoDisplayName(estado: string | undefined): string {
    if (!estado) return 'Sin estado';
    
    const estadosMap: { [key: string]: string } = {
      'Activado': 'Activo',
      'Desactivado': 'Inactivo'
    };
    return estadosMap[estado] || estado;
  }

  getDuracionDisplay(publicidad: Publicidad): string {
    if (publicidad.tipo_publicidad === 'video' && publicidad.duracion_video) {
      const minutos = Math.floor(publicidad.duracion_video / 60);
      const segundos = publicidad.duracion_video % 60;
      return `${minutos}:${segundos.toString().padStart(2, '0')}`;
    }
    
    if (publicidad.tipo_publicidad === 'banner' && publicidad.tiempo_visualizacion) {
      if (publicidad.tiempo_visualizacion >= 60) {
        const minutos = Math.floor(publicidad.tiempo_visualizacion / 60);
        const segundos = publicidad.tiempo_visualizacion % 60;
        if (segundos > 0) {
          return `${minutos}m ${segundos}s`;
        }
        return `${minutos}m`;
      }
      return `${publicidad.tiempo_visualizacion}s`;
    }
    
    return '';
  }
}