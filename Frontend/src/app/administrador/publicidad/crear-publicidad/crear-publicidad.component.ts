import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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

// Services and Models
import { PublicidadService } from '../../../services/publicidad.service';
import { ApiError, TipoPublicidad, UnidadTiempo } from '../../../models/marketing.model';
import { Estado } from '../../../models/catalogo.model';

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
    MatSnackBarModule,
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
  
  // ✅ NUEVAS PROPIEDADES PARA EDICIÓN
  publicidadId: number | null = null;
  isEditMode: boolean = false;
  pageTitle: string = 'Creación de Publicidad';
  submitButtonText: string = 'Guardar Publicidad';
  existingMediaUrl: string | null = null; // Para mantener referencia del archivo existente
  
  // Estados disponibles (filtrados)
  estados: Estado[] = [];
  loadingEstados: boolean = false;

  // Inyección de dependencias
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute); // ✅ AGREGADO
  private readonly snackBar = inject(MatSnackBar);
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

  // ========== LIFECYCLE ==========
  ngOnInit(): void {
    this.checkEditMode(); // ✅ VERIFICAR MODO ANTES DE INICIALIZAR
    this.initializeForm();
    this.loadEstados();
  }

  // ✅ NUEVO MÉTODO: Verificar si estamos en modo edición
  private checkEditMode(): void {
    this.route.params.subscribe(params => {
      this.publicidadId = params['id'] ? parseInt(params['id']) : null;
      this.isEditMode = !!this.publicidadId;
      
      if (this.isEditMode) {
        this.pageTitle = 'Edición de Publicidad';
        this.submitButtonText = 'Actualizar Publicidad';
        console.log('🔄 Modo edición activado para ID:', this.publicidadId);
      } else {
        this.pageTitle = 'Creación de Publicidad';
        this.submitButtonText = 'Guardar Publicidad';
        console.log('✨ Modo creación activado');
      }
    });
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

    // ✅ Cargar datos si estamos en modo edición (después de cargar estados)
    if (this.isEditMode && this.publicidadId) {
      // Esperamos a que se carguen los estados antes de cargar los datos
      setTimeout(() => this.loadPublicidadData(), 100);
    }
  }

  private loadEstados(): void {
    this.loadingEstados = true;
    this.publicidadService.getEstados().subscribe({
      next: (estados) => {
        // Filtrar solo los estados que necesitamos
        this.estados = estados.filter(estado => 
          estado.nombre === 'Activado' || estado.nombre === 'Desactivado'
        );
        this.loadingEstados = false;
        
        // Setear valor por defecto (Activado) solo si no estamos en modo edición
        if (!this.isEditMode) {
          const estadoActivado = this.estados.find(e => e.nombre === 'Activado');
          if (estadoActivado) {
            this.publicidadForm.patchValue({ estado: estadoActivado.id });
          }
        }

        // ✅ Cargar datos de publicidad después de cargar estados (si estamos en modo edición)
        if (this.isEditMode && this.publicidadId) {
          this.loadPublicidadData();
        }
      },
      error: (error) => {
        console.error('Error al cargar estados:', error);
        this.loadingEstados = false;
        this.mostrarError('Error al cargar los estados disponibles');
      }
    });
  }

  // ✅ NUEVO MÉTODO: Cargar datos de publicidad para edición
  private loadPublicidadData(): void {
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
        this.mostrarError('No se pudo cargar la información de la publicidad');
        this.isLoading = false;
        // Redirigir al listado si hay error
        this.router.navigate(['/administrador/gestion-publicidad/editar-eliminar']);
      }
    });
  }

  // ✅ NUEVO MÉTODO: Llenar formulario con datos existentes
  private populateForm(publicidad: any): void {
    // Convertir fechas
    const fechaInicio = publicidad.fecha_inicio_publicidad ? 
      new Date(publicidad.fecha_inicio_publicidad) : null;
    const fechaFin = publicidad.fecha_fin_publicidad ? 
      new Date(publicidad.fecha_fin_publicidad) : null;

    // Llenar formulario
    this.publicidadForm.patchValue({
      nombre: publicidad.nombre,
      descripcion: publicidad.descripcion,
      tipoPublicidad: publicidad.tipo_publicidad,
      fechaInicial: fechaInicio,
      fechaFinal: fechaFin,
      estado: publicidad.estado,
      mediaType: publicidad.media_type
    });

    // Configurar tiempo de visualización
    if (publicidad.tiempo_visualizacion) {
      const { valor, unidad } = this.convertSecondsToDisplay(publicidad.tiempo_visualizacion);
      this.publicidadForm.patchValue({
        tiempoIntervaloValor: valor,
        tiempoIntervaloUnidad: unidad
      });
    }

    // Configurar media existente
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

  // ✅ MÉTODO AUXILIAR: Convertir segundos a display
  private convertSecondsToDisplay(segundos: number): { valor: number; unidad: string } {
    if (segundos >= 3600 && segundos % 3600 === 0) {
      return { valor: segundos / 3600, unidad: 'horas' };
    } else if (segundos >= 60 && segundos % 60 === 0) {
      return { valor: segundos / 60, unidad: 'minutos' };
    } else {
      return { valor: segundos, unidad: 'segundos' };
    }
  }

  // ✅ MÉTODO AUXILIAR: URL para edición
  private getMediaUrlForEdit(mediaUrl: string): string {
    if (mediaUrl.startsWith('/media/')) {
      return `http://localhost:8000${mediaUrl}`;
    }
    return mediaUrl;
  }

  // ✅ MÉTODO AUXILIAR: Extraer nombre de archivo
  private extractFileNameFromUrl(url: string): string {
    const fileName = url.split('/').pop() || 'archivo_existente';
    return fileName.split('?')[0]; // Remover query parameters si los hay
  }

  // ========== VALIDACIONES MEJORADAS ==========
  private validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.maxFileSize) {
      return { valid: false, error: 'El archivo no puede ser mayor a 50MB' };
    }
    
    // NUEVA VALIDACIÓN: Verificar que coincida con el tipo de publicidad seleccionado
    const tipoPublicidadSeleccionado = this.publicidadForm.get('tipoPublicidad')?.value;
    
    if (!tipoPublicidadSeleccionado) {
      return { valid: false, error: 'Primero debes seleccionar un tipo de publicidad' };
    }
    
    const isImage = this.allowedImageTypes.includes(file.type);
    const isVideo = this.allowedVideoTypes.includes(file.type);
    
    // Validar que el archivo coincida con el tipo seleccionado
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
    // MEJORADO: Verificar que coincida con el tipo de publicidad
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
    
    // Solo requerir intervalo para imágenes (banner)
    if (tipoPublicidad === 'banner' && this.selectedMediaType === 'image') {
      valorControl?.setValidators([
        Validators.required, 
        Validators.min(1), 
        Validators.max(3600) // Máximo 1 hora
      ]);
      unidadControl?.setValidators(Validators.required);
    } else {
      valorControl?.clearValidators();
      unidadControl?.clearValidators();
    }
    
    valorControl?.updateValueAndValidity({ emitEvent: false });
    unidadControl?.updateValueAndValidity({ emitEvent: false });
  }

  // ========== MANEJO DE ARCHIVOS MEJORADO ==========
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // NUEVA VALIDACIÓN: Verificar que haya seleccionado tipo de publicidad primero
    const tipoPublicidadSeleccionado = this.publicidadForm.get('tipoPublicidad')?.value;
    if (!tipoPublicidadSeleccionado) {
      this.mostrarError('Primero debes seleccionar un tipo de publicidad (Banner o Video)');
      this.clearFileInput(input);
      return;
    }

    // Validar archivo
    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.mostrarError(validation.error!);
      this.clearFileInput(input);
      return;
    }

    // Determinar tipo de media
    this.selectedMediaType = this.getMediaTypeFromFile(file);
    if (!this.selectedMediaType) {
      this.mostrarError('El archivo seleccionado no coincide con el tipo de publicidad elegido.');
      this.clearFileInput(input);
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.existingMediaUrl = null; // ✅ Limpiar URL existente al seleccionar nuevo archivo
    this.publicidadForm.patchValue({ 
      mediaType: this.selectedMediaType,
      videoDuration: null 
    });
    
    // Crear preview
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

  // NUEVO: Método para manejar cambio de tipo de publicidad
  onTipoPublicidadChange(): void {
    const tipoSeleccionado = this.publicidadForm.get('tipoPublicidad')?.value;
    console.log('Tipo de publicidad cambiado a:', tipoSeleccionado);
    
    // Si ya hay un archivo seleccionado, verificar compatibilidad
    if (this.selectedFile) {
      const validation = this.validateFile(this.selectedFile);
      if (!validation.valid) {
        // El archivo actual no es compatible con el nuevo tipo
        this.mostrarError(`Archivo incompatible: ${validation.error}`);
        this.eliminarMedia();
      }
    }
    
    // Actualizar validaciones de intervalo
    this.updateIntervalValidations();
  }

  eliminarMedia(): void {
    this.mediaPreview = null;
    this.selectedFile = null;
    this.selectedFileName = null;
    this.selectedMediaType = null;
    this.videoDuration = null;
    this.existingMediaUrl = null; // ✅ También limpiar URL existente
    this.publicidadForm.patchValue({ 
      mediaType: null,
      videoDuration: null 
    });
    
    // Limpiar input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    this.updateIntervalValidations();
  }

  // ========== LÓGICA DE FORMULARIO ACTUALIZADA ==========
  private buildFormData(): FormData {
    const formData = new FormData();
    const formValues = this.publicidadForm.value;
    
    console.log('=== CONSTRUYENDO FORMDATA ===');
    console.log('Valores del formulario:', formValues);
    
    // Campos básicos
    formData.append('nombre', formValues.nombre || '');
    formData.append('descripcion', formValues.descripcion || '');
    formData.append('tipo_publicidad', formValues.tipoPublicidad || '');
    
    // Fechas
    if (formValues.fechaInicial instanceof Date) {
      const fechaInicio = formValues.fechaInicial.toISOString().split('T')[0];
      formData.append('fecha_inicio_publicidad', fechaInicio);
      console.log('Fecha inicio:', fechaInicio);
    }
    if (formValues.fechaFinal instanceof Date) {
      const fechaFin = formValues.fechaFinal.toISOString().split('T')[0];
      formData.append('fecha_fin_publicidad', fechaFin);
      console.log('Fecha fin:', fechaFin);
    }
    
    // Estado
    if (formValues.estado) {
      formData.append('estado', formValues.estado.toString());
      console.log('Estado:', formValues.estado);
    }
    
    // Media
    formData.append('media_type', formValues.mediaType || '');
    console.log('Media type:', formValues.mediaType);
    
    // NUEVO: Tiempo de visualización (convertir todo a segundos)
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
      console.log('Tiempo visualización (segundos):', tiempoEnSegundos);
    }
    
    // Duración de video (si es video, usarla como tiempo de visualización)
    if (formValues.mediaType === 'video' && formValues.videoDuration) {
      formData.append('tiempo_visualizacion', formValues.videoDuration.toString());
      console.log('Video duration como tiempo visualización:', formValues.videoDuration);
    }

    // ✅ Archivo (solo agregar si hay uno nuevo seleccionado)
    if (this.selectedFile) {
      formData.append('media_file', this.selectedFile, this.selectedFile.name);
      console.log('Archivo adjunto:', this.selectedFile.name);
    } else if (this.isEditMode && this.existingMediaUrl) {
      console.log('Manteniendo archivo existente:', this.existingMediaUrl);
    }

    return formData;
  }

  // ✅ MÉTODO ONSUBMIT ACTUALIZADO PARA MANEJAR CREACIÓN Y EDICIÓN
  onSubmit(): void {
    if (this.publicidadForm.invalid) {
      this.mostrarError('Por favor, completa todos los campos requeridos.');
      this.publicidadForm.markAllAsTouched();
      return;
    }

    // En modo edición, el archivo es opcional (puede mantener el existente)
    if (!this.isEditMode && !this.selectedFile) {
      this.mostrarError('Por favor, selecciona una imagen o video para la publicidad.');
      return;
    }

    this.isLoading = true;
    const formData = this.buildFormData();

    console.log('=== DATOS DEL FORMULARIO ===');
    console.log('Form values:', this.publicidadForm.value);
    console.log('Selected file:', this.selectedFile);
    console.log('Existing media URL:', this.existingMediaUrl);
    console.log('Is edit mode:', this.isEditMode);

    console.log('=== FORMDATA ENVIADO ===');
    for (const pair of formData.entries()) {
      console.log(pair[0] + ':', pair[1]);
    }

    if (this.isEditMode) {
      // ✅ ACTUALIZAR publicidad existente
      this.publicidadService.updatePublicidad(this.publicidadId!, formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.mostrarExito('Publicidad actualizada exitosamente');
          console.log('Publicidad actualizada:', response);
          // Redirigir al listado
          this.router.navigate(['/administrador/gestion-publicidad/editar-eliminar']);
        },
        error: (error: ApiError) => {
          this.isLoading = false;
          this.handleSubmitError(error);
        }
      });
    } else {
      // ✅ CREAR nueva publicidad
      this.publicidadService.createPublicidad(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.mostrarExito('Publicidad creada exitosamente. ¡Puedes crear otra!');
          console.log('Publicidad creada:', response);
          this.resetFormulario();
        },
        error: (error: ApiError) => {
          this.isLoading = false;
          this.handleSubmitError(error);
        }
      });
    }
  }

  // ✅ NUEVO MÉTODO: Manejar errores de submit
  private handleSubmitError(error: ApiError): void {
    console.error('=== ERROR COMPLETO ===', error);
    
    if (error.errors && error.errors.length > 0) {
      console.error('Errores específicos:', error.errors);
      const errorMessages = error.errors.map(e => `${e.field}: ${e.message}`).join('\n');
      this.mostrarError(`Errores de validación:\n${errorMessages}`);
    } else {
      const action = this.isEditMode ? 'actualizar' : 'crear';
      this.mostrarError(error.message || `Error al ${action} la publicidad.`);
    }
  }

  private resetFormulario(): void {
    // Solo resetear si NO estamos en modo edición
    if (this.isEditMode) return;
    
    // Limpiar formulario y volver a valores por defecto
    this.publicidadForm.reset();
    
    // Limpiar archivos y preview
    this.eliminarMedia();
    
    // Resetear valores por defecto
    this.publicidadForm.patchValue({
      tipoPublicidad: '', // Vacío para forzar selección
      tiempoIntervaloValor: 5,
      tiempoIntervaloUnidad: 'segundos'
    });
    
    // Setear estado por defecto (Activado) nuevamente
    const estadoActivado = this.estados.find(e => e.nombre === 'Activado');
    if (estadoActivado) {
      this.publicidadForm.patchValue({ estado: estadoActivado.id });
    }
    
    // Marcar formulario como pristine y untouched
    this.publicidadForm.markAsPristine();
    this.publicidadForm.markAsUntouched();
    
    // Scroll hacia arriba para mejor UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('Formulario reseteado para nueva publicidad');
  }

  // ========== GETTERS PARA EL TEMPLATE ==========
  
  // Deshabilitar input de archivo hasta seleccionar tipo
  get isFileInputDisabled(): boolean {
    const tipoPublicidad = this.publicidadForm.get('tipoPublicidad')?.value;
    return !tipoPublicidad || tipoPublicidad === '';
  }

  // ✅ ACTUALIZADO: Texto dinámico considerando modo edición
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

  // NUEVO: Getter para mostrar dimensiones recomendadas
  get dimensionsInfo(): string {
    const tipoPublicidad = this.publicidadForm.get('tipoPublicidad')?.value;
    const tipoInfo = this.tiposPublicidad.find(t => t.value === tipoPublicidad);
    return tipoInfo?.dimensions || '';
  }

  // Tipos de archivo aceptados dinámicamente
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

  // Mostrar campos de intervalo solo para banner
  get shouldShowIntervalFields(): boolean {
    const tipoPublicidad = this.publicidadForm.get('tipoPublicidad')?.value;
    return tipoPublicidad === 'banner';
  }

  // Mostrar duración solo para video
  get shouldShowVideoDuration(): boolean {
    return this.selectedMediaType === 'video' && this.videoDuration !== null;
  }

  // ✅ NUEVO: Verificar si hay media (archivo nuevo o existente)
  get hasMedia(): boolean {
    return !!(this.selectedFile || this.existingMediaUrl);
  }

  // ========== MÉTODO AUXILIAR PARA CALCULAR TIEMPO ==========
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

  // ========== UTILIDADES ==========
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

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'OK', {
      duration: 4000,
      panelClass: ['success-snackbar']
    });
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