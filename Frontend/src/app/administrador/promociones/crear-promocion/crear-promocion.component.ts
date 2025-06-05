import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { Router, ActivatedRoute } from '@angular/router';
import { CatalogoService } from '../../../services/catalogo.service';
import { PublicidadService } from '../../../services/publicidad.service';
import { Producto, Estado, Categoria, Menu } from '../../../models/catalogo.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-crear-promocion',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, HeaderAdminComponent, FooterAdminComponent,
    MatDatepickerModule, MatNativeDateModule, MatIconModule,
    FormsModule
  ],
  templateUrl: './crear-promocion.component.html',
  styleUrls: ['./crear-promocion.component.scss']
})
export class CrearPromocionComponent implements OnInit {
  promocionForm: FormGroup;
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  currentImageUrl: string | null = null;
  isEditMode = false;
  saving = false;
  promocionId: number | null = null;
  productos: Producto[] = [];
  menus: Menu[] = [];
  menusSeleccionados: Menu[] = [];
  productosSeleccionados: Producto [] = [];
  categorias: Categoria[] = [];
  search: string = '';
  loading = false;
  estados: any[] = [];
  constructor(
    private fb: FormBuilder,
    private catalogoService: CatalogoService,
    private publicidadService: PublicidadService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.promocionForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      tipo_promocion: ['', Validators.required],
      valor_descuento: ['', [
        Validators.required,
        Validators.pattern(/^\d+$/),
        Validators.min(0.01)
      ]],
      codigo_promocional: ['', Validators.required],
      limite_uso_total: ['', [
        Validators.required,
        Validators.pattern(/^\d+$/),
        Validators.min(1)
      ]],
      limite_uso_usuario: ['', [
        Validators.required,
        Validators.pattern(/^\d+$/),
        Validators.min(1)
      ]],
      fecha_inicio_promo: ['', Validators.required],
      fecha_fin_promo: ['', Validators.required],
      estado: ['', Validators.required],
      imagen: [null, Validators.required],
      productosSeleccionados: [''],
      menusSeleccionados: ['']
    });
  }

  ngOnInit(): void {
    this.promocionId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.promocionId && !isNaN(this.promocionId);

    this.catalogoService.getEstados().subscribe(data => {
      this.estados = data;
    });
    this.catalogoService.getProductos().subscribe(data => {
      this.productos = data;
      this.loadProductImages();
    });
    this.cargarMenus();

    if (this.isEditMode && this.promocionId) {
      this.cargarPromocionParaEditar();
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
  loadMenuImages(): void {
    this.menus.forEach(menu => {
      if (menu.id) {
        this.catalogoService.getMenuImagen(menu.id).subscribe(response => {
          menu.imagenUrl = response.imagen_url;
        });
      }
    });
  }
  cargarMenus(): void {
  this.loading = true;
  this.catalogoService.getMenus().subscribe({
    next: (menus) => {
      this.menus = menus.map(menu => {
        this.catalogoService.getMenuImagen(menu.id).subscribe(response => {
          menu.imagenUrl = response.imagen_url;
        });
        menu.menuLista = this.getProductosLista(menu);
        return menu;
      });
      this.loading = false;
    },
    error: (error) => {
      this.loading = false;
      alert('❌ Error al cargar los menus. Por favor, intenta de nuevo.');
    }
  });
}
  getProductosLista(menu: any): string[] {
  if (!menu.productos_detalle || !Array.isArray(menu.productos_detalle)) return [];
  return menu.productos_detalle.map((p: any) => {
    const cantidad = p.cantidad || 1;
    const nombre = p.nombre || p.producto_nombre || p.producto?.nombre || '';
    return cantidad > 1 ? `- ${nombre} (${cantidad})` : `- ${nombre}`;
  });
}
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
    if (this.selectedFile) {
      // ← VALIDAR TIPO DE ARCHIVO
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(this.selectedFile.type)) {
        alert('⚠ Solo se permiten archivos de imagen (JPG, PNG, GIF)');
        this.eliminarImagen();
        return;
      }

      // ← VALIDAR TAMAÑO (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (this.selectedFile.size > maxSize) {
        alert('⚠ La imagen no puede ser mayor a 5MB');
        this.eliminarImagen();
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      }
      reader.readAsDataURL(this.selectedFile);

      // ← ACTUALIZAR EL CONTROL DEL FORMULARIO
      this.promocionForm.get('imagen')?.setValue(this.selectedFile);
      this.promocionForm.get('imagen')?.markAsTouched();
    }
  }
  getFullImageUrl(imagenUrl: string | undefined): string {
    return this.catalogoService.getFullImageUrl(imagenUrl);
  }
  eliminarImagen(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.currentImageUrl = null; // Limpiar imagen actual también

    //Solo marcar como error si estamos en modo creación
    this.promocionForm.get('imagen')?.setValue(null);
    if (!this.isEditMode) {
      this.promocionForm.get('imagen')?.markAsTouched();
    }
  }
  get DescuentoError(): string {
    const control = this.promocionForm.get('valor_descuento');
    if (control?.hasError('required') && control?.touched) {
      return 'El descuento es obligatorio';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'El descuento debe ser un número válido';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'El descuento debe ser mayor a 0';
    }
    return '';
  }
  get limiteTotalError(): string {
    const control = this.promocionForm.get('limite_uso_total');
    if (control?.hasError('required') && control?.touched) {
      return 'El limite de uso total es obligatorio';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'El limite de uso total debe ser un número válido';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'El limite de uso total debe ser mayor a 0';
    }
    return '';
  }
  get limiteUsuarioError(): string {
    const control = this.promocionForm.get('limite_uso_usuario');
    if (control?.hasError('required') && control?.touched) {
      return 'El limite de uso por usuario es obligatorio';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'El limite de uso por usuario debe ser un número válido';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'El limite de uso por usuario debe ser mayor a 0';
    }
    return '';
  }
  get disponibilidadError(): string {
    const control = this.promocionForm.get('disponibilidad');
    if (control?.hasError('required') && control?.touched) {
      return 'La disponibilidad es obligatoria';
    }
    return '';
  }

  get imagenError(): string {
    const control = this.promocionForm.get('imagen');
    if (control?.hasError('required') && control?.touched && !this.isEditMode) {
      return 'La imagen es obligatoria';
    }
    return '';
  }
  onSubmit(): void {
  // Validar productos y menús seleccionados
  const productosIds = this.productosSeleccionados.map(p => p.id);
  const menusIds = this.menusSeleccionados.map(m => m.id);

  if (!productosIds.length && !menusIds.length) {
    alert('⚠️ Debes seleccionar al menos un producto o menú para la promoción.');
    return;
  }

  const formValid = this.isEditMode
    ? this.validarFormularioParaEdicion()
    : this.promocionForm.valid;

  if (formValid) {
    this.saving = true;
    const formValue = this.promocionForm.value;

    // Convertir fechas a formato ISO
    const fechaInicio = formValue.fecha_inicio_promo
      ? new Date(formValue.fecha_inicio_promo).toISOString()
      : '';
    const fechaFin = formValue.fecha_fin_promo
      ? new Date(formValue.fecha_fin_promo).toISOString()
      : '';

    const formData = new FormData();
    formData.append('nombre', formValue.nombre);
    formData.append('descripcion', formValue.descripcion);
    formData.append('valor_descuento', formValue.valor_descuento.toString());
    formData.append('fecha_inicio_promo', fechaInicio);
    formData.append('fecha_fin_promo', fechaFin);
    formData.append('tipo_promocion', formValue.tipo_promocion);
    formData.append('codigo_promocional', formValue.codigo_promocional);
    formData.append('limite_uso_total', formValue.limite_uso_total.toString());
    formData.append('limite_uso_usuario', formValue.limite_uso_usuario.toString());
    formData.append('estado', formValue.estado);

    // Siempre envía el campo, aunque esté vacío
    if (productosIds.length > 0) {
      productosIds.forEach(id => formData.append('productos', id.toString()));
    } else {
      formData.append('productos', '__empty__');
    }

    if (menusIds.length > 0) {
      menusIds.forEach(id => formData.append('menus', id.toString()));
    } else {
      formData.append('menus', '__empty__');
    }

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile, this.selectedFile.name);
    }

    if (this.isEditMode && this.promocionId) {
      this.actualizarPromocion(formData);
    } else {
      this.publicidadService.crearPromocion(formData).subscribe({
        next: (resp) => {
          alert('Promoción creada exitosamente');
          this.router.navigate(['/administrador/gestion-promociones']);
        },
        error: (err) => {
          alert('Error al crear la promoción');
          this.saving = false;
        }
      });
    }
  } else {
    alert('Por favor completa todos los campos requeridos');
    this.promocionForm.markAllAsTouched();
  }
}

