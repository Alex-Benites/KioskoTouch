import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

// Angular Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Shared Components
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';

// Services and Models
import { PublicidadService } from '../../../services/publicidad.service';
import { ApiError, TipoPublicidad, UnidadTiempo } from '../../../models/marketing.model';
import { Estado } from '../../../models/catalogo.model';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-crear-publicidad',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './crear-publicidad.component.html',
  styleUrls: ['./crear-publicidad.component.scss']
})
export class CrearPublicidadComponent implements OnInit {

  // ========== PROPIEDADES ==========
  publicidadForm!: FormGroup;
  mediaPreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  selectedMediaType: 'image' | 'video' | null = null;
  videoDuration: number | null = null;
  isLoading: boolean = false;
  
  publicidadId: number | null = null;
  isEditMode: boolean = false;
  pageTitle: string = 'Creación de Publicidad';
  existingMediaUrl: string | null = null;
  
  // Estados disponibles (filtrados)
  estados: Estado[] = [];
  loadingEstados: boolean = false;

  // Inyección de dependencias
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly publicidadService = inject(PublicidadService);

  // ========== CONSTANTES ==========
  readonly tiposPublicidad: { value: TipoPublicidad; label: string; dimensions: string }[] = [
    { 
      value: 'banner', 
      label: 'Banner (Imagen)', 
      dimensions: 'Recomendado: 1920x1080px (16:9)' 
    },
    { 
      value: 'video', 
      label: 'Video', 
      dimensions: 'Recomendado: 1920x1080px (16:9), máx. 30s' 
    }
  ];

  readonly unidadesTiempo: { value: UnidadTiempo; label: string }[] = [
    { value: 'segundos', label: 'Segundos' },
    { value: 'minutos', label: 'Minutos' },
    { value: 'horas', label: 'Horas' }
  ];

  readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  readonly allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi'];

  constructor() {
    // Vacío como patrón moderno
  }

  // ========== LIFECYCLE ==========
  ngOnInit(): void {
    this.publicidadId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.publicidadId && !isNaN(this.publicidadId);

    if (this.isEditMode) {
      this.pageTitle = 'Edición de Publicidad';
      this.cargarPublicidadParaEditar();
    }

    this.initializeForm();
    this.loadEstados();
  }

