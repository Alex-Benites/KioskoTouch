import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';
import { CatalogoService } from '../../../services/catalogo.service';
import { Producto, Categoria, Estado } from '../../../models/catalogo.model';
import { Router, ActivatedRoute } from '@angular/router';
import { Tamano, ProductoTamano } from '../../../models/tamano.model';  // Agregar ProductoTamano aquí
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

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
    FooterAdminComponent
  ],
  templateUrl: './crear.component.html',
  styleUrls: ['./crear.component.scss']
})
export class CrearComponent implements OnInit {

  private fb = inject(FormBuilder);
  private catalogoService = inject(CatalogoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  productoForm: FormGroup;
  categorias: any[] = [];
  estados: any[] = [];
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  ingredientes: any[] = [];
  ingredientesDisponibles: any[] = [];
  ingredientesSeleccionados: any[] = [];
  isEditMode = false;
  productoId: number | null = null;
  currentImageUrl: string | null = null;
  saving = false;

  // Nuevas propiedades para tamaños
  tamanos: Tamano[] = [];

  constructor() {
    this.productoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      categoria: ['', Validators.required],
      precio: ['', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0.01)
      ]],
      disponibilidad: ['', Validators.required],
      imagen: [null, Validators.required],
      // Nuevo campo para tamaños
      aplicaTamanos: [false]
      // Los campos de precio por tamaño se agregarán dinámicamente
    });
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

    // Cargar tamaños disponibles
    this.cargarTamanos();

    // Si estamos en modo edición, cargar el producto
    if (this.isEditMode) {
      this.cargarProductoParaEditar();
    }

    // Agregar escucha para cambios en aplicaTamanos
    this.productoForm.get('aplicaTamanos')?.valueChanges.subscribe(tieneTamanos => {
      const precioControl = this.productoForm.get('precio');

      if (tieneTamanos) {
        // Si tiene tamaños, deshabilitar el campo precio y quitar validaciones
        precioControl?.disable();
        console.log('📏 Precios por tamaño habilitados - Precio base deshabilitado');
      } else {
        // Si no tiene tamaños, habilitar el campo precio y añadir validaciones
        precioControl?.enable();
        precioControl?.setValidators([
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
          Validators.min(0.01)
        ]);
        precioControl?.updateValueAndValidity();
        console.log('💰 Precio base habilitado - Precios por tamaño deshabilitados');
      }
    });
  }

  // Nuevo método para cargar tamaños
  cargarTamanos(): void {
    console.log('📏 Cargando tamaños disponibles');
    this.catalogoService.getTamanos().subscribe({
      next: (tamanos) => {
        this.tamanos = tamanos;
        console.log('✅ Tamaños cargados:', tamanos.length);

        // Agregar campos dinámicos para cada tamaño
        this.tamanos.forEach(tamano => {
          const controlName = 'precio_' + tamano.codigo.toLowerCase();
          this.productoForm.addControl(
            controlName,
            new FormControl('', [
              Validators.pattern(/^\d+(\.\d{1,2})?$/),
              Validators.min(0.01)
            ])
          );
        });
      },
      error: (error) => {
        console.error('❌ Error al cargar tamaños:', error);
        this.tamanos = [];
      }
    });
  }

  // Método modificado para cargar producto con soporte de tamaños
  private cargarProductoParaEditar(): void {
    if (!this.productoId) return;

    console.log('🔄 Cargando producto para editar, ID:', this.productoId);

    this.catalogoService.obtenerProductoPorId(this.productoId).subscribe({
      next: (producto) => {
        console.log('✅ Producto cargado completo:', producto);

        this.productoForm.patchValue({
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          categoria: producto.categoria,
          disponibilidad: producto.estado,
          // Campo para tamaños
          aplicaTamanos: producto.aplica_tamanos || false
        });

        // Si el producto tiene tamaños, configurar los precios
        if (producto.aplica_tamanos && producto.tamanos_detalle?.length) {
          console.log('📏 Configurando precios por tamaño:', producto.tamanos_detalle);

          // Esperar a que los campos se creen
          setTimeout(() => {
            producto.tamanos_detalle.forEach((tamano: ProductoTamano) => {  // Añadir tipo explícito aquí
              const controlName = 'precio_' + tamano.codigo_tamano.toLowerCase();
              if (this.productoForm.get(controlName)) {
                this.productoForm.get(controlName)?.setValue(tamano.precio);
              }
            });
          }, 500);
        }

        // Deshabilitar categoría en modo edición
        this.productoForm.get('categoria')?.disable();
        console.log('🔒 Campo categoría deshabilitado para edición');

        // Manejar imagen actual
        if (producto.imagen_url) {
          this.currentImageUrl = this.catalogoService.getFullImageUrl(producto.imagen_url);
          this.imagePreview = this.currentImageUrl;

          // Quitar validación obligatoria de imagen para edición
          this.productoForm.get('imagen')?.clearValidators();
          this.productoForm.get('imagen')?.updateValueAndValidity();
        }

        // Cargar ingredientes
        let categoriaIngredientes = '';
        if (producto.categoria_nombre === 'Hamburguesa') {
          categoriaIngredientes = 'hamburguesas';
        } else if (producto.categoria_nombre === 'Pizza' || producto.categoria_nombre === 'Pizzas') {
          categoriaIngredientes = 'pizzas';
        } else if (producto.categoria_nombre === 'Ensalada') {
          categoriaIngredientes = 'ensaladas';
        }

        if (categoriaIngredientes) {
          this.cargarIngredientesYMarcarSeleccionados(
            categoriaIngredientes,
            producto.ingredientes_detalle || []
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


    // ✅ NUEVO: Método para aumentar cantidad
  aumentarCantidad(ingrediente: any): void {
    console.log('➕ Aumentando cantidad para:', ingrediente.nombre);
    
    // Inicializar cantidad si no existe
    if (!ingrediente.cantidad) {
      ingrediente.cantidad = 0;
    }
    
    ingrediente.cantidad++;
    console.log('📊 Nueva cantidad:', ingrediente.cantidad);
    
    // Actualizar lista de ingredientes seleccionados
    this.actualizarIngredientesSeleccionados();
  }

  // ✅ NUEVO: Método para disminuir cantidad
  disminuirCantidad(ingrediente: any): void {
    console.log('➖ Disminuyendo cantidad para:', ingrediente.nombre);
    
    // Inicializar cantidad si no existe
    if (!ingrediente.cantidad) {
      ingrediente.cantidad = 0;
    }
    
    // No permitir valores negativos
    if (ingrediente.cantidad > 0) {
      ingrediente.cantidad--;
      console.log('📊 Nueva cantidad:', ingrediente.cantidad);
      
      // Actualizar lista de ingredientes seleccionados
      this.actualizarIngredientesSeleccionados();
    }
  }

  // ✅ NUEVO: Método para actualizar la lista de ingredientes seleccionados
  private actualizarIngredientesSeleccionados(): void {
    // Filtrar ingredientes que tienen cantidad > 0
    this.ingredientesSeleccionados = this.ingredientesDisponibles
      .filter(ingrediente => ingrediente.cantidad > 0)
      .map(ingrediente => ({
        id: ingrediente.id,
        nombre: ingrediente.nombre,
        descripcion: ingrediente.descripcion,
        imagen_url: ingrediente.imagen_url,
        cantidad: ingrediente.cantidad, // ✅ AGREGAR CANTIDAD
        seleccionado: true,
        es_base: ingrediente.es_base || false,
        permite_extra: ingrediente.permite_extra || false,
        stock: ingrediente.stock || 0,
        stock_minimo: ingrediente.stock_minimo || 5,
        unidad_medida: ingrediente.unidad_medida || 'unidades',
        esta_agotado: ingrediente.esta_agotado || false,
        necesita_reposicion: ingrediente.necesita_reposicion || false,
        estado_stock: ingrediente.estado_stock || 'DISPONIBLE'
      }));

    console.log('📋 Ingredientes seleccionados actualizados:', 
      this.ingredientesSeleccionados.map(ing => `${ing.nombre}: ${ing.cantidad}`));
  }


  cargarIngredientesPorCategoria(categoriaNombre: string): void {
    console.log('🥗 Cargando ingredientes para:', categoriaNombre);

    // Limpiar selección anterior cuando se cambia de categoría (solo en modo creación)
    if (!this.isEditMode) {
      this.ingredientesSeleccionados = [];
    }

    console.log('🔐 Enviando petición con token de autenticación');

    this.catalogoService.getIngredientesPorCategoria(categoriaNombre).subscribe({
      next: (ingredientes) => {
        console.log('✅ Ingredientes cargados exitosamente:', ingredientes);
        this.ingredientesDisponibles = ingredientes.map(ing => ({
          ...ing,
          cantidad: 0, 
          seleccionado: false,
          es_base: ing.es_base || false,
          permite_extra: ing.permite_extra || false
        }));
      },
      error: (error) => {
        console.error('❌ Error al cargar ingredientes:', error);
        if (error.status === 401) {
          console.error('🚫 Token de autenticación inválido o expirado');
          alert('⚠️ Sesión expirada. Redirigiendo al login...');
        }
        this.ingredientesDisponibles = [];
      }
    });
  }


  // ✅ MODIFICAR: Método cargarIngredientesYMarcarSeleccionados para edición
  private cargarIngredientesYMarcarSeleccionados(categoria: string, ingredientesSeleccionados: any[]): void {
    console.log('🥗 [EDICIÓN] Cargando ingredientes para categoría:', categoria);

    this.catalogoService.getIngredientesPorCategoria(categoria).subscribe({
      next: (ingredientesDisponibles) => {
        // Mapear ingredientes disponibles y establecer cantidades
        this.ingredientesDisponibles = ingredientesDisponibles.map(ingrediente => {
          const ingredienteSeleccionado = ingredientesSeleccionados.find(sel => sel.id === ingrediente.id);
          const cantidad = ingredienteSeleccionado ? (ingredienteSeleccionado.cantidad || 1) : 0;
          
          return {
            ...ingrediente,
            cantidad: cantidad, // ✅ USAR CANTIDAD DEL BACKEND O 0
            seleccionado: cantidad > 0,
            es_base: ingrediente.es_base || false,
            permite_extra: ingrediente.permite_extra || false
          };
        });

        // Actualizar ingredientes seleccionados con cantidades
        this.actualizarIngredientesSeleccionados();
      },
      error: (error) => {
        console.error('❌ [EDICIÓN] Error al cargar ingredientes:', error);
        this.ingredientesDisponibles = [];
      }
    });
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

      if (categoriaIngredientes) {
        this.cargarIngredientesPorCategoria(categoriaIngredientes);
      } else {
        this.ingredientesDisponibles = [];
      }
    } else {
      this.ingredientesDisponibles = [];
    }
  }



  getFullImageUrl(imagenUrl: string | undefined): string {
    return this.catalogoService.getFullImageUrl(imagenUrl);
  }

  eliminarImagen(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.currentImageUrl = null;

    this.productoForm.get('imagen')?.setValue(null);
    if (!this.isEditMode) {
      this.productoForm.get('imagen')?.markAsTouched();
    }
  }

  // Getters para errores
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
    console.log('🔄 Iniciando onSubmit, modo edición:', this.isEditMode);

    // Obtener valor de categoría incluso si está deshabilitado
    let categoriaValue;
    if (this.isEditMode) {
      // En modo edición, obtener el valor original guardado
      categoriaValue = this.productoForm.get('categoria')?.value;
      console.log('📝 Categoría en edición:', categoriaValue);
    } else {
      categoriaValue = this.productoForm.get('categoria')?.value;
    }

    // Debug del estado del formulario
    console.log('📋 Estado del formulario:', {
      valid: this.productoForm.valid,
      invalid: this.productoForm.invalid,
      errors: this.productoForm.errors,
      values: this.productoForm.value,
      categoria: categoriaValue
    });

    // Validación personalizada para modo edición o creación
    const formValid = this.isEditMode ?
      this.validarFormularioParaEdicion() :
      this.validarFormulario();

    console.log('✅ Resultado de validación:', formValid);

    if (formValid) {
      this.mostrarDialogConfirmacion(categoriaValue);
    } else {
      console.log('❌ Formulario no válido, mostrando alerta');
      alert('⚠️ Por favor completa todos los campos requeridos');
    }
  }

  // ✅ NUEVO: Método para mostrar diálogo de confirmación
  private mostrarDialogConfirmacion(categoriaValue: any): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'producto',
      action: this.isEditMode ? 'update' : 'create'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        // Usuario confirmó, proceder con la operación
        this.procesarFormulario(categoriaValue);
      }
      // Si no confirmó, no hacer nada (el diálogo se cierra automáticamente)
    });
  }

  // ✅ NUEVO: Método para procesar el formulario después de la confirmación
  private procesarFormulario(categoriaValue: any): void {
    console.log('🚀 Procesando formulario...');
    console.log('- Modo edición:', this.isEditMode);
    console.log('- Producto ID:', this.productoId);
    console.log('- Categoría:', categoriaValue);

    this.saving = true;

    const formData = new FormData();
    formData.append('nombre', this.productoForm.get('nombre')?.value);
    formData.append('descripcion', this.productoForm.get('descripcion')?.value);
    formData.append('categoria', categoriaValue);
    formData.append('estado', this.productoForm.get('disponibilidad')?.value);

    // Manejar precio según aplica_tamanos
    const aplicaTamanos = this.productoForm.get('aplicaTamanos')?.value || false;

    if (aplicaTamanos) {
      formData.append('precio', '0');
    } else {
      formData.append('precio', this.productoForm.get('precio')?.value);
    }

    // Solo agregar imagen si hay una nueva seleccionada
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile, this.selectedFile.name);
      console.log('🖼️ Nueva imagen seleccionada');
    } else {
      console.log('🖼️ Sin nueva imagen');
    }

    // ✅ CAMBIAR ESTA SECCIÓN DE INGREDIENTES:
    // ❌ ANTES: const ingredientesIds = this.ingredientesSeleccionados.map(ing => ing.id);
    // ❌ ANTES: formData.append('ingredientes', JSON.stringify(ingredientesIds));
    
    // ✅ NUEVO: Enviar ingredientes con cantidades
    const ingredientesConCantidad = this.ingredientesSeleccionados.map(ing => ({
      id: ing.id,
      cantidad: ing.cantidad || 1
    }));
    
    console.log('🥗 Ingredientes con cantidad a enviar:', ingredientesConCantidad);
    formData.append('ingredientes', JSON.stringify(ingredientesConCantidad));

    // Tamaños
    formData.append('aplica_tamanos', aplicaTamanos ? 'true' : 'false');

    if (aplicaTamanos) {
      const preciosTamanos: { [key: string]: number } = {};
      this.tamanos.forEach(tamano => {
        const controlName = 'precio_' + tamano.codigo.toLowerCase();
        const precio = this.productoForm.get(controlName)?.value;
        if (precio) {
          preciosTamanos[tamano.nombre.toLowerCase()] = parseFloat(precio);
        }
      });
      formData.append('precios_tamanos', JSON.stringify(preciosTamanos));
    }

    console.log('📤 FormData preparado, enviando...');

    if (this.isEditMode) {
      this.actualizarProducto(formData);
    } else {
      this.crearProducto(formData);
    }
  }

  // ✅ MODIFICAR: Método crearProducto para usar success-dialog
  private crearProducto(formData: FormData): void {
    this.catalogoService.crearProducto(formData).subscribe({
      next: (response) => {
        console.log('✅ Producto creado exitosamente', response);
        this.saving = false;

        // ✅ NUEVO: Obtener nombre del producto para el mensaje
        const nombreProducto = this.productoForm.get('nombre')?.value;

        this.mostrarDialogExito(
          'Producto Creado',
          `El producto "${nombreProducto}" ha sido creado exitosamente.`,
          'Continuar'
        );
      },
      error: (error) => {
        console.error('❌ Error al crear el producto', error);
        this.saving = false;

        let mensajeError = 'Error al crear el producto. ';
        if (error.error?.detail) {
          mensajeError += error.error.detail;
        } else if (error.error?.message) {
          mensajeError += error.error.message;
        } else {
          mensajeError += 'Revisa los datos e intenta nuevamente.';
        }

        alert('❌ ' + mensajeError);
      }
    });
  }

  // ✅ MODIFICAR: Método actualizarProducto para usar success-dialog
  private actualizarProducto(formData: FormData): void {
    if (!this.productoId) return;

    this.catalogoService.actualizarProducto(this.productoId, formData).subscribe({
      next: (response) => {
        console.log('✅ Producto actualizado exitosamente', response);
        this.saving = false;

        // ✅ NUEVO: Obtener nombre del producto para el mensaje
        const nombreProducto = this.productoForm.get('nombre')?.value;

        this.mostrarDialogExito(
          'Producto Actualizado',
          `El producto "${nombreProducto}" ha sido actualizado exitosamente.`,
          'Continuar'
        );
      },
      error: (error) => {
        console.error('❌ Error al actualizar el producto', error);
        this.saving = false;

        let mensajeError = 'Error al actualizar el producto. ';
        if (error.error?.detail) {
          mensajeError += error.error.detail;
        } else if (error.error?.message) {
          mensajeError += error.error.message;
        } else {
          mensajeError += 'Revisa los datos e intenta nuevamente.';
        }

        alert('❌ ' + mensajeError);
      }
    });
  }

  // ✅ EL MÉTODO mostrarDialogExito YA EXISTE - Solo asegurar que esté correcto
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
        // ✅ CAMBIO: Regresar a la vista de edición en lugar de productos
        this.router.navigate(['/administrador/gestion-productos/editar']);
      } else {
        // ✅ CAMBIO: En creación, limpiar formulario y quedarse en la misma vista
        this.limpiarFormulario();
      }
    });
  }

  private navegarAListaProductos(): void {
    this.router.navigate(['/administrador/gestion-productos']);
  }

  private limpiarFormulario(): void {
    this.productoForm.reset();
    this.imagePreview = null;
    this.selectedFile = null;
    this.currentImageUrl = null;
    this.ingredientesDisponibles = [];
    this.ingredientesSeleccionados = [];

    this.productoForm.patchValue({
      disponibilidad: '',
      categoria: ''
    });
  }

  // Añadir este método para manejar la selección de archivos
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
        this.productoForm.patchValue({ imagen: this.selectedFile });
      };
      reader.readAsDataURL(this.selectedFile);

      console.log('🖼️ Imagen seleccionada:', this.selectedFile.name);
    }
  }

  // ✅ AGREGAR: Método para validar formulario en modo creación
  private validarFormulario(): boolean {
    // Marcar todos los campos como tocados para mostrar errores
    Object.keys(this.productoForm.controls).forEach(key => {
      this.productoForm.get(key)?.markAsTouched();
    });

    // Validaciones básicas del formulario
    if (this.productoForm.invalid) {
      console.log('❌ Formulario inválido');
      return false;
    }

    // Validar que tenga imagen en modo creación
    if (!this.selectedFile) {
      console.log('❌ Imagen requerida en modo creación');
      return false;
    }

    // Validar ingredientes (opcional dependiendo de la categoría)
    const categoria = this.categorias.find(cat => cat.id === this.productoForm.get('categoria')?.value);
    if (categoria && ['Hamburguesa', 'Pizzas', 'Ensalada'].includes(categoria.nombre)) {
      if (this.ingredientesSeleccionados.length === 0) {
        console.log('❌ Ingredientes requeridos para esta categoría');
        alert('⚠️ Debes seleccionar al menos un ingrediente para esta categoría');
        return false;
      }
    }

    // Validar precios por tamaño si aplica
    const aplicaTamanos = this.productoForm.get('aplicaTamanos')?.value;
    if (aplicaTamanos) {
      let tieneAlMenosUnPrecio = false;

      this.tamanos.forEach(tamano => {
        const controlName = 'precio_' + tamano.codigo.toLowerCase();
        const precio = this.productoForm.get(controlName)?.value;

        if (precio && parseFloat(precio) > 0) {
          tieneAlMenosUnPrecio = true;
        }
      });

      if (!tieneAlMenosUnPrecio) {
        console.log('❌ Debe especificar al menos un precio por tamaño');
        alert('⚠️ Debes especificar al menos un precio para los tamaños disponibles');
        return false;
      }
    }

    console.log('✅ Formulario válido para creación');
    return true;
  }

  // ✅ CORREGIR: Método para validar formulario en modo edición
  private validarFormularioParaEdicion(): boolean {
    console.log('🔍 Validando formulario para edición...');

    // Validar campos básicos requeridos
    const camposRequeridos = ['nombre', 'descripcion', 'disponibilidad'];

    for (const campo of camposRequeridos) {
      const control = this.productoForm.get(campo);
      const valor = control?.value;

      if (!valor || (typeof valor === 'string' && valor.trim() === '')) {
        control?.markAsTouched();
        console.log(`❌ Campo requerido faltante: ${campo}`, valor);
        alert(`⚠️ El campo ${campo} es requerido`);
        return false;
      }
    }

    // Validar categoría (aunque esté disabled, debe tener valor)
    const categoriaValue = this.productoForm.get('categoria')?.value;
    if (!categoriaValue) {
      console.log('❌ Categoría requerida');
      alert('⚠️ La categoría es requerida');
      return false;
    }

    const aplicaTamanos = this.productoForm.get('aplicaTamanos')?.value;
    console.log('📏 Aplica tamaños:', aplicaTamanos);

    // Validar precios según si aplica tamaños o no
    if (aplicaTamanos) {
      // Si aplica tamaños, validar que tenga al menos un precio por tamaño
      let tieneAlMenosUnPrecio = false;

      this.tamanos.forEach(tamano => {
        const controlName = 'precio_' + tamano.codigo.toLowerCase();
        const precio = this.productoForm.get(controlName)?.value;
        console.log(`💰 Precio ${tamano.nombre}:`, precio);

        if (precio && parseFloat(precio) > 0) {
          tieneAlMenosUnPrecio = true;
        }
      });

      if (!tieneAlMenosUnPrecio) {
        console.log('❌ Debe especificar al menos un precio por tamaño');
        alert('⚠️ Debes especificar al menos un precio para los tamaños disponibles');
        return false;
      }
    } else {
      // Si NO aplica tamaños, validar precio base
      const precioControl = this.productoForm.get('precio');
      const precioValue = precioControl?.value;

      if (!precioValue || parseFloat(precioValue) <= 0) {
        precioControl?.markAsTouched();
        console.log('❌ Precio base requerido:', precioValue);
        alert('⚠️ El precio es requerido y debe ser mayor a 0');
        return false;
      }
    }

    // ✅ OPCIONAL: Validar ingredientes solo para categorías específicas
    const categoria = this.categorias.find(cat => cat.id === categoriaValue);
    if (categoria) {
      const categoriasConIngredientes = ['Hamburguesa', 'Pizzas', 'Ensalada'];
      if (categoriasConIngredientes.includes(categoria.nombre)) {
        if (this.ingredientesSeleccionados.length === 0) {
          console.log('⚠️ Categoría requiere ingredientes pero no es bloqueante en edición');
          // En edición, solo advertir pero no bloquear
          const confirmar = confirm('⚠️ Esta categoría generalmente requiere ingredientes. ¿Deseas continuar sin ingredientes?');
          if (!confirmar) {
            return false;
          }
        }
      }
    }

    console.log('✅ Formulario válido para edición');
    return true;
  }
}