private validarFormularioParaEdicion(): boolean {
  const formValue = this.promocionForm.value;
  const camposCompletos =
    formValue.nombre &&
    formValue.descripcion &&
    formValue.tipo_promocion &&
    formValue.valor_descuento &&
    formValue.codigo_promocional &&
    formValue.limite_uso_total &&
    formValue.limite_uso_usuario &&
    formValue.fecha_inicio_promo &&
    formValue.fecha_fin_promo &&
    formValue.estado &&
    (this.productosSeleccionados.length > 0 || this.menusSeleccionados.length > 0);

  const descuentoValido = /^\d+(\.\d{1,2})?$/.test(formValue.valor_descuento) && parseFloat(formValue.valor_descuento) > 0;
  const limiteTotalValido = /^\d+$/.test(formValue.limite_uso_total) && parseInt(formValue.limite_uso_total) > 0;
  const limiteUsuarioValido = /^\d+$/.test(formValue.limite_uso_usuario) && parseInt(formValue.limite_uso_usuario) > 0;

  return camposCompletos && descuentoValido && limiteTotalValido && limiteUsuarioValido;
}

actualizarPromocion(formData: FormData): void {
  if (!this.promocionId) return;

  this.publicidadService.actualizarPromocion(this.promocionId, formData).subscribe({
    next: (response) => {
      alert('🎉 Promoción actualizada exitosamente!');
      this.saving = false;
      this.router.navigate(['/administrador/gestion-promociones']);
    },
    error: (error) => {
      console.error('❌ Error al actualizar la promoción', error);
      alert('❌ Error al actualizar la promoción. Revisa los datos e intenta nuevamente.');
      this.saving = false;
    }
  });
}
  agregarProducto(producto: Producto): void {
  if (this.productosSeleccionados.some(p => p.id === producto.id)) {
    alert('El producto ya fue ingresado');
    return;
  }
  this.productosSeleccionados.push(producto);
  this.promocionForm.get('productosSeleccionados')?.setValue(
    this.productosSeleccionados.map(p => p.nombre).join(', ')
  );
}

