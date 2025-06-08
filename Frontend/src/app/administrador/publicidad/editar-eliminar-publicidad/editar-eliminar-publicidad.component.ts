import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Shared Components
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';

// Services and Models
import { PublicidadService } from '../../../services/publicidad.service';
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
    FooterAdminComponent
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
    console.log('=== CARGANDO PUBLICIDADES ===');
    
    this.publicidadService.getPublicidades().subscribe({
      next: (data) => {
        console.log('✅ Publicidades cargadas:', data);
        
        data.forEach((pub, index) => {
          console.log(`🔍 Publicidad ${index + 1}:`, {
            id: pub.id,
            nombre: pub.nombre,
            media_type: pub.media_type,
            media_url: pub.media_url,
            duracion_video: pub.duracion_video
          });
        });
        
        this.todasLasPublicidades = data;
        this.publicidadesFiltradas = [...this.todasLasPublicidades];
        this.isLoading = false;
        
        console.log(`📊 Total publicidades: ${data.length}`);
        this.mostrarEstadisticas();
      },
      error: (error: ApiError) => {
        console.error('❌ Error al cargar publicidades:', error);
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
    
    console.log('📈 Estadísticas:', stats);
  }

  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros...');
    this.isLoading = true;
    
    const filtros = this.filtroForm.value;
    console.log('Filtros seleccionados:', filtros);

    this.publicidadesFiltradas = this.todasLasPublicidades.filter(publicidad => {
      const coincideTipo = this.verificarFiltroTipo(publicidad, filtros);
      const coincideEstado = this.verificarFiltroEstado(publicidad, filtros);
      const coincide = coincideTipo && coincideEstado;
      
      if (coincide) {
        console.log(`✅ Publicidad "${publicidad.nombre}" coincide con filtros`);
      }
      
      return coincide;
    });
    
    console.log(`🎯 Publicidades filtradas: ${this.publicidadesFiltradas.length}/${this.todasLasPublicidades.length}`);
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
    console.log('🧹 Limpiando filtros...');
    this.filtroForm.reset({
      tipoBanner: false,
      tipoVideo: false,
      estadoActivo: false,
      estadoInactivo: false
    });
    this.publicidadesFiltradas = [...this.todasLasPublicidades];
    console.log('✅ Filtros limpiados, mostrando todas las publicidades');
  }

  editarPublicidad(id: number): void {
    console.log('✏️ Editando publicidad ID:', id);
    this.router.navigate(['/administrador/gestion-publicidad/crear', id]);
  }

  confirmarEliminacion(id: number, nombre: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        itemType: 'publicidad',
      } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🗑️ Confirmado eliminar publicidad:', nombre);
        this.eliminarPublicidad(id, nombre);
      } else {
        console.log('🚫 Eliminación cancelada');
      }
    });
  }

eliminarPublicidad(id: number, nombre: string): void {
  console.log('🗑️ Eliminando publicidad ID:', id);
  this.isLoading = true;
  
  this.publicidadService.deletePublicidad(id).subscribe({
    next: () => {
      console.log('✅ Publicidad eliminada correctamente');
      
      // Remover de la lista local
      this.todasLasPublicidades = this.todasLasPublicidades.filter(p => p.id !== id);
      this.publicidadesFiltradas = this.publicidadesFiltradas.filter(p => p.id !== id);
      this.isLoading = false;

      // Sin dialog de éxito - eliminación silenciosa
    },
    error: (error: ApiError) => {
      console.error('❌ Error al eliminar publicidad:', error);
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
    console.log('✅ Media cargada correctamente:', event.target);
  }

  onMediaError(event: Event): void {
    console.error('❌ Error cargando media:', event.target);
    const target = event.target as HTMLElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  playVideo(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video && video.tagName === 'VIDEO') {
      video.play().catch(error => {
        console.log('No se pudo reproducir el video:', error);
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