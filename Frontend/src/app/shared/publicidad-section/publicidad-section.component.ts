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

  @Input() tipo: string = 'banner';
  @Input() altura: string = '200px';
  @Input() mostrarIndicadores: boolean = true;
  
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
    console.log(`🎬 Cargando publicidades tipo: ${this.tipo}`);
    this.cargando = true;
    this.error = null;

    this.subscription.add(
      this.publicidadService.getPublicidadesActivasParaCarrusel(this.tipo).subscribe({
        next: (publicidades) => {
          console.log(`📺 Publicidades recibidas: ${publicidades.length}`);
          
          // Ya vienen filtradas desde el backend
          this.publicidades = publicidades.filter(pub => 
            pub.media_url || (pub.media_urls && pub.media_urls.length > 0)
          );
          
          if (this.publicidades.length > 0) {
            console.log(`✅ Iniciando carrusel con ${this.publicidades.length} publicidades`);
            this.iniciarCarrusel();
          } else {
            console.log('⚠️ No hay publicidades activas');
            this.publicidadActual = null;
          }
          
          this.cargando = false;
        },
        error: (error) => {
          console.error('❌ Error cargando publicidades:', error);
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
    this.iniciarTimer();
  }

  private mostrarPublicidadActual(): void {
    if (!this.publicidades[this.indicePublicidadActual]) return;

    this.publicidadActual = this.publicidades[this.indicePublicidadActual];
    
    this.configurarImagenesActuales();
    
    // Configurar tiempo según tipo de media
    if (this.publicidadActual.media_type === 'video') {
      this.tiempoRestante = this.publicidadActual.duracion_video || 30;
      console.log(`🎥 Video: ${this.publicidadActual.nombre} - Duración: ${this.tiempoRestante}s`);
    } else {
      this.tiempoRestante = this.publicidadActual.tiempo_visualizacion || 5;
      console.log(`📸 Imagen(es): ${this.publicidadActual.nombre} - Tiempo: ${this.tiempoRestante}s`);
    }
    
    this.publicidadCambio.emit(this.publicidadActual);
  }

  private configurarImagenesActuales(): void {
    if (!this.publicidadActual) return;

    if (this.publicidadActual.media_type === 'image_multiple' && this.publicidadActual.media_urls) {
      this.imagenesActuales = this.publicidadActual.media_urls;
      this.imagenActualIndex = 0;
      console.log(`🖼️ Configurando ${this.imagenesActuales.length} imágenes para: ${this.publicidadActual.nombre}`);
    } else if (this.publicidadActual.media_url) {
      this.imagenesActuales = [this.publicidadActual.media_url];
      this.imagenActualIndex = 0;
      console.log(`🖼️ Configurando imagen única para: ${this.publicidadActual.nombre}`);
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
      
      console.log(`🖼️ Avanzando a imagen ${this.imagenActualIndex + 1}/${this.imagenesActuales.length} de: ${this.publicidadActual.nombre}`);
      
    } else {
      this.siguientePublicidad();
    }
  }

  private siguientePublicidad(): void {
    if (this.publicidades.length === 0) return;

    console.log(`🔄 Avanzando de publicidad: ${this.publicidadActual?.nombre} → siguiente`);
    
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
    console.log('⏹️ Carrusel detenido');
  }

  public irAPublicidad(indice: number): void {
    if (indice >= 0 && indice < this.publicidades.length) {
      this.indicePublicidadActual = indice;
      this.mostrarPublicidadActual();
      this.iniciarTimer();
    }
  }

  public irAImagen(indiceImagen: number): void {
    if (this.publicidadActual?.media_type === 'image_multiple' && 
        indiceImagen >= 0 && indiceImagen < this.imagenesActuales.length) {
      
      this.imagenActualIndex = indiceImagen;
      this.tiempoRestante = this.publicidadActual.tiempo_visualizacion || 5;
      
      console.log(`🖼️ Saltando a imagen ${indiceImagen + 1}/${this.imagenesActuales.length}`);
    }
  }


  public obtenerMediaUrl(): string {
    if (this.imagenesActuales.length > 0) {
      const urlActual = this.imagenesActuales[this.imagenActualIndex];
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

  public reintentar(): void {
    this.cargarPublicidades();
  }


  get hayPublicidades(): boolean {
    return this.publicidades.length > 0;
  }

  get tiempoFormateado(): string {
    const minutos = Math.floor(this.tiempoRestante / 60);
    const segundos = this.tiempoRestante % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  }

  get infoImagenActual(): string {
    if (this.tieneMultiplesImagenes()) {
      return `${this.imagenActualIndex + 1}/${this.imagenesActuales.length}`;
    }
    return '1/1';
  }

  get porcentajeProgresoImagen(): number {
    if (!this.publicidadActual) return 0;
    const tiempoTotal = this.publicidadActual.tiempo_visualizacion || 5;
    return ((tiempoTotal - this.tiempoRestante) / tiempoTotal) * 100;
  }
}