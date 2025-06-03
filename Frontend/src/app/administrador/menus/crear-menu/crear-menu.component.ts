import { Component,OnInit } from '@angular/core';
import { FormBuilder, FormsModule, FormGroup, Validators, ReactiveFormsModule, FormControl, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { CatalogoService } from '../../../services/catalogo.service';
import {  Producto, Estado } from '../../../models/catalogo.model';
import { Router, ActivatedRoute } from '@angular/router'; // 🆕 Agregar ActivatedRoute
@Component({
  selector: 'app-crear-menu',
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
    FormsModule
  ],
  templateUrl: './crear-menu.component.html',
  styleUrls: ['./crear-menu.component.scss']
})
export class CrearMenuComponent implements OnInit {
  menuForm: FormGroup;
  estados: any[] = [];
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  isEditMode = false;
  menuId: number | null = null;
  currentImageUrl: string | null = null; // Para mostrar imagen actual
  saving = false;
  productos: Producto[] = [];
  search: string = '';
  productosSeleccionados: Producto[] = [];

  constructor(
    private fb: FormBuilder,
    private catalogoService: CatalogoService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.menuForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
    precio: ['', [
      Validators.required,
      Validators.pattern(/^\d+(\.\d{1,2})?$/),
      Validators.min(0.01)  // Mínimo 0.01 (1 centavo)
    ]],
      disponibilidad: ['', Validators.required],
      productosSeleccionados: ['', Validators.required],
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
      this.menuForm.get('imagen')?.setValue(this.selectedFile);
      this.menuForm.get('imagen')?.markAsTouched();
    }
  }

  ngOnInit(): void {
    // Verificar si estamos en modo edición
    this.menuId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.menuId && !isNaN(this.menuId);

    this.catalogoService.getEstados().subscribe(data => {
      this.estados = data;
    });

    /* Si estamos en modo edición, cargar el menu
    if (this.isEditMode) {
      this.cargarmenuParaEditar();
      this.productosSeleccionados = [...this.menuExistente.productos];
    }*/
  }

  estaSeleccionado(producto: Producto): boolean {
    return this.productosSeleccionados.some(p => p.id === producto.id);
  }

  toggleSeleccion(producto: Producto): void {
    const index = this.productosSeleccionados.findIndex(p => p.id === producto.id);
    if (index > -1) {
      // Ya está seleccionado → lo quitamos
      this.productosSeleccionados.splice(index, 1);
    } else {
      // No está seleccionado → lo agregamos
      this.productosSeleccionados.push(producto);
    }
  }


  /* Método para cargar menu en modo edición
  private cargarmenuParaEditar(): void {
    if (!this.menuId) return;

    console.log('🔄 Cargando menu para editar, ID:', this.menuId);

    this.catalogoService.obtenermenuPorId(this.menuId).subscribe({
      next: (menu) => {
        console.log('✅ menu cargado completo:', menu);

        // 📝 Llenar formulario con datos básicos
        this.menuForm.patchValue({
          nombre: menu.nombre,
          descripcion: menu.descripcion,
          precio: menu.precio,
          categoria: menu.categoria,        // ✅ ID: 1
          disponibilidad: menu.estado      // ✅ ID: 1
        });

        // 🔒 DESHABILITAR categoría en modo edición
        this.menuForm.get('categoria')?.disable();
        console.log('🔒 Campo categoría deshabilitado para edición');

        console.log('📝 Formulario rellenado con:', {
          nombre: menu.nombre,
          categoria: menu.categoria,
          estado: menu.estado,
          precio: menu.precio
        });

        // 🖼️ Manejar imagen actual
        if (menu.imagen_url) {
          this.currentImageUrl = this.catalogoService.getFullImageUrl(menu.imagen_url);
          this.imagePreview = this.currentImageUrl;
          console.log('🖼️ Imagen cargada:', this.currentImageUrl);

          // Quitar validación obligatoria de imagen para edición
          this.menuForm.get('imagen')?.clearValidators();
          this.menuForm.get('imagen')?.updateValueAndValidity();
        }

        // 🥗 Cargar ingredientes - usar "hamburguesas" directamente
        console.log('🥗 Categoria del menu:', menu.categoria_nombre);
        console.log('🥗 Ingredientes actuales:', menu.ingredientes_detalle);

        // Convertir categoria_nombre a la categoría de ingredientes
        let categoriaIngredientes = '';
        if (menu.categoria_nombre === 'Hamburguesa') {
          categoriaIngredientes = 'hamburguesas';
        } else if (menu.categoria_nombre === 'Pizza' || menu.categoria_nombre === 'Pizzas') {
          categoriaIngredientes = 'pizzas';
        } else if (menu.categoria_nombre === 'Ensalada') {
          categoriaIngredientes = 'ensaladas';
        }
        // Agregar más conversiones según tus categorías

        if (categoriaIngredientes) {
          this.cargarIngredientesYMarcarSeleccionados(
            categoriaIngredientes,               // ✅ "hamburguesas"
            menu.ingredientes_detalle || []  // ✅ Array completo de ingredientes
          );
        }

        console.log('✅ menu cargado completamente para edición');
      },
      error: (error) => {
        console.error('❌ Error al cargar menu:', error);
        alert('❌ Error al cargar el menu. Redirigiendo...');
        this.router.navigate(['/administrador/gestion-menus']);
      }
    });
  }
*/



  getFullImageUrl(imagenUrl: string | undefined): string {
    return this.catalogoService.getFullImageUrl(imagenUrl);
  }
  agregarProducto(producto: any): void {
    console.log('🔧 Agregando producto:', producto);
  }


   eliminarImagen(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.currentImageUrl = null; // Limpiar imagen actual también

    //Solo marcar como error si estamos en modo creación
    this.menuForm.get('imagen')?.setValue(null);
    if (!this.isEditMode) {
      this.menuForm.get('imagen')?.markAsTouched();
    }
  }

  // ← AGREGAR MÉTODOS PARA MOSTRAR ERRORES
  get nombreError(): string {
    const control = this.menuForm.get('nombre');
    if (control?.hasError('required') && control?.touched) {
      return 'El nombre es obligatorio';
    }
    return '';
  }

  get descripcionError(): string {
    const control = this.menuForm.get('descripcion');
    if (control?.hasError('required') && control?.touched) {
      return 'La descripción es obligatoria';
    }
    return '';
  }


  get precioError(): string {
    const control = this.menuForm.get('precio');
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
    const control = this.menuForm.get('disponibilidad');
    if (control?.hasError('required') && control?.touched) {
      return 'La disponibilidad es obligatoria';
    }
    return '';
  }

  get imagenError(): string {
    const control = this.menuForm.get('imagen');
    if (control?.hasError('required') && control?.touched && !this.isEditMode) {
      return 'La imagen es obligatoria';
    }
    return '';
  }

  onSubmit(): void {
    // 🔧 OBTENER VALOR de categoría incluso si está deshabilitado
    let categoriaValue = 9;

    // 🔧 VALIDACIÓN PERSONALIZADA para modo edición
    const formValid = this.isEditMode ?
      this.validarFormularioParaEdicion() :
      this.menuForm.valid;

    if (formValid) {
      this.saving = true;

      const formData = new FormData();
      formData.append('nombre', this.menuForm.get('nombre')?.value);
      formData.append('descripcion', this.menuForm.get('descripcion')?.value);
      formData.append('precio', this.menuForm.get('precio')?.value);
      formData.append('estado', this.menuForm.get('disponibilidad')?.value);
      formData.append('productos', this.menuForm.get('productosSeleccionados')?.value);
      // Solo agregar imagen si hay una nueva seleccionada
      if (this.selectedFile) {
        formData.append('imagen', this.selectedFile, this.selectedFile.name);
      }
      // Decidir si crear o actualizar
      if (this.isEditMode) {
        //this.actualizarmenu(formData);
      } else {
        this.crearmenu(formData);
      }
    } else {
      alert('⚠️ Por favor completa todos los campos requeridos');
    }
  }

  private validarFormularioParaEdicion(): boolean {
    const nombre = this.menuForm.get('nombre')?.value;
    const descripcion = this.menuForm.get('descripcion')?.value;
    const precio = this.menuForm.get('precio')?.value;
    const disponibilidad = this.menuForm.get('disponibilidad')?.value;
    const productosSeleccionados = this.menuForm.get('productosSeleccionados')?.value;

    // Validar que todos los campos requeridos estén completos
    const camposCompletos = nombre && descripcion && precio && disponibilidad && productosSeleccionados;

    // Validar formato de precio
    const precioValido = /^\d+(\.\d{1,2})?$/.test(precio) && parseFloat(precio) > 0;

    console.log('🔍 Validación edición:', {
      nombre: !!nombre,
      descripcion: !!descripcion,
      precio: precioValido,
      disponibilidad: !!disponibilidad,
      productosSeleccionados: !!productosSeleccionados,
      valid: camposCompletos && precioValido
    });

    return camposCompletos && precioValido;
  }


  // 🆕 Método separado para crear menu
  private crearmenu(formData: FormData): void {
    this.catalogoService.crearMenu(formData).subscribe({
      next: (response) => {
        console.log('✅ menu creado exitosamente', response);
        alert('🎉 menu creado exitosamente!');
        this.limpiarFormulario();
        this.saving = false;
      },
      error: (error) => {
        console.error('❌ Error al crear el menu', error);
        alert('❌ Error al crear el menu. Revisa los datos e intenta nuevamente.');
        this.saving = false;
      }
    });
  }


  /*  Método para actualizar menu
  private actualizarmenu(formData: FormData): void {
    if (!this.menuId) return;

    this.catalogoService.actualizarmenu(this.menuId, formData).subscribe({
      next: (response) => {
        console.log('✅ menu actualizado exitosamente', response);
        alert('🎉 menu actualizado exitosamente!');
        this.saving = false;
        // 🆕 Redirigir a la lista después de editar
        this.router.navigate(['/administrador/gestion-menus/editar']);
      },
      error: (error) => {
        console.error('❌ Error al actualizar el menu', error);
        alert('❌ Error al actualizar el menu. Revisa los datos e intenta nuevamente.');
        this.saving = false;
      }
    });
  }
*/


  private limpiarFormulario(): void {
    this.menuForm.reset();
    this.imagePreview = null;
    this.selectedFile = null;
    this.currentImageUrl = null;

    // Resetear valores por defecto
    this.menuForm.patchValue({
      disponibilidad: '',
      categoria: ''
    });
  }
}