agregarMenu(menu: Menu): void {
  if (this.menusSeleccionados.some(m => m.id === menu.id)) {
    alert('El menú ya fue ingresado');
    return;
  }
  this.menusSeleccionados.push(menu);
  this.promocionForm.get('menusSeleccionados')?.setValue(
    this.menusSeleccionados.map(m => m.nombre).join(', ')
  );
}

eliminarProductos(): void {
  this.productosSeleccionados = [];
  this.promocionForm.get('productosSeleccionados')?.setValue('');
}

eliminarMenus(): void {
  this.menusSeleccionados = [];
  this.promocionForm.get('menusSeleccionados')?.setValue('');
}

tieneProductoOMenuSeleccionado(): boolean {
  return this.productosSeleccionados.length > 0 || this.menusSeleccionados.length > 0;
}

private cargarPromocionParaEditar(): void {
  if (!this.promocionId) return;

  this.publicidadService.obtenerPromocionPorId(this.promocionId).subscribe({
    next: (promocion) => {
      // Llenar formulario con datos de la promoción
      this.promocionForm.patchValue({
        nombre: promocion.nombre,
        descripcion: promocion.descripcion,
        tipo_promocion: promocion.tipo_promocion,
        valor_descuento: promocion.valor_descuento,
        codigo_promocional: promocion.codigo_promocional,
        limite_uso_total: promocion.limite_uso_total,
        limite_uso_usuario: promocion.limite_uso_usuario,
        fecha_inicio_promo: promocion.fecha_inicio_promo,
        fecha_fin_promo: promocion.fecha_fin_promo,
        estado: promocion.estado,
        imagen: null
      });

      // Manejar imagen actual
      if (promocion.imagen_url) {
        this.currentImageUrl = this.publicidadService.getFullImageUrl(promocion.imagen_url);
        this.imagePreview = this.currentImageUrl;
        this.promocionForm.get('imagen')?.clearValidators();
        this.promocionForm.get('imagen')?.updateValueAndValidity();
      }

      // Cargar productos seleccionados
      if (promocion.productos_detalle && Array.isArray(promocion.productos_detalle)) {
        this.productosSeleccionados = promocion.productos_detalle
          .map((p: any) => this.productos.find(prod => prod.id === (p.producto?.id ?? p.producto)))
          .filter((p: Producto | undefined): p is Producto => !!p);
        this.promocionForm.get('productosSeleccionados')?.setValue(
          this.productosSeleccionados.map(p => p.nombre).join(', ')
        );
      } else {
        this.productosSeleccionados = [];
        this.promocionForm.get('productosSeleccionados')?.setValue('');
      }

      // Cargar menús seleccionados
      if (promocion.menus_detalle && Array.isArray(promocion.menus_detalle)) {
        this.menusSeleccionados = promocion.menus_detalle
          .map((m: any) => this.menus.find(menu => menu.id === (m.menu?.id ?? m.menu)))
          .filter((m: Menu | undefined): m is Menu => !!m);
        this.promocionForm.get('menusSeleccionados')?.setValue(
          this.menusSeleccionados.map(m => m.nombre).join(', ')
        );
      } else {
        this.menusSeleccionados = [];
        this.promocionForm.get('menusSeleccionados')?.setValue('');
      }
    },
    error: (error) => {
      console.error('❌ Error al cargar la promoción:', error);
      alert('❌ Error al cargar la promoción. Redirigiendo...');
      this.router.navigate(['/administrador/gestion-promociones']);
    }
  });
}
}