  // ========== INICIALIZACIÓN ==========
  private initializeForm(): void {
    this.publicidadForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      tipoPublicidad: ['', Validators.required],
      fechaInicial: [null, Validators.required],
      fechaFinal: [null, Validators.required],
      estado: [null, Validators.required],
      tiempoIntervaloValor: [5, [Validators.min(1)]],
      tiempoIntervaloUnidad: ['segundos', Validators.required],
      mediaType: [null],
      videoDuration: [null]
    });
  }

  private loadEstados(): void {
    this.loadingEstados = true;
    this.publicidadService.getEstados().subscribe({
      next: (estados) => {
        this.estados = estados.filter(estado => 
          estado.nombre === 'Activado' || estado.nombre === 'Desactivado'
        );
        this.loadingEstados = false;
        
        if (!this.isEditMode) {
          const estadoActivado = this.estados.find(e => e.nombre === 'Activado');
          if (estadoActivado) {
            this.publicidadForm.patchValue({ estado: estadoActivado.id });
          }
        }
      },
      error: (error) => {
        console.error('Error al cargar estados:', error);
        this.loadingEstados = false;
        alert('Error al cargar los estados disponibles');
      }
    });
  }

  private cargarPublicidadParaEditar(): void {
    if (!this.publicidadId) return;
    
    this.isLoading = true;
    console.log('📥 Cargando datos de publicidad ID:', this.publicidadId);
    
    this.publicidadService.getPublicidadById(this.publicidadId).subscribe({
      next: (publicidad) => {
        console.log('✅ Datos de publicidad cargados:', publicidad);
        this.populateForm(publicidad);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar publicidad:', error);
        alert('No se pudo cargar la información de la publicidad');
        this.isLoading = false;
        this.router.navigate(['/administrador/gestion-publicidad/editar-eliminar']);
      }
    });
  }

  private populateForm(publicidad: any): void {
    const fechaInicio = publicidad.fecha_inicio_publicidad ? 
      new Date(publicidad.fecha_inicio_publicidad) : null;
    const fechaFin = publicidad.fecha_fin_publicidad ? 
      new Date(publicidad.fecha_fin_publicidad) : null;

    this.publicidadForm.patchValue({
      nombre: publicidad.nombre,
      descripcion: publicidad.descripcion,
      tipoPublicidad: publicidad.tipo_publicidad,
      fechaInicial: fechaInicio,
      fechaFinal: fechaFin,
      estado: publicidad.estado,
      mediaType: publicidad.media_type
    });

    if (publicidad.tiempo_visualizacion) {
      const { valor, unidad } = this.convertSecondsToDisplay(publicidad.tiempo_visualizacion);
      this.publicidadForm.patchValue({
        tiempoIntervaloValor: valor,
        tiempoIntervaloUnidad: unidad
      });
    }

    if (publicidad.media_url) {
      this.selectedMediaType = publicidad.media_type;
      this.existingMediaUrl = publicidad.media_url;
      this.mediaPreview = this.getMediaUrlForEdit(publicidad.media_url);
      this.selectedFileName = this.extractFileNameFromUrl(publicidad.media_url);
      
      if (publicidad.media_type === 'video' && publicidad.tiempo_visualizacion) {
        this.videoDuration = publicidad.tiempo_visualizacion;
        this.publicidadForm.patchValue({ videoDuration: this.videoDuration });
      }
    }

    this.updateIntervalValidations();
  }

  private convertSecondsToDisplay(segundos: number): { valor: number; unidad: string } {
    if (segundos >= 3600 && segundos % 3600 === 0) {
      return { valor: segundos / 3600, unidad: 'horas' };
    } else if (segundos >= 60 && segundos % 60 === 0) {
      return { valor: segundos / 60, unidad: 'minutos' };
    } else {
      return { valor: segundos, unidad: 'segundos' };
    }
  }

  private getMediaUrlForEdit(mediaUrl: string): string {
    if (mediaUrl.startsWith('/media/')) {
      return `${environment.baseUrl}${mediaUrl}`;
    }
    return mediaUrl;
  }

  private extractFileNameFromUrl(url: string): string {
    const fileName = url.split('/').pop() || 'archivo_existente';
    return fileName.split('?')[0];
  }

  // ========== VALIDACIONES ==========
  private validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.maxFileSize) {
      return { valid: false, error: 'El archivo no puede ser mayor a 50MB' };
    }
    
    const tipoPublicidadSeleccionado = this.publicidadForm.get('tipoPublicidad')?.value;
    
    if (!tipoPublicidadSeleccionado) {
      return { valid: false, error: 'Primero debes seleccionar un tipo de publicidad' };
    }
    
    const isImage = this.allowedImageTypes.includes(file.type);
    const isVideo = this.allowedVideoTypes.includes(file.type);
    
    if (tipoPublicidadSeleccionado === 'banner' && !isImage) {
      return { valid: false, error: 'Para publicidad tipo Banner solo se permiten imágenes (JPG, PNG, GIF)' };
    }
    
    if (tipoPublicidadSeleccionado === 'video' && !isVideo) {
      return { valid: false, error: 'Para publicidad tipo Video solo se permiten videos (MP4, WEBM, OGG, AVI)' };
    }
    
    if (!isImage && !isVideo) {
      return { valid: false, error: 'Tipo de archivo no soportado' };
    }
    
    return { valid: true };
  }

  private getMediaTypeFromFile(file: File): 'image' | 'video' | null {
    const tipoPublicidadSeleccionado = this.publicidadForm.get('tipoPublicidad')?.value;
    
    if (tipoPublicidadSeleccionado === 'banner' && file.type.startsWith('image/')) {
      return 'image';
    }
    
    if (tipoPublicidadSeleccionado === 'video' && file.type.startsWith('video/')) {
      return 'video';
    }
    
    return null;
  }

  private updateIntervalValidations(): void {
    const valorControl = this.publicidadForm.get('tiempoIntervaloValor');
    const unidadControl = this.publicidadForm.get('tiempoIntervaloUnidad');
    const tipoPublicidad = this.publicidadForm.get('tipoPublicidad')?.value;
    
    if (tipoPublicidad === 'banner' && this.selectedMediaType === 'image') {
      valorControl?.setValidators([
        Validators.required, 
        Validators.min(1), 
        Validators.max(3600)
      ]);
      unidadControl?.setValidators(Validators.required);
    } else {
      valorControl?.clearValidators();
      unidadControl?.clearValidators();
    }
    
    valorControl?.updateValueAndValidity({ emitEvent: false });
    unidadControl?.updateValueAndValidity({ emitEvent: false });
  }

  // ========== MANEJO DE ARCHIVOS ==========
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const tipoPublicidadSeleccionado = this.publicidadForm.get('tipoPublicidad')?.value;
    if (!tipoPublicidadSeleccionado) {
      alert('Primero debes seleccionar un tipo de publicidad (Banner o Video)');
      this.clearFileInput(input);
      return;
    }

    const validation = this.validateFile(file);
    if (!validation.valid) {
      alert(validation.error!);
      this.clearFileInput(input);
      return;
    }

    this.selectedMediaType = this.getMediaTypeFromFile(file);
    if (!this.selectedMediaType) {
      alert('El archivo seleccionado no coincide con el tipo de publicidad elegido.');
      this.clearFileInput(input);
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.existingMediaUrl = null;
    this.publicidadForm.patchValue({ 
      mediaType: this.selectedMediaType,
      videoDuration: null 
    });
    
    const reader = new FileReader();
    reader.onload = () => {
      this.mediaPreview = reader.result;
      if (this.selectedMediaType === 'video') {
        this.getVideoDuration();
      }
    };
    reader.readAsDataURL(file);

    this.updateIntervalValidations();
  }

  private clearFileInput(input: HTMLInputElement): void {
    input.value = '';
  }

  private getVideoDuration(): void {
    if (this.selectedMediaType === 'video' && this.mediaPreview) {
      const video = document.createElement('video');
      video.src = this.mediaPreview as string;
      
      video.onloadedmetadata = () => {
        this.videoDuration = Math.round(video.duration);
        this.publicidadForm.patchValue({ videoDuration: this.videoDuration });
        console.log('Duración del video:', this.videoDuration, 'segundos');
      };

      video.onerror = () => {
        console.error('Error al cargar el video para obtener duración');
        this.videoDuration = 0;
        this.publicidadForm.patchValue({ videoDuration: 0 });
      };
    }
  }

  onTipoPublicidadChange(): void {
    const tipoSeleccionado = this.publicidadForm.get('tipoPublicidad')?.value;
    console.log('Tipo de publicidad cambiado a:', tipoSeleccionado);
    
    if (this.selectedFile) {
      const validation = this.validateFile(this.selectedFile);
      if (!validation.valid) {
        alert(`Archivo incompatible: ${validation.error}`);
        this.eliminarMedia();
      }
    }
    
    this.updateIntervalValidations();
  }

  eliminarMedia(): void {
    this.mediaPreview = null;
    this.selectedFile = null;
    this.selectedFileName = null;
    this.selectedMediaType = null;
    this.videoDuration = null;
    this.existingMediaUrl = null;
    this.publicidadForm.patchValue({ 
      mediaType: null,
      videoDuration: null 
    });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    this.updateIntervalValidations();
  }

  // ========== ENVÍO DEL FORMULARIO ==========
  private buildFormData(): FormData {
    const formData = new FormData();
    const formValues = this.publicidadForm.value;
    
    formData.append('nombre', formValues.nombre || '');
    formData.append('descripcion', formValues.descripcion || '');
    formData.append('tipo_publicidad', formValues.tipoPublicidad || '');
    
    if (formValues.fechaInicial instanceof Date) {
      const fechaInicio = formValues.fechaInicial.toISOString().split('T')[0];
      formData.append('fecha_inicio_publicidad', fechaInicio);
    }
    if (formValues.fechaFinal instanceof Date) {
      const fechaFin = formValues.fechaFinal.toISOString().split('T')[0];
      formData.append('fecha_fin_publicidad', fechaFin);
    }
    
    if (formValues.estado) {
      formData.append('estado', formValues.estado.toString());
    }
    
    formData.append('media_type', formValues.mediaType || '');
    
    if (formValues.mediaType === 'image') {
      const tiempoValor = parseInt(formValues.tiempoIntervaloValor) || 5;
      const tiempoUnidad = formValues.tiempoIntervaloUnidad || 'segundos';
      
      let tiempoEnSegundos = tiempoValor;
      if (tiempoUnidad === 'minutos') {
        tiempoEnSegundos = tiempoValor * 60;
      } else if (tiempoUnidad === 'horas') {
        tiempoEnSegundos = tiempoValor * 3600;
      }
      
      formData.append('tiempo_visualizacion', tiempoEnSegundos.toString());
    }
    
    if (formValues.mediaType === 'video' && formValues.videoDuration) {
      formData.append('tiempo_visualizacion', formValues.videoDuration.toString());
    }

    if (this.selectedFile) {
      formData.append('media_file', this.selectedFile, this.selectedFile.name);
    }

    return formData;
  }

  onSubmit(): void {
    if (this.publicidadForm.invalid) {
      alert('Por favor, completa todos los campos requeridos.');
      this.publicidadForm.markAllAsTouched();
      return;
    }

    if (!this.isEditMode && !this.selectedFile) {
      alert('Por favor, selecciona una imagen o video para la publicidad.');
      return;
    }

    this.isLoading = true;
    const formData = this.buildFormData();

    if (this.isEditMode) {
      this.publicidadService.updatePublicidad(this.publicidadId!, formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('✅ Publicidad actualizada exitosamente', response);

          this.mostrarDialogExito(
            'ACTUALIZACIÓN',
            '¡La publicidad ha sido actualizada exitosamente!',
            'Continuar'
          );
        },
        error: (error: ApiError) => {
          this.isLoading = false;
          this.handleSubmitError(error);
        }
      });
    } else {
      this.publicidadService.createPublicidad(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('✅ Publicidad creada exitosamente', response);

          this.mostrarDialogExito(
            'REGISTRO',
            '¡La publicidad ha sido creada exitosamente!',
            'Continuar'
          );
        },
        error: (error: ApiError) => {
          this.isLoading = false;
          this.handleSubmitError(error);
        }
      });
    }
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
      if (this.isEditMode) {
        this.navegarAListaPublicidad();
      } else {
        this.resetFormulario();
      }
    });
  }

  private navegarAListaPublicidad(): void {
    this.router.navigate(['/administrador/gestion-publicidad/editar-eliminar']);
  }

  private handleSubmitError(error: ApiError): void {
    console.error('=== ERROR COMPLETO ===', error);
    
    if (error.errors && error.errors.length > 0) {
      const errorMessages = error.errors.map(e => `${e.field}: ${e.message}`).join('\n');
      alert(`Errores de validación:\n${errorMessages}`);
    } else {
      const action = this.isEditMode ? 'actualizar' : 'crear';
      alert(error.message || `Error al ${action} la publicidad.`);
    }
  }

  private resetFormulario(): void {
    if (this.isEditMode) return;
    
    this.publicidadForm.reset();
    this.eliminarMedia();
    
    this.publicidadForm.patchValue({
      tipoPublicidad: '',
      tiempoIntervaloValor: 5,
      tiempoIntervaloUnidad: 'segundos'
    });
    
    const estadoActivado = this.estados.find(e => e.nombre === 'Activado');
    if (estadoActivado) {
      this.publicidadForm.patchValue({ estado: estadoActivado.id });
    }
    
    this.publicidadForm.markAsPristine();
    this.publicidadForm.markAsUntouched();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ========== GETTERS PARA EL TEMPLATE ==========
  get isFileInputDisabled(): boolean {
    const tipoPublicidad = this.publicidadForm.get('tipoPublicidad')?.value;
    return !tipoPublicidad || tipoPublicidad === '';
  }

  get fileInputPlaceholder(): string {
    const tipoPublicidad = this.publicidadForm.get('tipoPublicidad')?.value;
    
    if (!tipoPublicidad) {
      return 'Primero selecciona un tipo de publicidad';
    }
    
    if (tipoPublicidad === 'banner') {
      return this.isEditMode ? 
        'Cambiar imagen (opcional - JPG, PNG, GIF - máx. 50MB)' :
        'Seleccionar imagen (JPG, PNG, GIF - máx. 50MB)';
    }
    
    if (tipoPublicidad === 'video') {
      return this.isEditMode ?
        'Cambiar video (opcional - MP4, WEBM, OGG, AVI - máx. 50MB)' :
        'Seleccionar video (MP4, WEBM, OGG, AVI - máx. 50MB)';
    }
    
    return 'Seleccionar archivo';
  }

  get dimensionsInfo(): string {
    const tipoPublicidad = this.publicidadForm.get('tipoPublicidad')?.value;
    const tipoInfo = this.tiposPublicidad.find(t => t.value === tipoPublicidad);
    return tipoInfo?.dimensions || '';
  }

  get acceptedFileTypes(): string {
    const tipoPublicidad = this.publicidadForm.get('tipoPublicidad')?.value;
    
    if (tipoPublicidad === 'banner') {
      return this.allowedImageTypes.join(',');
    }
    
    if (tipoPublicidad === 'video') {
      return this.allowedVideoTypes.join(',');
    }
    
    return '';
  }

  get shouldShowIntervalFields(): boolean {
    const tipoPublicidad = this.publicidadForm.get('tipoPublicidad')?.value;
    return tipoPublicidad === 'banner';
  }

  get shouldShowVideoDuration(): boolean {
    return this.selectedMediaType === 'video' && this.videoDuration !== null;
  }

  get hasMedia(): boolean {
    return !!(this.selectedFile || this.existingMediaUrl);
  }

  // ========== UTILIDADES ==========
  calculateTotalSeconds(): number {
    const valor = this.publicidadForm.get('tiempoIntervaloValor')?.value || 5;
    const unidad = this.publicidadForm.get('tiempoIntervaloUnidad')?.value || 'segundos';
    
    let segundos = parseInt(valor);
    if (unidad === 'minutos') {
      segundos = valor * 60;
    } else if (unidad === 'horas') {
      segundos = valor * 3600;
    }
    
    return segundos;
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/administrador/gestion-publicidad/editar-eliminar']);
    } else {
      this.router.navigate(['/administrador/gestion-publicidad']);
    }
  }

  // ========== GETTERS PARA VALIDACIONES ==========
  get nombre() { return this.publicidadForm.get('nombre'); }
  get descripcion() { return this.publicidadForm.get('descripcion'); }
  get tipoPublicidad() { return this.publicidadForm.get('tipoPublicidad'); }
  get fechaInicial() { return this.publicidadForm.get('fechaInicial'); }
  get fechaFinal() { return this.publicidadForm.get('fechaFinal'); }
  get estado() { return this.publicidadForm.get('estado'); }
  get tiempoIntervaloValor() { return this.publicidadForm.get('tiempoIntervaloValor'); }
  get tiempoIntervaloUnidad() { return this.publicidadForm.get('tiempoIntervaloUnidad'); }
}