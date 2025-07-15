import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { PublicidadService } from '../../services/publicidad.service';
import { Publicidad } from '../../models/marketing.model';

@Component({
  selector: 'app-publicidad-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publicidad-section.component.html',
  styleUrls: ['./publicidad-section.component.scss']
})
export class PublicidadSectionComponent implements OnInit, OnDestroy {
  @Input() altura: string = '200px';
  @Input() seccion?: string; 
  
  @Output() publicidadCambio = new EventEmitter<Publicidad>();

  publicidades: Publicidad[] = [];
  publicidadActual: Publicidad | null = null;
  indicePublicidadActual = 0;
  cargando = true;
  error: string | null = null;
  
  imagenActualIndex = 0;
  imagenesActuales: string[] = [];
  
  tiempoRestante = 0;
  intervalo: any = null;

  private subscription = new Subscription();

  constructor(private publicidadService: PublicidadService) {}

  ngOnInit(): void {
    this.cargarPublicidades();
  }

  ngOnDestroy(): void {
    this.detenerCarrusel();
    this.subscription.unsubscribe();
  }

  private cargarPublicidades(): void {
    this.cargando = true;
    this.error = null;

    this.subscription.add(
      this.publicidadService.getPublicidadesActivasParaCarrusel(undefined, this.seccion).subscribe({
        next: (publicidades) => {
          console.log('📺 Todas las publicidades recibidas:', publicidades);
          
          this.publicidades = publicidades.filter(pub => 
            pub.media_url || 
            (pub.media_urls && pub.media_urls.length > 0)
          );
          
          console.log('✅ Publicidades válidas:', this.publicidades.map(p => ({
            nombre: p.nombre,
            media_type: p.media_type,
            media_url: p.media_url,
            seccion: p.seccion
          })));
          
          if (this.publicidades.length > 0) {
            this.iniciarCarrusel();
          } else {
            this.publicidadActual = null;
          }
          
          this.cargando = false;
        },
        error: () => {
          this.error = 'Error cargando publicidades';
          this.cargando = false;
        }
      })
    );
  }

  private iniciarCarrusel(): void {
    if (this.publicidades.length === 0) return;

    this.indicePublicidadActual = 0;
    this.mostrarPublicidadActual();
    
    if (this.publicidades.length > 1) {
      this.iniciarTimer();
    }
  }

  private mostrarPublicidadActual(): void {
    if (!this.publicidades[this.indicePublicidadActual]) return;

    this.publicidadActual = this.publicidades[this.indicePublicidadActual];
    
    console.log('🔍 Mostrando publicidad:', {
      nombre: this.publicidadActual.nombre,
      media_type: this.publicidadActual.media_type,
      media_url: this.publicidadActual.media_url,
      esVideo: this.esVideo(),
      esImagen: this.esImagen(),
      esUnicaPublicidad: this.publicidades.length === 1
    });
    
    this.configurarImagenesActuales();
    
    if (this.publicidadActual.media_type === 'video') {
      this.tiempoRestante = this.publicidadActual.duracion_video || 30;
    } else {
      this.tiempoRestante = this.publicidadActual.tiempo_visualizacion || 5;
    }
    
    this.publicidadCambio.emit(this.publicidadActual);
  }

  private configurarImagenesActuales(): void {
    if (!this.publicidadActual) return;

    if (this.publicidadActual.media_type === 'image_multiple' && this.publicidadActual.media_urls) {
      this.imagenesActuales = this.publicidadActual.media_urls;
      this.imagenActualIndex = 0;
    } else if (this.publicidadActual.media_url) {
      this.imagenesActuales = [this.publicidadActual.media_url];
      this.imagenActualIndex = 0;
    } else {
      this.imagenesActuales = [];
      this.imagenActualIndex = 0;
    }
  }

  private iniciarTimer(): void {
    this.detenerTimer();
    
    this.intervalo = interval(1000).subscribe(() => {
      if (this.tiempoRestante > 0) {
        this.tiempoRestante--;
        
        if (this.tiempoRestante <= 0) {
          this.avanzarContenido();
        }
      }
    });
  }

  private avanzarContenido(): void {
    if (!this.publicidadActual) return;

    if (this.publicidadActual.media_type === 'image_multiple' && 
        this.imagenActualIndex < this.imagenesActuales.length - 1) {
      
      this.imagenActualIndex++;
      this.tiempoRestante = this.publicidadActual.tiempo_visualizacion || 5;
      
    } else {
      this.siguientePublicidad();
    }
  }

  private siguientePublicidad(): void {
    if (this.publicidades.length === 0) return;
    
    this.indicePublicidadActual = (this.indicePublicidadActual + 1) % this.publicidades.length;
    this.mostrarPublicidadActual();
  }

  private detenerTimer(): void {
    if (this.intervalo) {
      this.intervalo.unsubscribe();
      this.intervalo = null;
    }
  }

  public detenerCarrusel(): void {
    this.detenerTimer();
  }

  public onVideoTerminado(): void {
    console.log('🎬 Video terminado');
    
    if (this.publicidades.length === 1 && this.esVideo()) {
      console.log('🔄 Video único en loop - no avanzar');
      return;
    }
    
    this.siguientePublicidad();
  }

  public onMediaError(event: any): void {
    console.error('❌ Error cargando media:', event);
    this.error = 'Error cargando contenido';
    
    setTimeout(() => {
      this.siguientePublicidad();
    }, 2000);
  }

  public onMediaCargado(): void {
    this.error = null;
  }

  public obtenerMediaUrl(): string {
    if (this.esVideo() && this.publicidadActual?.media_url) {
      console.log('🎥 Usando media_url para video:', this.publicidadActual.media_url);
      return this.publicidadService.getFullMediaUrl(this.publicidadActual.media_url);
    }
    
    if (this.imagenesActuales.length > 0) {
      const urlActual = this.imagenesActuales[this.imagenActualIndex];
      console.log('🖼️ Usando imagen:', urlActual);
      return this.publicidadService.getFullMediaUrl(urlActual);
    }
    
    return 'assets/images/placeholder-banner.png';
  }

  public esVideo(): boolean {
    return this.publicidadActual?.media_type === 'video';
  }

  public esImagen(): boolean {
    return this.publicidadActual?.media_type === 'image' || 
           this.publicidadActual?.media_type === 'image_multiple';
  }

  public tieneMultiplesImagenes(): boolean {
    return this.publicidadActual?.media_type === 'image_multiple' && 
           this.imagenesActuales.length > 1;
  }

  public esVideoUnico(): boolean {
    return this.publicidades.length === 1 && this.esVideo();
  }

  get hayPublicidades(): boolean {
    return this.publicidades.length > 0;
  }
}