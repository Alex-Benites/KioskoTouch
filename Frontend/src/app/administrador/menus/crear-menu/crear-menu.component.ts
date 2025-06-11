import { Component,OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, FormGroup, Validators, ReactiveFormsModule, FormControl, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { CatalogoService } from '../../../services/catalogo.service';
import {  Producto, Estado } from '../../../models/catalogo.model';
import { Router, ActivatedRoute } from '@angular/router';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';
import { environment } from '../../../../environments/environment'; 

@Component({
  selector: 'app-crear-menu',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    HeaderAdminComponent,
    FooterAdminComponent,
    FormsModule
  ],
  templateUrl: './crear-menu.component.html',
  styleUrls: ['./crear-menu.component.scss']
})
export class CrearMenuComponent implements OnInit {
  private dialog = inject(MatDialog);
  menuForm: FormGroup;
  estados: any[] = [];
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  isEditMode = false;
  menuId: number | null = null;
  currentImageUrl: string | null = null;
  saving = false;
  productos: Producto[] = [];
  search: string = '';
  productosSeleccionados: { producto: number, cantidad: number }[] = [];

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
        Validators.min(0.01)
      ]],
      tipo_menu: ['', Validators.required], // <--- CAMBIO
      estado: ['', Validators.required],    // <--- CAMBIO
      productos: [[], Validators.required], // <--- CAMBIO: array de productos
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
    this.catalogoService.getProductos().subscribe(data => {
      this.productos = data;
      this.loadProductImages(); // Solo para productos
    });

    // Si estamos en modo edición, cargar el menu
    if (this.isEditMode) {
      this.cargarmenuParaEditar();
    }
  }

  loadProductImages(): void {
    this.productos.forEach(producto => {
      if (producto.id) {
        this.catalogoService.getProductoImagen(producto.id).subscribe(response => {
          producto.imagenUrl = response.imagen_url;
        });
      }
    });
  }

  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) return '';
    return `${environment.baseUrl}${imagenUrl}`;
  }

  // Método para cargar menu en modo edición
  private cargarmenuParaEditar(): void {
    if (!this.menuId) return;

    console.log('🔄 Cargando menu para editar, ID:', this.menuId);

    this.catalogoService.obtenerMenuPorId(this.menuId).subscribe({
      next: (menu) => {
        console.log('✅ menu cargado completo:', menu);

        // Llenar formulario con datos del menú
        this.menuForm.patchValue({
          nombre: menu.nombre,
          descripcion: menu.descripcion,
          precio: menu.precio,
          tipo_menu: menu.tipo_menu,
          estado: menu.estado,
          productos: [],
          imagen: null
        });

        // Manejar imagen actual
        if (menu.imagen_url) {
          this.currentImageUrl = this.catalogoService.getFullImageUrl(menu.imagen_url);
          this.imagePreview = this.currentImageUrl;
          this.menuForm.get('imagen')?.clearValidators();
          this.menuForm.get('imagen')?.updateValueAndValidity();
        }

        // Cargar productos seleccionados (usando productos_detalle del backend)
        if (menu.productos_detalle && Array.isArray(menu.productos_detalle)) {
          this.productosSeleccionados = menu.productos_detalle.map((p: any) => ({
            producto: typeof p.producto === 'object' ? p.producto.id : p.producto, // Soporta ambos casos
            cantidad: p.cantidad
          }));
          this.menuForm.get('productos')?.setValue(this.productosSeleccionados);
        } else {
          this.productosSeleccionados = [];
          this.menuForm.get('productos')?.setValue([]);
        }

        console.log('📝 Formulario rellenado con:', this.menuForm.value);
        console.log('🛒 Productos seleccionados:', this.productosSeleccionados);
      },
      error: (error) => {
        console.error('❌ Error al cargar menu:', error);
        alert('❌ Error al cargar el menu. Redirigiendo...');
        this.router.navigate(['/administrador/gestion-menus']);
      }
    });
  }



  get productosSeleccionadosTexto(): string {
    // Muestra: "Hamburguesa sencilla (x2), Papas (x1)"
    return this.productosSeleccionados
      .filter(p => p.producto && p.cantidad > 0)
      .map(p => {
        const prod = this.productos.find(x => x.id === p.producto);
        if (!prod) return '';
        return p.cantidad > 1 ? `${prod.nombre} (x${p.cantidad})` : prod.nombre;
      })
      .filter(Boolean)
      .join(', ');
  }

  agregarProducto(producto: Producto): void {
    if (!producto || !producto.id) return;
    const idx = this.productosSeleccionados.findIndex(p => p.producto === producto.id);
    if (idx > -1) {
      this.productosSeleccionados[idx].cantidad += 1;
    } else {
      this.productosSeleccionados.push({ producto: producto.id, cantidad: 1 });
    }
    // Solo deja productos con cantidad > 0 y producto válido
    this.productosSeleccionados = this.productosSeleccionados.filter(
      p => p.producto && p.cantidad > 0
    );
    this.menuForm.get('productos')?.setValue(this.productosSeleccionados);
  }
  eliminarProductos(): void {
    this.productosSeleccionados = [];
    this.menuForm.get('productos')?.setValue([]);
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
    const productos = (this.menuForm.get('productos')?.value || []).filter(
      (prod: any) => prod.producto && !isNaN(Number(prod.producto)) && prod.cantidad > 0
    );

    if (!productos.length) {
      alert('⚠️ Debes seleccionar al menos un producto para el menú.');
      return;
    }

    const formValid = this.isEditMode
      ? this.validarFormularioParaEdicion()
      : this.menuForm.valid;

    if (formValid) {
      this.saving = true;
      const formData = new FormData();
      formData.append('nombre', this.menuForm.get('nombre')?.value);
      formData.append('descripcion', this.menuForm.get('descripcion')?.value);
      formData.append('precio', this.menuForm.get('precio')?.value);
      formData.append('tipo_menu', this.menuForm.get('tipo_menu')?.value);
      formData.append('estado', this.menuForm.get('estado')?.value);

      productos.forEach((prod: any, i: number) => {
        formData.append(`productos[${i}][producto]`, prod.producto);
        formData.append(`productos[${i}][cantidad]`, prod.cantidad);
      });

      if (this.selectedFile) {
        formData.append('imagen', this.selectedFile, this.selectedFile.name);
      }

      if (this.isEditMode) {
        this.actualizarMenu(formData);
      } else {
        this.crearMenu(formData);
      }
    } else {
      alert('⚠️ Por favor completa todos los campos requeridos');
    }
  }

  private validarFormularioParaEdicion(): boolean {
    const nombre = this.menuForm.get('nombre')?.value;
    const descripcion = this.menuForm.get('descripcion')?.value;
    const precio = this.menuForm.get('precio')?.value;
    const tipo_menu = this.menuForm.get('tipo_menu')?.value;
    const estado = this.menuForm.get('estado')?.value;
    const productos = this.menuForm.get('productos')?.value;

    const camposCompletos = nombre && descripcion && precio && tipo_menu && estado && productos && productos.length > 0;
    const precioValido = /^\d+(\.\d{1,2})?$/.test(precio) && parseFloat(precio) > 0;

    console.log('🔍 Validación edición:', {
      nombre: !!nombre,
      descripcion: !!descripcion,
      precio: precioValido,
      tipo_menu: !!tipo_menu,
      estado: !!estado,
      productos: !!productos && productos.length > 0,
      valid: camposCompletos && precioValido
    });

    return camposCompletos && precioValido;
  }


  // 🆕 Método separado para crear menu
  private crearMenu(formData: FormData): void {
    this.catalogoService.crearMenu(formData).subscribe({
      next: (response) => {
        console.log('✅ menu creado exitosamente', response);
        this.mostrarDialogExito(
          'CREADO',
          '¡El Menu ha sido creado exitosamente!',
          'Continuar'
        );
      },
      error: (error) => {
        console.error('❌ Error al crear el menu', error);
        alert('❌ Error al crear el menu. Revisa los datos e intenta nuevamente.');
        this.saving = false;
      }
    });
  }


  //  Método para actualizar menu
  private actualizarMenu(formData: FormData): void {
    if (!this.menuId) return;

    this.catalogoService.actualizarMenu(this.menuId, formData).subscribe({
      next: (response) => {
        console.log('✅ menu actualizado exitosamente', response);
        this.saving = false;
        this.mostrarDialogExito(
          'ACTUALIZADO',
          '¡El Menu ha sido actualizado exitosamente!',
          'Continuar'
        );
        this.router.navigate(['/administrador/gestion-menus/editar-eliminar']);
      },
      error: (error) => {
        console.error('❌ Error al actualizar el menu', error);
        alert('❌ Error al actualizar el menu. Revisa los datos e intenta nuevamente.');
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
        this.navegarAListaMenus();
      } else {
        this.limpiarFormulario();
      }
    });
  }
  private navegarAListaMenus(): void {
    this.router.navigate(['/administrador/gestion-menus/crear']);
  }

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

    // Limpiar productos seleccionados
    this.productosSeleccionados = [];
    this.menuForm.get('productos')?.setValue([]);
  }
}
