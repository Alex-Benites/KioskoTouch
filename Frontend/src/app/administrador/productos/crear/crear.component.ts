import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { SuccessPopupComponent } from '../../../shared/success-popup/success-popup.component'; // ← AGREGAR IMPORT
import { CatalogoService } from '../../../services/catalogo.service';
import { Producto, Categoria, Estado } from '../../../models/catalogo.model';
import { Router, ActivatedRoute } from '@angular/router';

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
    MatCheckboxModule,
    HeaderAdminComponent,
    FooterAdminComponent,
    SuccessPopupComponent  // ← AGREGAR AQUÍ
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
  // Nuevas propiedades para modo edición
  ingredientesDisponibles: any[] = [];
  ingredientesSeleccionados: any[] = [];
  isEditMode = false;
  productoId: number | null = null;
  currentImageUrl: string | null = null; // Para mostrar imagen actual
  saving = false;

  // 🆕 Agregar estas propiedades para el popup
  mostrarPopupExito: boolean = false;
  tituloPopup: string = '';
  mensajePopup: string = '';

  constructor(
    private fb: FormBuilder,
    private catalogoService: CatalogoService,
    private router: Router,
    private route: ActivatedRoute
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
    // Verificar si estamos en modo edición
    this.productoId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.productoId && !isNaN(this.productoId);

    // Cargar datos necesarios
    this.catalogoService.getCategorias().subscribe(data => {
      this.categorias = data;
    });

    this.catalogoService.getEstados().subscribe(data => {
      this.estados = data;
    });

    // Si estamos en modo edición, cargar el producto
    if (this.isEditMode) {
      this.cargarProductoParaEditar();
    }
  }


  // Método para cargar producto en modo edición
  private cargarProductoParaEditar(): void {
    if (!this.productoId) return;

    console.log('🔄 Cargando producto para editar, ID:', this.productoId);

    this.catalogoService.obtenerProductoPorId(this.productoId).subscribe({
      next: (producto) => {
        console.log('✅ Producto cargado completo:', producto);

        // 📝 Llenar formulario con datos básicos
        this.productoForm.patchValue({
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          categoria: producto.categoria,        // ✅ ID: 1
          disponibilidad: producto.estado      // ✅ ID: 1
        });

        // 🔒 DESHABILITAR categoría en modo edición
        this.productoForm.get('categoria')?.disable();
        console.log('🔒 Campo categoría deshabilitado para edición');

        console.log('📝 Formulario rellenado con:', {
          nombre: producto.nombre,
          categoria: producto.categoria,
          estado: producto.estado,
          precio: producto.precio
        });

        // 🖼️ Manejar imagen actual
        if (producto.imagen_url) {
          this.currentImageUrl = this.catalogoService.getFullImageUrl(producto.imagen_url);
          this.imagePreview = this.currentImageUrl;
          console.log('🖼️ Imagen cargada:', this.currentImageUrl);

          // Quitar validación obligatoria de imagen para edición
          this.productoForm.get('imagen')?.clearValidators();
          this.productoForm.get('imagen')?.updateValueAndValidity();
        }

        // 🥗 Cargar ingredientes - usar "hamburguesas" directamente
        console.log('🥗 Categoria del producto:', producto.categoria_nombre);
        console.log('🥗 Ingredientes actuales:', producto.ingredientes_detalle);

        // Convertir categoria_nombre a la categoría de ingredientes
        let categoriaIngredientes = '';
        if (producto.categoria_nombre === 'Hamburguesa') {
          categoriaIngredientes = 'hamburguesas';
        } else if (producto.categoria_nombre === 'Pizza' || producto.categoria_nombre === 'Pizzas') {
          categoriaIngredientes = 'pizzas';
        } else if (producto.categoria_nombre === 'Ensalada') {
          categoriaIngredientes = 'ensaladas';
        }
        // Agregar más conversiones según tus categorías

        if (categoriaIngredientes) {
          this.cargarIngredientesYMarcarSeleccionados(
            categoriaIngredientes,               // ✅ "hamburguesas"
            producto.ingredientes_detalle || []  // ✅ Array completo de ingredientes
          );
        }

        console.log('✅ Producto cargado completamente para edición');
      },
      error: (error) => {
        console.error('❌ Error al cargar producto:', error);
        alert('❌ Error al cargar el producto. Redirigiendo...');
        this.router.navigate(['/administrador/gestion-productos']);
      }
    });
  }

  private cargarIngredientesYMarcarSeleccionados(categoria: string, ingredientesSeleccionados: any[]): void {
    console.log('🥗 [EDICIÓN] Cargando ingredientes para categoría:', categoria);
    console.log('🥗 [EDICIÓN] Ingredientes a marcar como seleccionados:', ingredientesSeleccionados);

    this.catalogoService.getIngredientesPorCategoria(categoria).subscribe({
      next: (ingredientesDisponibles) => {
        console.log('✅ [EDICIÓN] Ingredientes disponibles cargados:', ingredientesDisponibles);

        // 🔄 Mapear ingredientes disponibles y marcar los seleccionados
        this.ingredientesDisponibles = ingredientesDisponibles.map(ingrediente => {
          // Verificar si este ingrediente está en la lista de seleccionados
          const estaSeleccionado = ingredientesSeleccionados.some(sel => sel.id === ingrediente.id);

          return {
            ...ingrediente,
            seleccionado: estaSeleccionado
          };
        });

        // 🎯 Actualizar ingredientes seleccionados
        this.ingredientesSeleccionados = ingredientesSeleccionados.map(ing => ({
          id: ing.id,
          nombre: ing.nombre,
          descripcion: ing.descripcion,
          imagen_url: ing.imagen_url,
          seleccionado: true,
          es_base: ing.es_base,
          permite_extra: ing.permite_extra
        }));

        console.log('✅ [EDICIÓN] Ingredientes disponibles procesados:', this.ingredientesDisponibles);
        console.log('✅ [EDICIÓN] Ingredientes marcados como seleccionados:', this.ingredientesSeleccionados);
      },
      error: (error) => {
        console.error('❌ [EDICIÓN] Error al cargar ingredientes:', error);
        this.ingredientesDisponibles = [];
      }
    });
  }

  toggleIngrediente(ingrediente: any): void {
    console.log('🔄 Toggle ingrediente:', ingrediente.nombre);

    const index = this.ingredientesSeleccionados.findIndex(item => item.id === ingrediente.id);

    if (index > -1) {
      // Deseleccionar
      this.ingredientesSeleccionados.splice(index, 1);
      ingrediente.seleccionado = false;
      console.log('❌ Ingrediente deseleccionado:', ingrediente.nombre);
    } else {
      // Seleccionar
      this.ingredientesSeleccionados.push({
        id: ingrediente.id,
        nombre: ingrediente.nombre,
        descripcion: ingrediente.descripcion,
        imagen_url: ingrediente.imagen_url,
        seleccionado: true
      });
      ingrediente.seleccionado = true;
      console.log('✅ Ingrediente seleccionado:', ingrediente.nombre);
    }

    console.log('📋 Ingredientes seleccionados actuales:', this.ingredientesSeleccionados.length, 'ingredientes');
    console.log('📋 IDs seleccionados:', this.ingredientesSeleccionados.map(ing => `${ing.id}:${ing.nombre}`));
  }


  onCategoriaSeleccionada(event: MatSelectChange): void {
    if (this.isEditMode) {
      console.log('🚫 Cambio de categoría bloqueado en modo edición');
      return;
    }

    const categoriaId = event.value;
    const categoria = this.categorias.find(cat => cat.id === categoriaId);

    console.log('🏷️ Categoría seleccionada:', categoria);

    if (categoria) {
      // 🔧 CORREGIR: Usar mapeo consistente
      let categoriaIngredientes = '';

      if (categoria.nombre === 'Hamburguesa') {
        categoriaIngredientes = 'hamburguesas';
      } else if (categoria.nombre === 'Pizzas') {
        categoriaIngredientes = 'pizzas';
      } else if (categoria.nombre === 'Ensalada') {
        categoriaIngredientes = 'ensaladas';
      } else if (categoria.nombre === 'Pollo') {
        categoriaIngredientes = 'pollo';
      } else if (categoria.nombre === 'Postres') {
        categoriaIngredientes = 'postres';
      } else if (categoria.nombre === 'Bebidas') {
        categoriaIngredientes = 'bebidas';
      }

      console.log('🥗 Mapeando categoría:', categoria.nombre, '→', categoriaIngredientes);

      if (categoriaIngredientes) {
        this.cargarIngredientesPorCategoria(categoriaIngredientes);
      } else {
        console.warn('⚠️ No se encontró mapeo para la categoría:', categoria.nombre);
        this.ingredientesDisponibles = [];
      }
    } else {
      this.ingredientesDisponibles = [];
    }
  }

  cargarIngredientesPorCategoria(categoriaNombre: string): void {
    console.log('🥗 Cargando ingredientes para:', categoriaNombre);

    // Limpiar selección anterior cuando se cambia de categoría (solo en modo creación)
    if (!this.isEditMode) {
      this.ingredientesSeleccionados = [];
    }

    this.catalogoService.getIngredientesPorCategoria(categoriaNombre).subscribe({
      next: (ingredientes) => {
        console.log('✅ Ingredientes cargados:', ingredientes);

        // En modo creación: todos empiezan como no seleccionados
        // En modo edición: mantener el estado actual
        this.ingredientesDisponibles = ingredientes.map(ing => ({
          ...ing,
          seleccionado: false // Se actualizará después si es modo edición
        }));

        console.log('📋 Ingredientes disponibles actualizados:', this.ingredientesDisponibles);
      },
      error: (error) => {
        console.error('❌ Error al cargar ingredientes:', error);
        this.ingredientesDisponibles = [];
      }
    });
  }



  getFullImageUrl(imagenUrl: string | undefined): string {
    return this.catalogoService.getFullImageUrl(imagenUrl);
  }



   eliminarImagen(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.currentImageUrl = null; // Limpiar imagen actual también

    //Solo marcar como error si estamos en modo creación
    this.productoForm.get('imagen')?.setValue(null);
    if (!this.isEditMode) {
      this.productoForm.get('imagen')?.markAsTouched();
    }
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
    // En modo edición, no mostrar error ya que el campo está deshabilitado
    if (this.isEditMode) {
      return '';
    }
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

  get imagenError(): string {
    const control = this.productoForm.get('imagen');
    if (control?.hasError('required') && control?.touched && !this.isEditMode) {
      return 'La imagen es obligatoria';
    }
    return '';
  }

  onSubmit(): void {
    // 🔧 OBTENER VALOR de categoría incluso si está deshabilitado
    let categoriaValue;
    if (this.isEditMode) {
      // En modo edición, la categoría está deshabilitada, obtener su valor
      categoriaValue = this.productoForm.get('categoria')?.value;
    } else {
      categoriaValue = this.productoForm.get('categoria')?.value;
    }

    // 🔧 VALIDACIÓN PERSONALIZADA para modo edición
    const formValid = this.isEditMode ?
      this.validarFormularioParaEdicion() :
      this.productoForm.valid;

    if (formValid) {
      this.saving = true;

      const formData = new FormData();
      formData.append('nombre', this.productoForm.get('nombre')?.value);
      formData.append('descripcion', this.productoForm.get('descripcion')?.value);
      formData.append('categoria', categoriaValue); // 🔧 Usar valor obtenido
      formData.append('precio', this.productoForm.get('precio')?.value);
      formData.append('estado', this.productoForm.get('disponibilidad')?.value);

      // Solo agregar imagen si hay una nueva seleccionada
      if (this.selectedFile) {
        formData.append('imagen', this.selectedFile, this.selectedFile.name);
      }

      // 🔧 SIEMPRE enviar ingredientes (incluso si está vacío)
      const ingredientesIds = this.ingredientesSeleccionados.map(ing => ing.id);
      formData.append('ingredientes', JSON.stringify(ingredientesIds));

      console.log('📤 Enviando datos:');
      console.log('   Categoría:', categoriaValue);
      console.log('   Ingredientes seleccionados:', this.ingredientesSeleccionados);
      console.log('   IDs de ingredientes:', ingredientesIds);
      console.log('   Total ingredientes:', ingredientesIds.length);

      // Decidir si crear o actualizar
      if (this.isEditMode) {
        this.actualizarProducto(formData);
      } else {
        this.crearProducto(formData);
      }
    } else {
      alert('⚠️ Por favor completa todos los campos requeridos');
    }
  }

  private validarFormularioParaEdicion(): boolean {
    const nombre = this.productoForm.get('nombre')?.value;
    const descripcion = this.productoForm.get('descripcion')?.value;
    const precio = this.productoForm.get('precio')?.value;
    const disponibilidad = this.productoForm.get('disponibilidad')?.value;
    const categoria = this.productoForm.get('categoria')?.value;

    // Validar que todos los campos requeridos estén completos
    const camposCompletos = nombre && descripcion && precio && disponibilidad && categoria;

    // Validar formato de precio
    const precioValido = /^\d+(\.\d{1,2})?$/.test(precio) && parseFloat(precio) > 0;

    console.log('🔍 Validación edición:', {
      nombre: !!nombre,
      descripcion: !!descripcion,
      precio: precioValido,
      disponibilidad: !!disponibilidad,
      categoria: !!categoria,
      valid: camposCompletos && precioValido
    });

    return camposCompletos && precioValido;
  }


  // 🆕 Método separado para crear producto (MODIFICAR)
  private crearProducto(formData: FormData): void {
    this.catalogoService.crearProducto(formData).subscribe({
      next: (response) => {
        console.log('✅ Producto creado exitosamente', response);

        // ❌ QUITAR: alert('🎉 Producto creado exitosamente!');

        // ✅ AGREGAR: Mostrar popup personalizado
        this.tituloPopup = '¡PRODUCTO CREADO!';
        this.mensajePopup = 'El producto ha sido creado exitosamente y está listo para ser usado';
        this.mostrarPopupExito = true;

        this.saving = false;
      },
      error: (error) => {
        console.error('❌ Error al crear el producto', error);
        alert('❌ Error al crear el producto. Revisa los datos e intenta nuevamente.');
        this.saving = false;
      }
    });
  }


  // 🆕 Método para actualizar producto (MODIFICAR)
  private actualizarProducto(formData: FormData): void {
    if (!this.productoId) return;

    this.catalogoService.actualizarProducto(this.productoId, formData).subscribe({
      next: (response) => {
        console.log('✅ Producto actualizado exitosamente', response);

        // ❌ QUITAR: alert('🎉 Producto actualizado exitosamente!');

        // ✅ AGREGAR: Mostrar popup personalizado
        this.tituloPopup = '¡PRODUCTO ACTUALIZADO!';
        this.mensajePopup = 'El producto ha sido actualizado exitosamente con los nuevos datos';
        this.mostrarPopupExito = true;

        this.saving = false;
      },
      error: (error) => {
        console.error('❌ Error al actualizar el producto', error);
        alert('❌ Error al actualizar el producto. Revisa los datos e intenta nuevamente.');
        this.saving = false;
      }
    });
  }



  // 🆕 Agregar método para cerrar popup
cerrarPopupExito(): void {
  this.mostrarPopupExito = false;

  if (this.isEditMode) {
    // En modo edición: redirigir a la lista después de cerrar popup
    this.router.navigate(['/administrador/gestion-productos/editar']);
  } else {
    // En modo creación: limpiar formulario
    this.limpiarFormulario();
  }
}


  private limpiarFormulario(): void {
    this.productoForm.reset();
    this.imagePreview = null;
    this.selectedFile = null;
    this.currentImageUrl = null;

    // 🔧 CORREGIR: Limpiar arrays de ingredientes
    this.ingredientesDisponibles = [];
    this.ingredientesSeleccionados = [];

    // Resetear valores por defecto
    this.productoForm.patchValue({
      disponibilidad: '',
      categoria: ''
    });
  }
}