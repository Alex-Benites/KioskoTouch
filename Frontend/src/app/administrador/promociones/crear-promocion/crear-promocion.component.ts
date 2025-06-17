import { Component, OnInit, inject } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';
import { FormsModule } from '@angular/forms';
import { Tamano } from '../../../models/tamano.model';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { WarningDialogComponent, WarningDialogData } from '../../../shared/warning-dialog/warning-dialog.component';

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
  private dialog = inject(MatDialog);
  promocionForm: FormGroup;
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  currentImageUrl: string | null = null;
  isEditMode = false;
  saving = false;
  promocionId: number | null = null;
  productos: Producto[] = [];
  menus: Menu[] = [];
  tamanos: Tamano[] = [];
  productosConTamanos: Producto[] = [];
  menusSeleccionados: Menu[] = [];
  productosSeleccionados: {
    producto: number,
    tamano?: number
  }[] = [];
  categorias: Categoria[] = [];
  search: string = '';
  loading = false;
  estados: any[] = [];

  busqueda: string = '';
  productosFiltrados: Producto[] = [];
  menusFiltrados: Menu[] = [];

  private productosCargados = false;
  private menusCargados = false;
  private tamanosCargados = false;

  private intentoDeCargaRealizada = false;

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
        Validators.pattern(/^(100|[1-9][0-9]?)$/),
        Validators.min(1),
        Validators.max(100)
      ]],
      codigo_promocional: [''],
      limite_uso_total: ['', [
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
      menusSeleccionados: [''],
      busqueda: ['']
    });
  }

  ngOnInit(): void {
    this.promocionId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.promocionId && !isNaN(this.promocionId);

    this.catalogoService.getEstados().subscribe(data => {
      this.estados = data;

      // Buscar el id del estado "Activado"
      const estadoActivado = this.estados.find(e => e.nombre === 'Activado');
      const idEstadoActivado = estadoActivado ? estadoActivado.id : null;

      this.catalogoService.getTamanos().subscribe(data => {
        this.tamanos = data;
        this.tamanosCargados = true;
        this.intentarCargarPromocionParaEditar();
      });

      this.catalogoService.getProductos().subscribe(data => {
        // Solo productos con estado 'Activado'
        this.productos = idEstadoActivado
          ? data.filter((producto: Producto) => producto.estado === idEstadoActivado)
          : [];
        this.loadProductImages();
        this.productosCargados = true;
        this.filtrarProductosYMenus();
        this.intentarCargarPromocionParaEditar();
      });

      this.cargarMenus(idEstadoActivado);
    });

    this.promocionForm.get('tipo_promocion')?.valueChanges.subscribe(tipo => {
      this.actualizarValidacionesPorTipo(tipo);
    });
    const tipoActual = this.promocionForm.get('tipo_promocion')?.value;
    if (tipoActual) {
      this.actualizarValidacionesPorTipo(tipoActual);
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
  cargarMenus(idEstadoActivado?: number): void {
  this.loading = true;
  this.catalogoService.getMenus().subscribe({
    next: (menus) => {
      // Solo menús con estado 'Activado'
      this.menus = idEstadoActivado
        ? menus.filter((menu: Menu) => menu.estado === idEstadoActivado)
        : menus;

      this.menus = this.menus.map(menu => {
        this.catalogoService.getMenuImagen(menu.id).subscribe(response => {
          menu.imagenUrl = response.imagen_url;
        });
        menu.menuLista = this.getProductosLista(menu);
        return menu;
      });
      this.loading = false;
      this.menusCargados = true;
      this.filtrarProductosYMenus();
      this.intentarCargarPromocionParaEditar();
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
    let tamano = '';
    if (p.tamano_codigo) {
      tamano = ` (${p.tamano_codigo})`;
    } else if (p.tamano_nombre) {
      tamano = ` (${p.tamano_nombre.charAt(0).toUpperCase()})`;
    }
    return cantidad > 1
      ? `- ${nombre}${tamano} (${cantidad})`
      : `- ${nombre}${tamano}`;
  });
}
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
    if (this.selectedFile) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(this.selectedFile.type)) {
        alert('⚠ Solo se permiten archivos de imagen (JPG, PNG, GIF)');
        this.eliminarImagen();
        return;
      }

      const maxSize = 5 * 1024 * 1024;
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
    this.currentImageUrl = null;

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
      return 'El descuento debe ser un número entero entre 1 y 100';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'El descuento debe ser mayor a 0';
    }
    if (control?.hasError('max') && control?.touched) {
      return 'El descuento no puede ser mayor a 100';
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
  get codigoPromocionalDeshabilitado(): boolean {
    const tipo = this.promocionForm.get('tipo_promocion')?.value;
    return tipo === 'navidad' || tipo === 'agotado';
  }
  onSubmit(): void {
  if (!this.productosSeleccionados.length && !this.menusSeleccionados.length) {
    alert('⚠️ Debes seleccionar al menos un producto o menú para la promoción.');
    return;
  }

  const formValid = this.isEditMode
    ? this.validarFormularioParaEdicion()
    : this.promocionForm.valid;

  if (formValid) {
    this.mostrarDialogConfirmacion();
  }
}

private mostrarDialogConfirmacion(): void {
  const dialogData: ConfirmationDialogData = {
    itemType: 'promoción',
    action: this.isEditMode ? 'update' : 'create'
  };

  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    disableClose: true,
    data: dialogData
  });

  dialogRef.afterClosed().subscribe((confirmed: boolean) => {
    if (confirmed) {
      this.procesarFormularioPromocion();
    }
  });
}

