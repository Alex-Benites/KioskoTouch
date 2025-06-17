import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';
import { CatalogoService } from '../../../services/catalogo.service';
import { Ingrediente, Estado } from '../../../models/catalogo.model';

@Component({
  selector: 'app-crear-ingrediente',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,  // ✅ AGREGAR ESTA LÍNEA
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  templateUrl: './crear-ingrediente.component.html',
  styleUrl: './crear-ingrediente.component.scss'
})
export class CrearIngredienteComponent implements OnInit {
  
  private fb = inject(FormBuilder);
  private catalogoService = inject(CatalogoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  ingredienteForm: FormGroup;
  estados: Estado[] = [];
  categorias: any[] = [];  // ✅ CAMBIO: Hacer dinámico
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  isEditMode = false;
  ingredienteId: number | null = null;
  currentImageUrl: string | null = null;
  saving = false;
  cargandoCategorias = false;  // ✅ NUEVO: Estado de carga

  // ✅ MANTENER: Unidades de medida (estas están bien)
  unidadesMedida = [
    { value: 'unidades', label: 'Unidades' },
    { value: 'gramos', label: 'Gramos (g)' },
    { value: 'kilogramos', label: 'Kilogramos (kg)' },
    { value: 'litros', label: 'Litros (L)' },
    { value: 'mililitros', label: 'Mililitros (mL)' },
    { value: 'porciones', label: 'Porciones' },
    { value: 'rebanadas', label: 'Rebanadas' },
    { value: 'piezas', label: 'Piezas' }
  ];

  constructor() {
    this.ingredienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      categoria_producto: ['', Validators.required],  // ✅ CAMBIO: Sin valor por defecto
      precio_adicional: ['0.00', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0)
      ]],
      stock: ['0', [
        Validators.required,
        Validators.pattern(/^\d+$/),
        Validators.min(0)
      ]],
      stock_minimo: ['5', [
        Validators.required,
        Validators.pattern(/^\d+$/),
        Validators.min(1)
      ]],
      unidad_medida: ['unidades', Validators.required],
      estado: ['', Validators.required],
      imagen: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    // Verificar si estamos en modo edición
    this.ingredienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.ingredienteId && !isNaN(this.ingredienteId);

    console.log('🔧 Inicializando componente crear ingrediente');
    console.log('   Modo edición:', this.isEditMode);
    console.log('   ID ingrediente:', this.ingredienteId);

    // ✅ NUEVO: Cargar categorías dinámicamente
    this.cargarCategorias();

    // Cargar estados
    this.catalogoService.getEstados().subscribe({
      next: (data) => {
        this.estados = data;
        console.log('✅ Estados cargados:', data.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar estados:', error);
      }
    });

    // Si estamos en modo edición, cargar el ingrediente
    if (this.isEditMode) {
      this.cargarIngredienteParaEditar();
    }
  }

