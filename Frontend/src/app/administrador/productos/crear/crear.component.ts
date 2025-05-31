import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormArray } from '@angular/forms'; // Agregar FormArray
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox'; // Agregar para mat-checkbox
import { CommonModule } from '@angular/common';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { CatalogoService } from '../../../services/catalogo.service'; 
import { Producto, Categoria, Estado } from '../../../models/catalogo.model'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatSelectModule, 
    MatButtonModule, 
    MatCheckboxModule, // Agregar MatCheckboxModule
    HeaderAdminComponent, 
    FooterAdminComponent
  ],
  templateUrl: './crear.component.html',
  styleUrls: ['./crear.component.scss']
})
export class CrearComponent implements OnInit {
  productoForm: FormGroup;
  categorias: any[] = [];
  estados: any[] = [];
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  ingredientes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private catalogoService: CatalogoService,
    private router: Router
  ) {
    this.productoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      categoria: ['', Validators.required],
      precio: ['', [
      Validators.required, 
      Validators.pattern(/^\d+(\.\d{1,2})?$/),
      Validators.min(0.01)  // Mínimo 0.01 (1 centavo)
    ]],
      disponibilidad: ['', Validators.required],
      imagen: [null, Validators.required],
      ingredientesSeleccionados: this.fb.array([])
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
    if (this.selectedFile) {
      // ← VALIDAR TIPO DE ARCHIVO
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(this.selectedFile.type)) {
        alert('⚠️ Solo se permiten archivos de imagen (JPG, PNG, GIF)');
        this.eliminarImagen();
        return;
      }

      // ← VALIDAR TAMAÑO (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (this.selectedFile.size > maxSize) {
        alert('⚠️ La imagen no puede ser mayor a 5MB');
        this.eliminarImagen();
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      }
      reader.readAsDataURL(this.selectedFile);
      
      // ← ACTUALIZAR EL CONTROL DEL FORMULARIO
      this.productoForm.get('imagen')?.setValue(this.selectedFile);
      this.productoForm.get('imagen')?.markAsTouched();
    }
  }

  ngOnInit(): void {
    this.catalogoService.getCategorias().subscribe(data => {
      this.categorias = data;
    });

    this.catalogoService.getEstados().subscribe(data => {
      this.estados = data;
    });
  }

  onCategoriaSeleccionada(event: MatSelectChange): void {
    const categoriaId = event.value;
    const categoria = this.categorias.find(cat => cat.id === categoriaId);

    if (categoria) {
      this.cargarIngredientesPorCategoria(categoria.nombre);
    } else {
      this.ingredientes = [];
    }
  }

  getFullImageUrl(imagenUrl: string | undefined): string {
    return this.catalogoService.getFullImageUrl(imagenUrl);
  }

  cargarIngredientesPorCategoria(categoriaNombre: string): void {
    const categoriaMap: { [key: string]: string } = {
      'Hamburguesa': 'hamburguesas',
      'Pizza': 'pizzas',
      'Ensalada': 'ensaladas',
      'Pollo': 'pollo',
      'Postre': 'postres',
      'Bebida': 'bebidas'
    };

    const categoriaBackend = categoriaMap[categoriaNombre] || 'general';

    this.catalogoService.getIngredientesPorCategoria(categoriaBackend)
      .subscribe(ingredientes => {
        this.ingredientes = ingredientes;
        this.ingredientesSeleccionadosFormArray.clear();
        this.ingredientes.forEach(() => this.ingredientesSeleccionadosFormArray.push(new FormControl(false)));
        console.log('Ingredientes para', categoriaNombre, ':', ingredientes);
      });
  }

  get ingredientesSeleccionadosFormArray(): FormArray {
    return this.productoForm.get('ingredientesSeleccionados') as FormArray;
  }


  eliminarImagen(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    // ← LIMPIAR EL CONTROL Y MARCARLO COMO TOCADO PARA MOSTRAR ERROR
    this.productoForm.get('imagen')?.setValue(null);
    this.productoForm.get('imagen')?.markAsTouched();
  }

  // ← AGREGAR MÉTODOS PARA MOSTRAR ERRORES
  get nombreError(): string {
    const control = this.productoForm.get('nombre');
    if (control?.hasError('required') && control?.touched) {
      return 'El nombre es obligatorio';
    }
    return '';
  }

  get descripcionError(): string {
    const control = this.productoForm.get('descripcion');
    if (control?.hasError('required') && control?.touched) {
      return 'La descripción es obligatoria';
    }
    return '';
  }

  get categoriaError(): string {
    const control = this.productoForm.get('categoria');
    if (control?.hasError('required') && control?.touched) {
      return 'La categoría es obligatoria';
    }
    return '';
  }

  get precioError(): string {
    const control = this.productoForm.get('precio');
    if (control?.hasError('required') && control?.touched) {
      return 'El precio es obligatorio';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'El precio debe ser un número válido';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'El precio debe ser mayor a 0';
    }
    return '';
  }

  get disponibilidadError(): string {
    const control = this.productoForm.get('disponibilidad');
    if (control?.hasError('required') && control?.touched) {
      return 'La disponibilidad es obligatoria';
    }
    return '';
  }

  onSubmit(): void {
    if (this.productoForm.valid) {
      const formData = new FormData();
      formData.append('nombre', this.productoForm.get('nombre')?.value);
      formData.append('descripcion', this.productoForm.get('descripcion')?.value);
      formData.append('categoria', this.productoForm.get('categoria')?.value);
      formData.append('precio', this.productoForm.get('precio')?.value);
      formData.append('estado', this.productoForm.get('disponibilidad')?.value);

      if (this.selectedFile) {
        formData.append('imagen', this.selectedFile, this.selectedFile.name);
      }

      const ingredientesSeleccionados = this.ingredientesSeleccionadosFormArray.value
        .map((seleccionado: boolean, index: number) => seleccionado ? this.ingredientes[index].id : null)
        .filter((val: any) => val !== null);

      formData.append('ingredientes', JSON.stringify(ingredientesSeleccionados));

      this.catalogoService.crearProducto(formData).subscribe({
        next: (response) => {
          console.log('✅ Producto creado exitosamente', response);
          
          // ← MOSTRAR MENSAJE DE ÉXITO Y LIMPIAR FORMULARIO EN LUGAR DE REDIRIGIR
          alert('🎉 Producto creado exitosamente!');
          
          // Limpiar el formulario para crear otro producto
          this.limpiarFormulario();
          
          // ← COMENTAR O ELIMINAR LA REDIRECCIÓN
          // this.router.navigate(['/administrador/gestion-productos']);
        },
        error: (error) => {
          console.error('❌ Error al crear el producto', error);
          alert('❌ Error al crear el producto. Revisa los datos e intenta nuevamente.');
        }
      });
    } else {
      // ← AGREGAR VALIDACIÓN CUANDO EL FORMULARIO NO ES VÁLIDO
      alert('⚠️ Por favor completa todos los campos requeridos');
      this.marcarCamposComoTocados();
    }
  }

  // ← AGREGAR MÉTODO PARA LIMPIAR EL FORMULARIO
  private limpiarFormulario(): void {
    this.productoForm.reset();
    this.imagePreview = null;
    this.selectedFile = null;
    this.ingredientes = [];
    this.ingredientesSeleccionadosFormArray.clear();
    
    // Resetear valores por defecto si es necesario
    this.productoForm.patchValue({
      ingredientesSeleccionados: this.fb.array([])
    });
  }

  // ← AGREGAR MÉTODO PARA MARCAR CAMPOS COMO TOCADOS (MOSTRAR ERRORES)
  private marcarCamposComoTocados(): void {
    Object.keys(this.productoForm.controls).forEach(key => {
      const control = this.productoForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }
}