private procesarFormularioPromocion(): void {
  this.saving = true;
  const formValue = this.promocionForm.getRawValue();

  const fechaInicio = this.formatDateForBackend(formValue.fecha_inicio_promo);
  const fechaFin = this.formatDateForBackend(formValue.fecha_fin_promo);

  const formData = new FormData();
  formData.append('nombre', formValue.nombre);
  formData.append('descripcion', formValue.descripcion);
  formData.append('valor_descuento', Number(formValue.valor_descuento).toString());
  formData.append('fecha_inicio_promo', fechaInicio);
  formData.append('fecha_fin_promo', fechaFin);
  formData.append('tipo_promocion', formValue.tipo_promocion);

  if (this.promocionForm.get('codigo_promocional')?.enabled && formValue.codigo_promocional) {
    formData.append('codigo_promocional', formValue.codigo_promocional);
  } else {
    // Si está deshabilitado, envía vacío para que el backend lo borre
    formData.append('codigo_promocional', '');
  }
  if (this.promocionForm.get('limite_uso_total')?.enabled && formValue.limite_uso_total) {
    formData.append('limite_uso_total', Number(formValue.limite_uso_total).toString());
  } else {
    // Si está deshabilitado, envía vacío para que el backend lo borre
    formData.append('limite_uso_total', '');
  }
  if (this.promocionForm.get('limite_uso_usuario')?.enabled && formValue.limite_uso_usuario) {
    formData.append('limite_uso_usuario', Number(formValue.limite_uso_usuario).toString());
  }

  formData.append('estado', formValue.estado);

  formData.append('productos_detalle', JSON.stringify(this.productosSeleccionados));
  if (this.menusSeleccionados.length > 0) {
    this.menusSeleccionados.forEach(menu => formData.append('menus', menu.id.toString()));
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
        this.mostrarDialogExito(
          'CREADO',
          '¡La Promoción ha sido creada exitosamente!',
          'Continuar'
        );
        this.router.navigate(['/administrador/gestion-promociones']);
      },
      error: (err) => {
        if (err.error) {
          if (err.error.detalles) {
            for (const campo in err.error.detalles) {
              if (Object.prototype.hasOwnProperty.call(err.error.detalles, campo)) {
                // No log
              }
            }
            alert('Error al crear la promoción:\n' + JSON.stringify(err.error.detalles, null, 2));
          }
        }
        this.saving = false;
      }
    });
  }
}

public validarFormularioParaEdicion(): boolean {
  const formValue = this.promocionForm.getRawValue();
  const tipo = formValue.tipo_promocion;

  const camposCompletos =
    formValue.nombre &&
    formValue.descripcion &&
    formValue.tipo_promocion &&
    formValue.valor_descuento &&
    formValue.estado &&
    (this.productosSeleccionados.length > 0 || this.menusSeleccionados.length > 0) &&
    (
      (!this.promocionForm.get('codigo_promocional')?.enabled || formValue.codigo_promocional || tipo === 'otro')
    ) &&
    (
      !this.promocionForm.get('limite_uso_total')?.enabled || formValue.limite_uso_total
    ) &&
    (
      !this.promocionForm.get('limite_uso_usuario')?.enabled || formValue.limite_uso_usuario
    ) &&
    (
      !this.promocionForm.get('fecha_inicio_promo')?.enabled || formValue.fecha_inicio_promo
    ) &&
    (
      !this.promocionForm.get('fecha_fin_promo')?.enabled || formValue.fecha_fin_promo
    );

  const descuentoValido = /^\d+(\.\d{1,2})?$/.test(formValue.valor_descuento) && parseFloat(formValue.valor_descuento) > 0;
  const limiteTotalValido = !this.promocionForm.get('limite_uso_total')?.enabled ||
    (/^\d+$/.test(formValue.limite_uso_total) && parseInt(formValue.limite_uso_total) > 0);
  const limiteUsuarioValido = !this.promocionForm.get('limite_uso_usuario')?.enabled ||
    (/^\d+$/.test(formValue.limite_uso_usuario) && parseInt(formValue.limite_uso_usuario) > 0);

  const codigoPromocionalValido =
    !this.promocionForm.get('codigo_promocional')?.enabled ||
    tipo === 'otro' ||
    (formValue.codigo_promocional && formValue.codigo_promocional.trim().length > 0);

  return camposCompletos && descuentoValido && limiteTotalValido && limiteUsuarioValido && codigoPromocionalValido;
}