  // ✅ NUEVO: Método para cargar categorías dinámicamente
  private cargarCategorias(): void {
    this.cargandoCategorias = true;
    console.log('📂 Cargando categorías desde la base de datos...');

    this.catalogoService.getCategorias().subscribe({
      next: (categorias) => {
        // ✅ CORREGIR: Quitar filtro por 'activo' ya que no existe ese campo
        this.categorias = categorias
          .map(cat => ({
            value: cat.nombre.toLowerCase(),
            label: cat.nombre
          }))
          .sort((a, b) => a.label.localeCompare(b.label));  // Ordenar alfabéticamente

        this.cargandoCategorias = false;
        console.log('✅ Categorías cargadas:', this.categorias);

        // ✅ NUEVO: Establecer primera categoría como predeterminada si no es modo edición
        if (!this.isEditMode && this.categorias.length > 0) {
          this.ingredienteForm.patchValue({
            categoria_producto: this.categorias[0].value
          });
          console.log('🎯 Categoría predeterminada establecida:', this.categorias[0].value);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
        this.cargandoCategorias = false;
        
        // ✅ FALLBACK: Usar categorías básicas si falla la carga
        this.categorias = [
          { value: 'general', label: 'General' }
        ];
        console.log('⚠️ Usando categoría fallback');
      }
    });
  }

  private cargarIngredienteParaEditar(): void {
    if (!this.ingredienteId) return;

    console.log('🔄 Cargando ingrediente para editar, ID:', this.ingredienteId);

    this.catalogoService.obtenerIngredientePorId(this.ingredienteId).subscribe({
      next: (ingrediente) => {
        console.log('✅ Ingrediente cargado:', ingrediente);

        this.ingredienteForm.patchValue({
          nombre: ingrediente.nombre,
          descripcion: ingrediente.descripcion,
          categoria_producto: ingrediente.categoria_producto?.toLowerCase() || '',  // ✅ CORREGIR: Convertir a minúsculas
          precio_adicional: ingrediente.precio_adicional,
          stock: ingrediente.stock,
          stock_minimo: ingrediente.stock_minimo,
          unidad_medida: ingrediente.unidad_medida,
          estado: ingrediente.estado
        });

        // Manejar imagen actual
        if (ingrediente.imagen_url) {
          this.currentImageUrl = this.catalogoService.getFullImageUrl(ingrediente.imagen_url);
          this.imagePreview = this.currentImageUrl;
          
          // Quitar validación obligatoria de imagen para edición
          this.ingredienteForm.get('imagen')?.clearValidators();
          this.ingredienteForm.get('imagen')?.updateValueAndValidity();
        }

        console.log('✅ Ingrediente cargado completamente para edición');
      },
      error: (error) => {
        console.error('❌ Error al cargar ingrediente:', error);
        alert('❌ Error al cargar el ingrediente. Redirigiendo...');
        this.router.navigate(['/administrador/gestion-ingredientes']);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Validar que sea una imagen
      if (!this.selectedFile.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        this.selectedFile = null;
        return;
      }

      // Crear URL para vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        
        // Actualizar el valor del control del formulario
        this.ingredienteForm.patchValue({ imagen: this.selectedFile });
      };
      reader.readAsDataURL(this.selectedFile);
      
      console.log('🖼️ Imagen seleccionada:', this.selectedFile.name);
    }
  }

  eliminarImagen(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.currentImageUrl = null;

    this.ingredienteForm.get('imagen')?.setValue(null);
    if (!this.isEditMode) {
      this.ingredienteForm.get('imagen')?.markAsTouched();
    }
  }

  onSubmit(): void {
    if (this.ingredienteForm.valid || (this.isEditMode && this.validarFormularioParaEdicion())) {
      this.saving = true;

      const formData = new FormData();
      formData.append('nombre', this.ingredienteForm.get('nombre')?.value);
      formData.append('descripcion', this.ingredienteForm.get('descripcion')?.value);
      formData.append('categoria_producto', this.ingredienteForm.get('categoria_producto')?.value);
      formData.append('precio_adicional', this.ingredienteForm.get('precio_adicional')?.value);
      formData.append('stock', this.ingredienteForm.get('stock')?.value);
      formData.append('stock_minimo', this.ingredienteForm.get('stock_minimo')?.value);
      formData.append('unidad_medida', this.ingredienteForm.get('unidad_medida')?.value);
      formData.append('estado', this.ingredienteForm.get('estado')?.value);

      // Solo agregar imagen si hay una nueva seleccionada
      if (this.selectedFile) {
        formData.append('imagen', this.selectedFile, this.selectedFile.name);
      }

      console.log('📤 Enviando datos del ingrediente');

      if (this.isEditMode) {
        this.actualizarIngrediente(formData);
      } else {
        this.crearIngrediente(formData);
      }
    } else {
      this.ingredienteForm.markAllAsTouched();
      alert('⚠️ Por favor completa todos los campos requeridos');
    }
  }

  private validarFormularioParaEdicion(): boolean {
    const nombre = this.ingredienteForm.get('nombre')?.value;
    const descripcion = this.ingredienteForm.get('descripcion')?.value;
    const categoria = this.ingredienteForm.get('categoria_producto')?.value;
    const precio = this.ingredienteForm.get('precio_adicional')?.value;
    const stock = this.ingredienteForm.get('stock')?.value;
    const stock_minimo = this.ingredienteForm.get('stock_minimo')?.value;
    const unidad_medida = this.ingredienteForm.get('unidad_medida')?.value;
    const estado = this.ingredienteForm.get('estado')?.value;

    return nombre && descripcion && categoria && precio !== null && 
           stock !== null && stock_minimo !== null && unidad_medida && estado;
  }

  private crearIngrediente(formData: FormData): void {
    this.catalogoService.crearIngrediente(formData).subscribe({
      next: (response) => {
        console.log('✅ Ingrediente creado exitosamente', response);
        this.saving = false;

        this.mostrarDialogExito(
          'CREADO',
          '¡El ingrediente ha sido creado exitosamente!',
          'Continuar'
        );
      },
      error: (error) => {
        console.error('❌ Error al crear el ingrediente', error);
        alert('❌ Error al crear el ingrediente. Revisa los datos e intenta nuevamente.');
        this.saving = false;
      }
    });
  }

  private actualizarIngrediente(formData: FormData): void {
    if (!this.ingredienteId) return;

    this.catalogoService.actualizarIngrediente(this.ingredienteId, formData).subscribe({
      next: (response) => {
        console.log('✅ Ingrediente actualizado exitosamente', response);
        this.saving = false;

        this.mostrarDialogExito(
          'ACTUALIZADO',
          '¡El ingrediente ha sido actualizado exitosamente!',
          'Continuar'
        );
      },
      error: (error) => {
        console.error('❌ Error al actualizar el ingrediente', error);
        alert('❌ Error al actualizar el ingrediente. Revisa los datos e intenta nuevamente.');
        this.saving = false;
      }
    });
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
        this.navegarAListaIngredientes();
      } else {
        this.limpiarFormulario();
      }
    });
  }

  private navegarAListaIngredientes(): void {
    this.router.navigate(['/administrador/gestion-ingredientes']);
  }

  private limpiarFormulario(): void {
    this.ingredienteForm.reset();
    this.imagePreview = null;
    this.selectedFile = null;
    this.currentImageUrl = null;

    // ✅ CAMBIO: Establecer primera categoría disponible como predeterminada
    const primeraCategoria = this.categorias.length > 0 ? this.categorias[0].value : '';
    
    this.ingredienteForm.patchValue({
      categoria_producto: primeraCategoria,
      precio_adicional: '0.00',
      stock: '0',
      stock_minimo: '5',
      unidad_medida: 'unidades',
      estado: ''
    });
    
    console.log('🔄 Formulario limpiado, categoría predeterminada:', primeraCategoria);
  }

  volver(): void {
    this.router.navigate(['/administrador/gestion-ingredientes']);
  }

  // Getters para errores
  get nombreError(): string {
    const control = this.ingredienteForm.get('nombre');
    if (control?.hasError('required') && control?.touched) {
      return 'El nombre es obligatorio';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    return '';
  }

  get descripcionError(): string {
    const control = this.ingredienteForm.get('descripcion');
    if (control?.hasError('required') && control?.touched) {
      return 'La descripción es obligatoria';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'La descripción debe tener al menos 5 caracteres';
    }
    return '';
  }

  get categoriaError(): string {
    const control = this.ingredienteForm.get('categoria_producto');
    if (control?.hasError('required') && control?.touched) {
      return 'La categoría es obligatoria';
    }
    return '';
  }

  get precioError(): string {
    const control = this.ingredienteForm.get('precio_adicional');
    if (control?.hasError('required') && control?.touched) {
      return 'El precio adicional es obligatorio';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'El precio debe ser un número válido';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'El precio debe ser mayor o igual a 0';
    }
    return '';
  }

  get estadoError(): string {
    const control = this.ingredienteForm.get('estado');
    if (control?.hasError('required') && control?.touched) {
      return 'El estado es obligatorio';
    }
    return '';
  }

  get imagenError(): string {
    const control = this.ingredienteForm.get('imagen');
    if (control?.hasError('required') && control?.touched && !this.isEditMode) {
      return 'La imagen es obligatoria';
    }
    return '';
  }

  // ✅ AGREGAR GETTERS PARA ERRORES DE STOCK
  get stockError(): string {
    const control = this.ingredienteForm.get('stock');
    if (control?.hasError('required') && control?.touched) {
      return 'El stock es obligatorio';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'El stock debe ser un número entero';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'El stock debe ser mayor o igual a 0';
    }
    return '';
  }

  get stockMinimoError(): string {
    const control = this.ingredienteForm.get('stock_minimo');
    if (control?.hasError('required') && control?.touched) {
      return 'El stock mínimo es obligatorio';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'El stock mínimo debe ser un número entero';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'El stock mínimo debe ser mayor a 0';
    }
    return '';
  }

  get unidadMedidaError(): string {
    const control = this.ingredienteForm.get('unidad_medida');
    if (control?.hasError('required') && control?.touched) {
      return 'La unidad de medida es obligatoria';
    }
    return '';
  }
}
