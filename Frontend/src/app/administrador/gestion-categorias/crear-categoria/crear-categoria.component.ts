import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CategoriaService, Categoria } from '../../../services/categoria.service';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';

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
  
  categoriaActual: Categoria | null = null;
  // ✅ AGREGAR para mensajes informativos
  mensaje: string | null = null;
  tipoMensaje: 'info' | 'warning' | 'success' | 'error' = 'info';
  // Manejo de imagen
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  imagenActual: string | null = null;

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    public router: Router, // ✅ Cambiar a public para usar en template
    private route: ActivatedRoute,
    private dialog: MatDialog
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
        // ✅ GUARDAR categoría original para comparación
        this.categoriaActual = categoria;
        
        this.categoriaForm.patchValue({
          nombre: categoria.nombre
        });

        // Cargar imagen actual
        if (categoria.imagen_url) {
          this.imagenActual = this.categoriaService.getFullImageUrl(categoria.imagen_url);
        }

        this.loading = false;
        console.log('✅ Categoría cargada para edición:', categoria);
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

  // ✅ GUARDAR CATEGORÍA CON DIÁLOGO DE CONFIRMACIÓN
  guardarCategoria(): void {
    if (this.categoriaForm.invalid) {
      this.marcarCamposInvalidos();
      return;
    }

    // Verificar cambios
    if (this.isEditMode && !this.hayCambios()) {
      this.mostrarMensaje('No se han realizado cambios en la categoría', 'info');
      setTimeout(() => this.ocultarMensaje(), 3000);
      return;
    }

    // ✅ NUEVO: Mostrar diálogo de confirmación antes de procesar
    this.mostrarDialogConfirmacion();
  }

  // ✅ NUEVO: Método para mostrar diálogo de confirmación
  private mostrarDialogConfirmacion(): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'categoría',
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
    this.loading = true;
    this.error = null;
    this.ocultarMensaje();

    // ✅ CREAR FormData más inteligente
    const formData = new FormData();
    
    // Siempre agregar el nombre
    formData.append('nombre', this.categoriaForm.get('nombre')?.value || '');
    
    // ✅ SOLO agregar imagen si se seleccionó una nueva
    if (this.imagenSeleccionada) {
      formData.append('imagen', this.imagenSeleccionada);
      console.log('📸 Agregando nueva imagen al FormData');
    }
    // ✅ NO agregar imagen si no se cambió - el backend mantendrá la actual

    // Agregar ID en modo edición
    if (this.isEditMode && this.categoriaId) {
      formData.append('id', this.categoriaId.toString());
    }

    // Log para debug
    console.log('📋 FormData enviado:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    const operacion = this.isEditMode ? 
      this.categoriaService.actualizarCategoria(this.categoriaId!, formData) :
      this.categoriaService.crearCategoria(formData);

    const accion = this.isEditMode ? 'actualizando' : 'creando';
    console.log(`💾 ${accion} categoría...`);

    operacion.subscribe({
      next: (response) => {
        this.loading = false;
        console.log('📥 Respuesta completa:', response);
        
        // ✅ SOLUCIÓN SIMPLE: Si no hay error, es éxito
        if (response.success !== false && !response.error) {
          const mensaje = this.isEditMode ? 'actualizada' : 'creada';
          console.log(`✅ Categoría ${mensaje} exitosamente`);
          
          const textoMensaje = response.mensaje || `Categoría ${mensaje} exitosamente`;
          this.mostrarDialogExito(textoMensaje);
        } else {
          // Solo es error si realmente hay un error
          this.error = response.error || response.mensaje || 'Error desconocido al guardar categoría';
          console.error('❌ Error en respuesta:', response);
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message || 'Error de conexión';
        console.error(`❌ Error ${accion} categoría:`, error);
        
        if (error.error) {
          console.error('❌ Detalles del error:', error.error);
        }
      }
    });
  }

  // ✅ NUEVO: Método para mostrar diálogo de éxito
  private mostrarDialogExito(mensaje: string): void {
    const dialogData: SuccessDialogData = {
      title: this.isEditMode ? 'Categoría Actualizada' : 'Categoría Creada',
      message: mensaje,
      buttonText: 'Continuar'
    };

    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['/administrador/gestion-categorias']);
    });
  }


  // ✅ NUEVO MÉTODO: Verificar si hay cambios reales
  private hayCambios(): boolean {
    const nombreActual = this.categoriaForm.get('nombre')?.value;
    const nombreOriginal = this.categoriaActual?.nombre; // Necesitas guardar la categoría original
    
    const nombreCambio = nombreActual !== nombreOriginal;
    const imagenCambio = this.imagenSeleccionada !== null;
    
    console.log('🔍 Verificando cambios:', {
      nombreOriginal,
      nombreActual,
      nombreCambio,
      imagenCambio,
      hayCambios: nombreCambio || imagenCambio
    });
    
    return nombreCambio || imagenCambio;
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

  // ✅ NAVEGACIÓN SIN CONFIRMACIÓN
  cancelar(): void {
    this.router.navigate(['/administrador/gestion-categorias']);
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

  // ✅ NUEVOS MÉTODOS para manejar mensajes
  private mostrarMensaje(texto: string, tipo: 'info' | 'warning' | 'success' | 'error'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    console.log(`💬 Mensaje ${tipo}: ${texto}`);
  }

  public ocultarMensaje(): void {
    this.mensaje = null;
  }

  public getMensajeIcon(): string {
    switch (this.tipoMensaje) {
      case 'info': return 'info';
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  }
}