actualizarPromocion(formData: FormData): void {
  if (!this.promocionId) return;

  this.publicidadService.actualizarPromocion(this.promocionId, formData).subscribe({
    next: (response) => {
      this.mostrarDialogExito(
        'ACTUALIZADO',
        '¡La Promoción ha sido actualizada exitosamente!',
        'Continuar'
      );
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
  agregarProducto(producto: Producto, tamanoId?: number): void {
    if (!producto || !producto.id) return;

    if (producto.aplica_tamanos && !tamanoId) {
      alert('⚠️ Este producto requiere seleccionar un tamaño');
      return;
    }

    const yaAgregado = this.productosSeleccionados.some(p =>
      p.producto === producto.id &&
      (p.tamano || null) === (tamanoId || null)
    );

    if (yaAgregado) {
      const dialogData: WarningDialogData = {
        message: 'El producto ya fue agregado, seleccione otro.'
      };
      this.dialog.open(WarningDialogComponent, {
        data: dialogData,
        disableClose: true
      });
      return;
    }

    const nuevoProducto: any = {
      producto: producto.id
    };
    if (tamanoId) {
      nuevoProducto.tamano = tamanoId;
    }
    this.productosSeleccionados.push(nuevoProducto);

    this.promocionForm.get('productosSeleccionados')?.setValue(this.productosSeleccionadosTexto);
  }

agregarMenu(menu: Menu): void {
  if (this.menusSeleccionados.some(m => m.id === menu.id)) {
    const dialogData: WarningDialogData = {
        message: 'El menú ya fue agregado, seleccione otro.'
      };
      this.dialog.open(WarningDialogComponent, {
        data: dialogData,
        disableClose: true
      });
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
      this.router.navigate(['/administrador/gestion-promociones']);
    }
  });
}
private navegarAListaMenus(): void {
  this.router.navigate(['/administrador/gestion-promociones/editar-eliminar']);
}
private cargarPromocionParaEditar(): void {
  if (!this.promocionId) return;

  this.publicidadService.obtenerPromocionPorId(this.promocionId).subscribe({
    next: (promocion) => {
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

      if (promocion.imagen_url) {
        this.currentImageUrl = this.publicidadService.getFullMediaUrl(promocion.imagen_url);
        this.imagePreview = this.currentImageUrl;
        this.promocionForm.get('imagen')?.clearValidators();
        this.promocionForm.get('imagen')?.updateValueAndValidity();
      }

      if (promocion.productos_detalle && Array.isArray(promocion.productos_detalle)) {
        this.productosSeleccionados = promocion.productos_detalle
          .map((p: any) => {
            const productoId = p.producto?.id ?? p.producto;
            const producto = this.productos.find(prod => prod.id === productoId);
            if (!producto) return null;

            let tamanoId: number | undefined;
            if (p.tamano?.id) {
              tamanoId = p.tamano.id;
            } else if (typeof p.tamano === 'number') {
              tamanoId = p.tamano;
            } else if (p.tamano_codigo) {
              const t = this.tamanos.find(tam => tam.codigo === p.tamano_codigo);
              if (t) tamanoId = t.id;
            } else if (p.tamano_nombre) {
              const t = this.tamanos.find(tam => tam.nombre === p.tamano_nombre);
              if (t) tamanoId = t.id;
            }

            return {
              producto: producto.id,
              ...(tamanoId && { tamano: tamanoId })
            };
          })
          .filter((p: any) => !!p);
        this.promocionForm.get('productosSeleccionados')?.setValue(this.productosSeleccionadosTexto);
      } else {
        this.productosSeleccionados = [];
        this.promocionForm.get('productosSeleccionados')?.setValue('');
      }
      if (promocion.menus_detalle && Array.isArray(promocion.menus_detalle)) {
        this.menusSeleccionados = promocion.menus_detalle
          .map((m: any) => {
            let menuId: number | undefined;
            if (m.menu && typeof m.menu === 'object' && m.menu.id) {
              menuId = Number(m.menu.id);
            } else if (typeof m.menu === 'number' || typeof m.menu === 'string') {
              menuId = Number(m.menu);
            } else if (typeof m === 'object' && m.id) {
              menuId = Number(m.id);
            } else if (typeof m === 'number' || typeof m === 'string') {
              menuId = Number(m);
            }
            return this.menus.find(menu => Number(menu.id) === menuId);
          })
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

get productosSeleccionadosTexto(): string {
  return this.productosSeleccionados
    .filter(p => p.producto)
    .map(p => {
      const prod = this.productos.find(x => x.id === p.producto);
      if (!prod) return '';
      let tamanoStr = '';
      if (p.tamano) {
        const tam = this.tamanos.find(t => t.id === p.tamano);
        if (tam && tam.codigo) {
          tamanoStr = ` (${tam.codigo})`;
        }
      }
      return `${prod.nombre}${tamanoStr}`;
    })
    .filter(Boolean)
    .join(', ');
}

filtrarProductosYMenus(): void {
  const texto = this.promocionForm.get('busqueda')?.value.trim().toLowerCase() || '';

  this.productosFiltrados = this.productos.filter(p =>
    p.nombre.toLowerCase().includes(texto)
  );

  this.menusFiltrados = this.menus.filter(m =>
    m.nombre.toLowerCase().includes(texto)
  );
}
private intentarCargarPromocionParaEditar(): void {
  if (
    this.isEditMode &&
    this.promocionId &&
    this.productosCargados &&
    this.menusCargados &&
    this.tamanosCargados &&
    !this.intentoDeCargaRealizada
  ) {
    this.cargarPromocionParaEditar();
    this.intentoDeCargaRealizada = true;
  }
}

private actualizarValidacionesPorTipo(tipo: string): void {
  const codigoCtrl = this.promocionForm.get('codigo_promocional');
  const limiteTotalCtrl = this.promocionForm.get('limite_uso_total');
  const limiteUsuarioCtrl = this.promocionForm.get('limite_uso_usuario');
  const fechaInicioCtrl = this.promocionForm.get('fecha_inicio_promo');
  const fechaFinCtrl = this.promocionForm.get('fecha_fin_promo');

  if (tipo === 'cupon' || tipo === 'cumpleanos') {
    codigoCtrl?.setValidators([Validators.required]);
    codigoCtrl?.enable();
  } else if (tipo === 'otro') {
    codigoCtrl?.clearValidators();
    codigoCtrl?.enable();
  } else {
    codigoCtrl?.clearValidators();
    codigoCtrl?.setValue('');
    codigoCtrl?.disable();
  }
  codigoCtrl?.updateValueAndValidity();


  if (tipo === 'cumpleanos' || tipo === 'navidad') {
    limiteTotalCtrl?.setValue('');
    limiteTotalCtrl?.clearValidators();
    limiteTotalCtrl?.disable();
    if (tipo === 'cumpleanos') {
      const year = new Date().getFullYear();
      fechaInicioCtrl?.setValue(new Date(year, 0, 1));
      fechaFinCtrl?.setValue(new Date(year, 11, 31));
      fechaInicioCtrl?.disable();
      fechaFinCtrl?.disable();
    } else {
      fechaInicioCtrl?.enable();
      fechaFinCtrl?.enable();
    }
    limiteUsuarioCtrl?.setValidators([
      Validators.required,
      Validators.pattern(/^\d+$/),
      Validators.min(1)
    ]);
    limiteUsuarioCtrl?.enable();
  } else {
    limiteTotalCtrl?.enable();
    limiteTotalCtrl?.setValidators([
      Validators.required,
      Validators.pattern(/^\d+$/),
      Validators.min(1)
    ]);
    fechaInicioCtrl?.enable();
    fechaFinCtrl?.enable();
    limiteUsuarioCtrl?.setValidators([
      Validators.required,
      Validators.pattern(/^\d+$/),
      Validators.min(1)
    ]);
    limiteUsuarioCtrl?.enable();
  }
  limiteTotalCtrl?.updateValueAndValidity();
  limiteUsuarioCtrl?.updateValueAndValidity();
  fechaInicioCtrl?.updateValueAndValidity();
  fechaFinCtrl?.updateValueAndValidity();
}

onDescuentoInput(event: any): void {
  let value = event.target.value;
  if (value && value.includes('.')) {
    value = value.split('.')[0];
  }
  if (parseInt(value, 10) > 100) {
    value = '100';
  }
  if (parseInt(value, 10) < 1 && value !== '') {
    value = '1';
  }
  event.target.value = value;
  this.promocionForm.get('valor_descuento')?.setValue(value);
}

private formatDateForBackend(date: any): string {
  if (!date) return '';
  return new Date(date).toISOString();
}
}
