import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { ApiError } from '../../../models/marketing.model';
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
  providers: [
    provideNativeDateAdapter()
  ],
  templateUrl: './crear-publicidad.component.html',
  styleUrls: ['./crear-publicidad.component.scss']
})
export class CrearPublicidadComponent implements OnInit {

  publicidadForm!: FormGroup;
  mediaPreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  selectedMediaType: 'image' | 'video' | null = null;
  videoDuration: number | null = null;
  isLoading: boolean = false;
  
  // Estados disponibles (filtrados)
  estados: Estado[] = [];
  loadingEstados: boolean = false;

  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private publicidadService = inject(PublicidadService);

  constructor() { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadEstados();
  }

  private initializeForm(): void {
    this.publicidadForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      tipoPublicidad: ['banner', Validators.required],
      fechaInicial: [null, Validators.required],
      fechaFinal: [null, Validators.required],
      estado: [null, Validators.required], // CAMBIAR: será un ID, no string
      tiempoIntervaloValor: [5, [Validators.min(1)]],
      tiempoIntervaloUnidad: ['segundos', Validators.required],
      mediaType: [null],
      videoDuration: [null]
    });
  }

  // Cargar estados desde el backend y filtrar solo los que necesitamos
  
private loadEstados(): void {
  this.loadingEstados = true;
  this.publicidadService.getEstados().subscribe({
    next: (estados) => {
      console.log('=== ESTADOS CRUDOS DEL BACKEND ===');
      console.log('Estados recibidos:', estados);
      
      // Filtrar solo los estados que nos interesan
      this.estados = estados.filter(estado => 
        estado.nombre === 'Activado' || estado.nombre === 'Desactivado'
      );
      
      console.log('=== ESTADOS FILTRADOS ===');
      console.log('Estados filtrados:', this.estados);
      
      this.loadingEstados = false;
      
      // Setear valor por defecto (Activado)
      const estadoActivado = this.estados.find(e => e.nombre === 'Activado');
      console.log('=== ESTADO POR DEFECTO ===');
      console.log('Estado Activado encontrado:', estadoActivado);
      
      if (estadoActivado) {
        console.log('Seteando estado por defecto:', estadoActivado.id);
        this.publicidadForm.patchValue({ estado: estadoActivado.id });
        
        // Verificar que se seteo correctamente
        setTimeout(() => {
          const valorEnFormulario = this.publicidadForm.get('estado')?.value;
          console.log('Valor del estado en formulario después de patch:', valorEnFormulario);
          console.log('Tipo del valor en formulario:', typeof valorEnFormulario);
        }, 100);
      }
    },
    error: (error) => {
      console.error('Error al cargar estados:', error);
      this.loadingEstados = false;
      this.mostrarError('Error al cargar los estados disponibles');
    }
  });
}

  private updateIntervalValidations(): void {
    const valorControl = this.publicidadForm.get('tiempoIntervaloValor');
    const unidadControl = this.publicidadForm.get('tiempoIntervaloUnidad');
    
    if (this.selectedMediaType === 'image') {
      valorControl?.setValidators([Validators.required, Validators.min(1)]);
      unidadControl?.setValidators(Validators.required);
    } else {
      valorControl?.clearValidators();
      unidadControl?.clearValidators();
    }
    
    valorControl?.updateValueAndValidity({ emitEvent: false });
    unidadControl?.updateValueAndValidity({ emitEvent: false });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar archivo usando el servicio
      const validation = this.publicidadService.validateFile(file);
      if (!validation.valid) {
        this.mostrarError(validation.error!);
        return;
      }

      // Determinar tipo usando el servicio
      this.selectedMediaType = this.publicidadService.getMediaTypeFromFile(file);
      if (!this.selectedMediaType) {
        this.mostrarError('Tipo de archivo no soportado. Por favor selecciona una imagen o video.');
        return;
      }

      this.selectedFile = file;
      this.selectedFileName = file.name;
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

  formatDuration(seconds: number): string {
    return this.publicidadService.formatDuration(seconds);
  }

  eliminarMedia(): void {
    this.mediaPreview = null;
    this.selectedFile = null;
    this.selectedFileName = null;
    this.selectedMediaType = null;
    this.videoDuration = null;
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

  onSubmit(): void {
    if (this.publicidadForm.invalid) {
      this.mostrarError('Por favor, completa todos los campos requeridos.');
      this.publicidadForm.markAllAsTouched();
      return;
    }
    if (!this.selectedFile) {
      this.mostrarError('Por favor, selecciona una imagen o video para la publicidad.');
      return;
    }

    this.isLoading = true;

    // SIMPLIFICAR: Usar buildFormDataForCreate SIN conversión de estados
    const formData = this.publicidadService.buildFormDataForCreate(
      this.publicidadForm.value, 
      this.selectedFile
    );

    console.log('=== DATOS DEL FORMULARIO ===');
    console.log('Form values:', this.publicidadForm.value);
    console.log('Selected file:', this.selectedFile);

    console.log('=== FORMDATA ENVIADO ===');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ':', pair[1]);
    }

    // Llamar al servicio para crear la publicidad
    this.publicidadService.createPublicidad(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.mostrarExito('Publicidad creada exitosamente.');
        console.log('Publicidad creada:', response);
        this.router.navigate(['/administrador/gestion-publicidad']);
      },
      error: (error: ApiError) => {
        this.isLoading = false;
        console.error('=== ERROR COMPLETO ===', error);
        
        if (error.errors && error.errors.length > 0) {
          console.error('Errores específicos:', error.errors);
          const errorMessages = error.errors.map(e => `${e.field}: ${e.message}`).join('\n');
          this.mostrarError(`Errores de validación:\n${errorMessages}`);
        } else {
          this.mostrarError(error.message || 'Error al crear la publicidad.');
        }
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/administrador/gestion-publicidad']);
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

  // Getters para fácil acceso a los controles del formulario
  get nombre() { return this.publicidadForm.get('nombre'); }
  get descripcion() { return this.publicidadForm.get('descripcion'); }
  get tipoPublicidad() { return this.publicidadForm.get('tipoPublicidad'); }
  get fechaInicial() { return this.publicidadForm.get('fechaInicial'); }
  get fechaFinal() { return this.publicidadForm.get('fechaFinal'); }
  get estado() { return this.publicidadForm.get('estado'); }
  get tiempoIntervaloValor() { return this.publicidadForm.get('tiempoIntervaloValor'); }
  get tiempoIntervaloUnidad() { return this.publicidadForm.get('tiempoIntervaloUnidad'); }
}