import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Descomentar si usarás diálogos

// Angular Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core'; // O usa provideNativeDateAdapter si es standalone
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Para feedback de carga

// Shared Components
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';

// Services (Asegúrate de crear este servicio)
// import { PublicidadService } from '../../../services/publicidad.service';

// Models (Opcional, pero recomendado)
// import { Publicidad } from '../../../models/publicidad.model';

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
    // MatDialogModule, // Descomentar si usarás diálogos
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  providers: [
    provideNativeDateAdapter() // Necesario para MatDatepicker en componentes standalone
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
  isLoading: boolean = false; // Para mostrar spinner

  // Inyección de dependencias (estilo moderno con inject)
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  // private dialog = inject(MatDialog); // Descomentar si usarás diálogos
  // private publicidadService = inject(PublicidadService); // Descomentar cuando tengas el servicio

  constructor() { }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.publicidadForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      tipoPublicidad: ['banner', Validators.required],
      fechaInicial: [null, Validators.required],
      fechaFinal: [null, Validators.required],
      estado: ['activo', Validators.required],
      frecuenciaFinalizacion: ['intervalo', Validators.required],
      tiempoIntervaloValor: [5, [Validators.min(1)]],
      tiempoIntervaloUnidad: ['segundos', Validators.required],
      mediaType: [null] // Nueva propiedad para almacenar el tipo de media
    });

    // Validaciones condicionales para tiempoIntervalo según el tipo de media
    this.publicidadForm.get('frecuenciaFinalizacion')?.valueChanges.subscribe(value => {
      this.updateIntervalValidations();
    });
  }

  private updateIntervalValidations(): void {
    const valorControl = this.publicidadForm.get('tiempoIntervaloValor');
    const unidadControl = this.publicidadForm.get('tiempoIntervaloUnidad');
    const frecuencia = this.publicidadForm.get('frecuenciaFinalizacion')?.value;
    
    // Solo requerir tiempo de intervalo para imágenes con frecuencia de intervalo
    if (frecuencia === 'intervalo' && this.selectedMediaType === 'image') {
      valorControl?.setValidators([Validators.required, Validators.min(1)]);
      unidadControl?.setValidators(Validators.required);
    } else {
      valorControl?.clearValidators();
      unidadControl?.clearValidators();
    }
    valorControl?.updateValueAndValidity();
    unidadControl?.updateValueAndValidity();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Determinar el tipo de archivo
      const fileType = file.type;
      if (fileType.startsWith('image/')) {
        this.selectedMediaType = 'image';
      } else if (fileType.startsWith('video/')) {
        this.selectedMediaType = 'video';
      } else {
        this.mostrarError('Tipo de archivo no soportado. Por favor selecciona una imagen o video.');
        return;
      }

      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.publicidadForm.patchValue({ mediaType: this.selectedMediaType });
      
      const reader = new FileReader();
      reader.onload = () => {
        this.mediaPreview = reader.result;
      };
      reader.readAsDataURL(file);

      // Actualizar validaciones basadas en el tipo de media
      this.updateIntervalValidations();
    }
  }

  eliminarMedia(): void {
    this.mediaPreview = null;
    this.selectedFile = null;
    this.selectedFileName = null;
    this.selectedMediaType = null;
    this.publicidadForm.patchValue({ mediaType: null });
    
    // Resetear el input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    // Actualizar validaciones
    this.updateIntervalValidations();
  }

  onSubmit(): void {
    if (this.publicidadForm.invalid) {
      this.mostrarError('Por favor, completa todos los campos requeridos.');
      this.publicidadForm.markAllAsTouched(); // Marcar todos los campos como tocados para mostrar errores
      return;
    }
    if (!this.selectedFile) {
      this.mostrarError('Por favor, selecciona una imagen o video para la publicidad.');
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    Object.keys(this.publicidadForm.value).forEach(key => {
      let value = this.publicidadForm.value[key];
      // Formatear fechas si es necesario antes de enviar
      if ((key === 'fechaInicial' || key === 'fechaFinal') && value instanceof Date) {
        value = value.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }
      formData.append(key, value);
    });

    if (this.selectedFile) {
      formData.append('media', this.selectedFile, this.selectedFile.name);
    }

    console.log('Enviando datos:', this.publicidadForm.value);
    console.log('Tipo de media:', this.selectedMediaType);
    console.log('FormData:', formData); // Puedes inspeccionar FormData en la consola del navegador

    // Aquí llamarías a tu servicio para enviar los datos
    // this.publicidadService.crearPublicidad(formData).subscribe({
    //   next: (response) => {
    //     this.isLoading = false;
    //     this.mostrarExito('Publicidad creada exitosamente.');
    //     this.router.navigate(['/administrador/gestion-publicidad']); // O a donde quieras redirigir
    //   },
    //   error: (error) => {
    //     this.isLoading = false;
    //     console.error('Error al crear publicidad:', error);
    //     this.mostrarError(error.error?.message || error.error?.error || 'Error al crear la publicidad.');
    //   }
    // });

    // Simulación de llamada a API (reemplazar con la llamada real)
    setTimeout(() => {
      this.isLoading = false;
      this.mostrarExito('Publicidad creada exitosamente (simulación).');
      this.router.navigate(['/administrador/gestion-publicidad']);
    }, 2000);
  }

  onCancel(): void {
    this.router.navigate(['/administrador/gestion-publicidad']); // Ajusta la ruta si es necesario
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'] // Puedes definir esta clase en tu styles.scss global
    });
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'OK', {
      duration: 3000,
      panelClass: ['success-snackbar'] // Puedes definir esta clase en tu styles.scss global
    });
  }

  // Getters para fácil acceso a los controles del formulario en el template (opcional)
  get nombre() { return this.publicidadForm.get('nombre'); }
  get descripcion() { return this.publicidadForm.get('descripcion'); }
  get tipoPublicidad() { return this.publicidadForm.get('tipoPublicidad'); }
  get fechaInicial() { return this.publicidadForm.get('fechaInicial'); }
  get fechaFinal() { return this.publicidadForm.get('fechaFinal'); }
  get estado() { return this.publicidadForm.get('estado'); }
  get frecuenciaFinalizacion() { return this.publicidadForm.get('frecuenciaFinalizacion'); }
  get tiempoIntervaloValor() { return this.publicidadForm.get('tiempoIntervaloValor'); }
  get tiempoIntervaloUnidad() { return this.publicidadForm.get('tiempoIntervaloUnidad'); }
}