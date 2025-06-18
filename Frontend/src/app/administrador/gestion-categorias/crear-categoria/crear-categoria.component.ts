// ✅ ACTUALIZAR Frontend/src/app/administrador/gestion-categorias/crear-categoria/crear-categoria.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoriaService, Categoria } from '../../../services/categoria.service';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component'; // ✅ RUTA CORRECTA
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';

@Component({
  selector: 'app-crear-categoria',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  templateUrl: './crear-categoria.component.html',
  styleUrls: ['./crear-categoria.component.scss']
})
export class CrearCategoriaComponent implements OnInit {
  categoriaForm: FormGroup;
  isEditMode = false;
  categoriaId: number | null = null;
  loading = false;
  error: string | null = null;
  
  // Manejo de imagen
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  imagenActual: string | null = null;

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    public router: Router, // ✅ Cambiar a public para usar en template
    private route: ActivatedRoute
  ) {
    this.categoriaForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]]
    });
  }

  ngOnInit(): void {
    // Verificar si estamos en modo edición
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.categoriaId = +params['id'];
        this.cargarCategoria();
      }
    });
  }

  // ✅ CARGAR CATEGORÍA PARA EDICIÓN
  cargarCategoria(): void {
    if (!this.categoriaId) return;

    this.loading = true;
    console.log(`🔍 Cargando categoría ID: ${this.categoriaId}`);

    this.categoriaService.getCategoria(this.categoriaId).subscribe({
      next: (categoria) => {
        this.categoriaForm.patchValue({
          nombre: categoria.nombre
        });

        // Cargar imagen actual
        if (categoria.imagen_url) {
          this.imagenActual = this.categoriaService.getFullImageUrl(categoria.imagen_url);
        }

        this.loading = false;
        console.log('✅ Categoría cargada para edición');
      },
      error: (error) => {
        this.error = error.message;
        this.loading = false;
        console.error('❌ Error cargando categoría:', error);
      }
    });
  }

  // ✅ MANEJO DE IMAGEN
  onImagenSeleccionada(event: any): void {
    const archivo = event.target.files[0];
    if (!archivo) return;

    // Validar tipo de archivo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      alert('Solo se permiten imágenes (JPG, PNG, WEBP)');
      return;
    }

    // Validar tamaño (5MB máximo)
    const tamañoMaximo = 5 * 1024 * 1024; // 5MB
    if (archivo.size > tamañoMaximo) {
      alert('La imagen no puede superar los 5MB');
      return;
    }

    this.imagenSeleccionada = archivo;

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagenPreview = e.target.result;
    };
    reader.readAsDataURL(archivo);

    console.log('📸 Imagen seleccionada:', archivo.name);
  }

  // ✅ QUITAR IMAGEN
  quitarImagen(): void {
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    
    // Reset del input file
    const inputFile = document.getElementById('imagen') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  }

  // ✅ GUARDAR CATEGORÍA
  guardarCategoria(): void {
    if (this.categoriaForm.invalid) {
      this.marcarCamposInvalidos();
      return;
    }

    this.loading = true;
    this.error = null;

    const formData = this.categoriaService.crearFormData(
      this.categoriaForm.value,
      this.imagenSeleccionada || undefined
    );

    const operacion = this.isEditMode ? 
      this.categoriaService.actualizarCategoria(this.categoriaId!, formData) :
      this.categoriaService.crearCategoria(formData);

    const accion = this.isEditMode ? 'actualizando' : 'creando';
    console.log(`💾 ${accion} categoría...`);

    operacion.subscribe({
      next: (response) => {
        if (response.success) {
          const mensaje = this.isEditMode ? 'actualizada' : 'creada';
          console.log(`✅ Categoría ${mensaje} exitosamente`);
          alert(response.mensaje);
          this.router.navigate(['/administrador/gestion-categorias']);
        } else {
          this.error = response.error || 'Error al guardar categoría';
          this.loading = false;
        }
      },
      error: (error) => {
        this.error = error.message;
        this.loading = false;
        console.error(`❌ Error ${accion} categoría:`, error);
      }
    });
  }

  // ✅ HELPERS
  marcarCamposInvalidos(): void {
    Object.keys(this.categoriaForm.controls).forEach(key => {
      const control = this.categoriaForm.get(key);
      if (control && control.invalid) {
        control.markAsTouched();
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.categoriaForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.categoriaForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} es obligatorio`;
    if (field.errors['minlength']) return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `${fieldName} no puede superar ${field.errors['maxlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }

  // ✅ NAVEGACIÓN
  cancelar(): void {
    const confirmacion = confirm('¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.');
    if (confirmacion) {
      this.router.navigate(['/administrador/gestion-categorias']);
    }
  }

  // ✅ TÍTULO DINÁMICO
  getTitulo(): string {
    return this.isEditMode ? 'Editar Categoría' : 'Nueva Categoría';
  }

  getBotonTexto(): string {
    return this.loading ? 
      (this.isEditMode ? 'Actualizando...' : 'Creando...') :
      (this.isEditMode ? 'Actualizar Categoría' : 'Crear Categoría');
  }
}