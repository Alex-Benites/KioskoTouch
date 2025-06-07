import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatSnackBarModule,
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
  private snackBar = inject(MatSnackBar);
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
        
        // ✅ DEBUG: Verificar que lleguen las URLs
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
        this.mostrarError('No se pudieron cargar las publicidades.');
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
    console.log('🗑️ Confirmar eliminación - ID:', id, 'Nombre:', nombre);
    
    const confirmacion = confirm(
      `¿Estás seguro de que deseas eliminar la publicidad "${nombre}"?\n\n` +
      `Esta acción no se puede deshacer.`
    );
    
    if (confirmacion) {
      this.procederEliminacion(id);
    }
  }

  private procederEliminacion(id: number): void {
    console.log('🗑️ Procediendo a eliminar publicidad ID:', id);
    this.isLoading = true;
    
    this.publicidadService.deletePublicidad(id).subscribe({
      next: () => {
        console.log('✅ Publicidad eliminada correctamente');
        this.mostrarExito('Publicidad eliminada correctamente.');
        this.cargarPublicidades();
      },
      error: (error: ApiError) => {
        console.error('❌ Error al eliminar publicidad:', error);
        this.mostrarError(error.message || 'No se pudo eliminar la publicidad.');
        this.isLoading = false;
      }
    });
  }

  // ✅ CORREGIDO: Sin hack de prueba, URLs directas del backend
  getMediaUrl(publicidad: Publicidad): string {
    if (publicidad.media_url) {
      if (publicidad.media_url.startsWith('/media/')) {
        return `${environment.baseUrl}${publicidad.media_url}`;
      }
      return publicidad.media_url;
    }
    return '';
  }

  // ✅ Método para verificar si es video
  isVideoFile(publicidad: Publicidad): boolean {
    return publicidad.media_type === 'video' && !!publicidad.media_url;
  }

  // ✅ Event handlers para media
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
      video.currentTime = 0; // Reinicia al inicio
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

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'OK', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}