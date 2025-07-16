import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar'; // ✅ NUEVO: Solo agregar esto

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

import { PublicidadService } from '../../../services/publicidad.service';
import { ApiError, TipoPublicidad, UnidadTiempo, SECCIONES_SISTEMA } from '../../../models/marketing.model';
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

  publicidadForm!: FormGroup;
  selectedFiles: File[] = [];
  selectedFile: File | null = null; // Para video
  filePreviews: { url: string; name: string }[] = [];
  videoPreview: string | null = null;
  existingImages: { id: number; url: string; name: string }[] = [];
  existingVideoUrl: string | null = null;
  selectedFileName: string | null = null;
  selectedMediaType: 'image' | 'video' | null = null;
  videoDuration: number | null = null;
  isLoading: boolean = false;
  
  publicidadId: number | null = null;
  isEditMode: boolean = false;
  pageTitle: string = 'Creación de Publicidad';
  
  estados: Estado[] = [];
  loadingEstados: boolean = false;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly publicidadService = inject(PublicidadService);
  private readonly snackBar = inject(MatSnackBar); // ✅ NUEVO: Solo agregar esto

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

  readonly seccionesSistema = SECCIONES_SISTEMA;

  readonly maxFileSize = 50 * 1024 * 1024;
  readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  readonly allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi'];

  constructor() {}

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

  private initializeForm(): void {
    this.publicidadForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      tipoPublicidad: ['', Validators.required],
      seccion: ['global', Validators.required],
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
        // ✅ CAMBIO: Reemplazar alert con snackBar
        this.snackBar.open('Error al cargar los estados disponibles', 'Cerrar', { duration: 5000 });
      }
    });
  }

  private cargarPublicidadParaEditar(): void {
    if (!this.publicidadId) return;
    
    this.isLoading = true;
    console.log('Cargando datos de publicidad ID:', this.publicidadId);
    
    this.publicidadService.getPublicidadById(this.publicidadId).subscribe({
      next: (publicidad) => {
        console.log('Datos de publicidad cargados:', publicidad);
        this.populateForm(publicidad);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar publicidad:', error);
        // ✅ CAMBIO: Reemplazar alert con snackBar
        this.snackBar.open('No se pudo cargar la información de la publicidad', 'Cerrar', { duration: 5000 });
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
      seccion: publicidad.seccion || 'global',
      fechaInicial: fechaInicio,
      fechaFinal: fechaFin,
      estado: publicidad.estado,
      mediaType: publicidad.media_type
    });

    // ✅ NUEVO: Deshabilitar campos en modo edición
    this.disableFormFieldsInEditMode();

    if (publicidad.tiempo_visualizacion) {
      const { valor, unidad } = this.convertSecondsToDisplay(publicidad.tiempo_visualizacion);
      this.publicidadForm.patchValue({
        tiempoIntervaloValor: valor,
        tiempoIntervaloUnidad: unidad
      });
    }

    this.selectedMediaType = publicidad.media_type;

    // Cargar imágenes existentes si es tipo banner
    if (publicidad.media_type === 'image' && publicidad.imagenes && publicidad.imagenes.length > 0) {
      this.existingImages = publicidad.imagenes.map((img: any, index: number) => ({
        id: img.id || index,
        url: this.getMediaUrlForEdit(img.ruta),
        name: this.extractFileNameFromUrl(img.ruta)
      }));
      console.log('Imágenes existentes cargadas:', this.existingImages);
    }

    // Cargar video existente si es tipo video
    if (publicidad.media_type === 'video' && publicidad.videos && publicidad.videos.length > 0) {
      const video = publicidad.videos[0];
      this.existingVideoUrl = this.getMediaUrlForEdit(video.ruta);
      this.videoPreview = this.existingVideoUrl;
      this.selectedFileName = this.extractFileNameFromUrl(video.ruta);
      
      if (video.duracion) {
        this.videoDuration = video.duracion;
        this.publicidadForm.patchValue({ videoDuration: this.videoDuration });
      }
      console.log('Video existente cargado:', this.existingVideoUrl);
    }

    this.updateIntervalValidations();
  }

  // Agregar este método después de populateForm():
  private disableFormFieldsInEditMode(): void {
    if (this.isEditMode) {
      // Deshabilitar el campo tipo de publicidad
      this.publicidadForm.get('tipoPublicidad')?.disable();
      console.log('Campo tipoPublicidad deshabilitado en modo edición');
    }
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
    console.log('Procesando URL de media:', mediaUrl);
    
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      console.log('URL completa detectada:', mediaUrl);
      return mediaUrl;
    }
    
    if (mediaUrl.startsWith('/media/')) {
      const fullUrl = `${environment.baseUrl}${mediaUrl}`;
      console.log('URL relativa /media/ convertida:', fullUrl);
      return fullUrl;
    }
    
    const fullUrl = `${environment.baseUrl}/media/${mediaUrl}`;
    console.log('URL sin prefijo convertida:', fullUrl);
    return fullUrl;
  }

  private extractFileNameFromUrl(url: string): string {
    try {
      const cleanUrl = url.split('?')[0];
      const fileName = cleanUrl.split('/').pop() || 'archivo_existente';
      const decodedFileName = decodeURIComponent(fileName);
      
      const match = decodedFileName.match(/publicidad_\d+_(.+)/);
      if (match && match[1]) {
        return match[1];
      }
      
      return decodedFileName;
    } catch (error) {
      console.warn('Error extrayendo nombre de archivo:', error);
      return 'archivo_existente';
    }
  }

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

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (files.length === 0) return;

    const tipoPublicidadSeleccionado = this.publicidadForm.get('tipoPublicidad')?.value;
    if (!tipoPublicidadSeleccionado) {
      // ✅ CAMBIO: Reemplazar alert con snackBar
      this.snackBar.open('Primero debes seleccionar un tipo de publicidad (Banner o Video)', 'Cerrar', { duration: 4000 });
      this.clearFileInput(input);
      return;
    }

    if (tipoPublicidadSeleccionado === 'video') {
      // Para video, solo un archivo
      const file = files[0];
      const validation = this.validateFile(file);
      if (!validation.valid) {
        // ✅ CAMBIO: Reemplazar alert con snackBar
        this.snackBar.open(validation.error!, 'Cerrar', { duration: 5000 });
        this.clearFileInput(input);
        return;
      }

      this.selectedMediaType = 'video';
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.existingVideoUrl = null;
      this.publicidadForm.patchValue({ 
        mediaType: this.selectedMediaType,
        videoDuration: null 
      });
      
      const reader = new FileReader();
      reader.onload = () => {
        this.videoPreview = reader.result as string;
        this.getVideoDuration();
      };
      reader.readAsDataURL(file);

    } else if (tipoPublicidadSeleccionado === 'banner') {
      // Para banner, múltiples imágenes
      const currentTotal = this.existingImages.length + this.selectedFiles.length;
      const availableSlots = 5 - currentTotal;
      
      if (files.length > availableSlots) {
        // ✅ CAMBIO: Reemplazar alert con snackBar
        this.snackBar.open(`Solo puedes agregar ${availableSlots} imagen(es) más. Máximo total: 5 imágenes`, 'Cerrar', { duration: 5000 });
        this.clearFileInput(input);
        return;
      }

      // Validar cada archivo
      for (const file of files) {
        const validation = this.validateFile(file);
        if (!validation.valid) {
          // ✅ CAMBIO: Reemplazar alert con snackBar
          this.snackBar.open(`Error en archivo "${file.name}": ${validation.error}`, 'Cerrar', { duration: 5000 });
          this.clearFileInput(input);
          return;
        }
      }

      this.selectedMediaType = 'image';
      this.publicidadForm.patchValue({ mediaType: this.selectedMediaType });

      // Agregar archivos a la lista
      files.forEach(file => {
        this.selectedFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = () => {
          this.filePreviews.push({
            url: reader.result as string,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    }

    this.updateIntervalValidations();
    this.clearFileInput(input);
  }

  // ✅ CAMBIO: Validación para no eliminar la última imagen en modo edición
  removeExistingImage(imageId: number): void {
    // Validación: No permitir eliminar la última imagen en modo edición
    if (this.isEditMode) {
      const totalAfterRemoval = this.getTotalImagesCount() - 1;
      if (totalAfterRemoval === 0) {
        this.snackBar.open('No puedes eliminar todas las imágenes. El banner debe tener al menos una imagen.', 'Cerrar', { duration: 5000 });
        return;
      }
    }
    
    this.existingImages = this.existingImages.filter(img => img.id !== imageId);
    console.log('Imagen existente removida:', imageId);
  }

  // ✅ CAMBIO: Validación para no eliminar si quedaría sin imágenes en modo edición
  removeNewFile(index: number): void {
    // Validación: No permitir eliminar si quedaría sin imágenes en modo edición
    if (this.isEditMode && this.selectedMediaType === 'image') {
      const totalAfterRemoval = this.getTotalImagesCount() - 1;
      if (totalAfterRemoval === 0) {
        this.snackBar.open('No puedes eliminar todas las imágenes. El banner debe tener al menos una imagen.', 'Cerrar', { duration: 5000 });
        return;
      }
    }
    
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
    console.log('Archivo nuevo removido:', index);
  }

  getTotalImagesCount(): number {
    return this.existingImages.length + this.selectedFiles.length;
  }

  getFileButtonText(): string {
    if (this.isFileInputDisabled) {
      return 'Selecciona tipo primero';
    }
    
    if (this.selectedMediaType === 'image') {
      const total = this.getTotalImagesCount();
      if (total >= 5) {
        return 'Máximo 5 imágenes alcanzado';
      }
      return `Agregar imagen${total > 0 ? 's' : ''} (${total}/5)`;
    }
    
    if (this.selectedMediaType === 'video') {
      return this.selectedFile || this.existingVideoUrl ? 'Cambiar video' : 'Seleccionar video';
    }
    
    return 'Seleccionar archivo';
  }

  private clearFileInput(input: HTMLInputElement): void {
    input.value = '';
  }

  private getVideoDuration(): void {
    if (this.selectedMediaType === 'video' && this.videoPreview) {
      const video = document.createElement('video');
      video.src = this.videoPreview as string;
      
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

  onImageLoaded(event: Event): void {
    console.log('Imagen cargada correctamente en preview');
  }

  onImageError(event: Event): void {
    console.error('Error cargando imagen en preview');
  }

  onVideoLoaded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    console.log('Video cargado correctamente en preview');
    
    if (!this.selectedFile && this.existingVideoUrl && !this.videoDuration) {
      this.videoDuration = Math.round(video.duration);
      this.publicidadForm.patchValue({ videoDuration: this.videoDuration });
      console.log('Duración extraída del video existente:', this.videoDuration);
    }
  }

  onVideoError(event: Event): void {
    console.error('Error cargando video en preview');
  }

  onTipoPublicidadChange(): void {
    const tipoSeleccionado = this.publicidadForm.get('tipoPublicidad')?.value;
    console.log('Tipo de publicidad cambiado a:', tipoSeleccionado);
    
    if (this.selectedFile || this.selectedFiles.length > 0) {
      const hasIncompatibleFiles = this.selectedFiles.some(file => {
        const validation = this.validateFile(file);
        return !validation.valid;
      }) || (this.selectedFile && !this.validateFile(this.selectedFile).valid);

      if (hasIncompatibleFiles) {
        // ✅ CAMBIO: Reemplazar alert con snackBar
        this.snackBar.open('Los archivos seleccionados no son compatibles con el nuevo tipo de publicidad', 'Cerrar', { duration: 5000 });
        this.eliminarMedia();
      }
    }
    
    this.updateIntervalValidations();
  }

  eliminarMedia(): void {
    if (this.selectedMediaType === 'video') {
      this.videoPreview = null;
      this.selectedFile = null;
      this.selectedFileName = null;
      this.videoDuration = null;
      this.existingVideoUrl = null;
    } else if (this.selectedMediaType === 'image') {
      this.selectedFiles = [];
      this.filePreviews = [];
      this.existingImages = [];
    }
    
    this.selectedMediaType = null;
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

  private buildFormData(): FormData {
    const formData = new FormData();
    
    // ✅ CORREGIDO: Obtener el valor del campo incluso si está deshabilitado
    const formValues = this.publicidadForm.getRawValue(); // getRawValue() incluye campos deshabilitados
    
    formData.append('nombre', formValues.nombre || '');
    formData.append('descripcion', formValues.descripcion || '');
    formData.append('tipo_publicidad', formValues.tipoPublicidad || '');
    formData.append('seccion', formValues.seccion || 'global');
    
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
      
      // Agregar múltiples imágenes
      this.selectedFiles.forEach((file, index) => {
        formData.append(`media_files`, file, file.name);
      });
      
      // En modo edición, indicar qué imágenes existentes mantener
      if (this.isEditMode) {
        const keepImageIds = this.existingImages.map(img => img.id);
        formData.append('keep_image_ids', JSON.stringify(keepImageIds));
      }
    }
    
    if (formValues.mediaType === 'video') {
      if (formValues.videoDuration) {
        formData.append('tiempo_visualizacion', formValues.videoDuration.toString());
      }
      
      if (this.selectedFile) {
        formData.append('media_file', this.selectedFile, this.selectedFile.name);
      }
    }

    return formData;
  }

  onSubmit(): void {
    if (this.publicidadForm.invalid) {
      // ✅ CAMBIO: Reemplazar alert con snackBar
      this.snackBar.open('Por favor, completa todos los campos requeridos.', 'Cerrar', { duration: 5000 });
      this.publicidadForm.markAllAsTouched();
      return;
    }

    // ✅ NUEVA VALIDACIÓN: Para creación
    if (!this.isEditMode) {
      if (this.selectedMediaType === 'image' && this.selectedFiles.length === 0) {
        this.snackBar.open('Por favor, selecciona al menos una imagen para la publicidad.', 'Cerrar', { duration: 5000 });
        return;
      }
      if (this.selectedMediaType === 'video' && !this.selectedFile) {
        this.snackBar.open('Por favor, selecciona un video para la publicidad.', 'Cerrar', { duration: 5000 });
        return;
      }
    }

    // ✅ NUEVA VALIDACIÓN: Para edición de banners
    if (this.isEditMode) {
      if (this.selectedMediaType === 'image') {
        const totalImages = this.getTotalImagesCount();
        if (totalImages === 0) {
          this.snackBar.open('El banner debe tener al menos una imagen. No puedes eliminar todas las imágenes.', 'Cerrar', { duration: 5000 });
          return;
        }
      }
      if (this.selectedMediaType === 'video' && !this.selectedFile && !this.existingVideoUrl) {
        this.snackBar.open('El video debe tener un archivo. No puedes eliminar el video sin reemplazarlo.', 'Cerrar', { duration: 5000 });
        return;
      }
    }

    this.mostrarDialogConfirmacion();
  }

  private mostrarDialogConfirmacion(): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'publicidad',
      action: this.isEditMode ? 'update' : 'create'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        // Usuario confirmó, proceder con la operación
        this.procesarFormulario();
      }
      // Si no confirmó, no hacer nada (el diálogo se cierra automáticamente)
    });
  }

  // ✅ NUEVO: Método para procesar el formulario después de la confirmación
  private procesarFormulario(): void {
    this.isLoading = true;
    const formData = this.buildFormData();

    if (this.isEditMode) {
      this.publicidadService.updatePublicidad(this.publicidadId!, formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Publicidad actualizada exitosamente', response);

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
          console.log('Publicidad creada exitosamente', response);

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
        this.navegarAListaPublicidad();
    });
  }

  private navegarAListaPublicidad(): void {
    this.router.navigate(['/administrador/gestion-publicidad/editar-eliminar']);
  }

  private handleSubmitError(error: ApiError): void {
    console.error('ERROR COMPLETO', error);
    
    if (error.errors && error.errors.length > 0) {
      const errorMessages = error.errors.map(e => `${e.field}: ${e.message}`).join('\n');
      // ✅ CAMBIO: Reemplazar alert con snackBar
      this.snackBar.open(`Errores de validación: ${errorMessages}`, 'Cerrar', { duration: 8000 });
    } else {
      const action = this.isEditMode ? 'actualizar' : 'crear';
      // ✅ CAMBIO: Reemplazar alert con snackBar
      this.snackBar.open(error.message || `Error al ${action} la publicidad.`, 'Cerrar', { duration: 5000 });
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

  // ✅ NUEVO GETTER: Para validar media en edición
  get hasValidMediaForEdit(): boolean {
    if (!this.isEditMode) {
      return this.hasMedia;
    }
    
    if (this.selectedMediaType === 'image') {
      return this.getTotalImagesCount() > 0;
    }
    if (this.selectedMediaType === 'video') {
      return !!(this.selectedFile || this.existingVideoUrl);
    }
    return false;
  }

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
        'Cambiar imágenes (opcional - JPG, PNG, GIF - máx. 50MB cada una)' :
        'Seleccionar imágenes (JPG, PNG, GIF - máx. 50MB cada una)';
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
    if (this.selectedMediaType === 'image') {
      return this.selectedFiles.length > 0 || this.existingImages.length > 0;
    }
    if (this.selectedMediaType === 'video') {
      return !!(this.selectedFile || this.existingVideoUrl);
    }
    return false;
  }

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

  get nombre() { return this.publicidadForm.get('nombre'); }
  get descripcion() { return this.publicidadForm.get('descripcion'); }
  get tipoPublicidad() { return this.publicidadForm.get('tipoPublicidad'); }
  get seccion() { return this.publicidadForm.get('seccion'); }
  get fechaInicial() { return this.publicidadForm.get('fechaInicial'); }
  get fechaFinal() { return this.publicidadForm.get('fechaFinal'); }
  get estado() { return this.publicidadForm.get('estado'); }
  get tiempoIntervaloValor() { return this.publicidadForm.get('tiempoIntervaloValor'); }
  get tiempoIntervaloUnidad() { return this.publicidadForm.get('tiempoIntervaloUnidad'); }
}