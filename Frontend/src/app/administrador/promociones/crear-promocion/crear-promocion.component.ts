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
import { Observable, forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';

interface ProductoConTamano extends Producto {
  tamanoSeleccionado?: Tamano | null;
}

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
  menusSeleccionados: Menu[] = [];
  productosSeleccionados: ProductoConTamano [] = [];
  categorias: Categoria[] = [];
  search: string = '';
  loading = false;
  estados: any[] = [];
  tamanos: Tamano[] = []; // ✅ AGREGAR estas propiedades
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
    // ✅ AGREGAR estas líneas AL INICIO para detectar el modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.promocionId = parseInt(id, 10);
      this.isEditMode = true;
    }

    this.cargarEstados();
    this.cargarTamanos();
    
    // ✅ CAMBIAR: Cargar productos PRIMERO y LUEGO la promoción
    this.cargarProductos().subscribe(() => {
      console.log('✅ Productos cargados, ahora verificando modo edición...');
      if (this.isEditMode) {
        console.log('🔄 MODO EDICIÓN - promocionId:', this.promocionId);
        this.cargarPromocionParaEditar();
      }
    });
    
    // ✅ CAMBIAR: Cargar menús PRIMERO 
    this.cargarMenus().subscribe(() => {
      console.log('✅ Menús cargados');
    });
  }

  cargarEstados(): void {
    this.catalogoService.getEstados().subscribe(data => {
      this.estados = data;
    });
  }

  cargarTamanos(): void {
    this.publicidadService.getTamanos().subscribe((data: Tamano[]) => {
      this.tamanos = data;
    });
  }

  // En el método cargarProductos, AGREGAR la carga de imágenes:
  private cargarProductos(): Observable<any> {
    return this.catalogoService.obtenerProductos().pipe(
      tap(productos => {
        this.productos = productos.filter((producto: Producto) => producto.estado === 4);
        console.log('📦 Productos cargados:', this.productos);
        // ✅ AGREGAR esta línea
        this.loadProductImages();
      })
    );
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

  // ✅ CORREGIR este método (línea 162-172)
  private cargarMenus(): Observable<any> {
    return this.catalogoService.obtenerMenus().pipe(
      tap(menus => {
        // ✅ CAMBIAR: menu.estado?.id === 4 por menu.estado === 4
        this.menus = menus.filter((menu: Menu) => menu.estado === 4);
        console.log('🍽️ Menús cargados:', this.menus);
        
        // Cargar imágenes después
        this.loadMenuImages();
      })
    );
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
      this.productosSeleccionados.forEach((producto, index) => {
        formData.append(`productos[${index}][producto]`, producto.id.toString());
        if (producto.tamanoSeleccionado) {
          formData.append(`productos[${index}][tamano]`, producto.tamanoSeleccionado.id.toString());
        }
      });
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
          this.mostrarDialogExito(
            'CREADO',
            '¡La Promocion ha sido creada exitosamente!',
            'Continuar'
          );
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
        this.mostrarDialogExito(
          'CREADO',
          '¡La Promocion ha sido actualizada exitosamente!',
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
    // Verificar si el producto requiere tamaño
    if (producto.aplica_tamanos && !tamanoId) {
      alert('⚠️ Este producto requiere seleccionar un tamaño');
      return;
    }
    
    // Verificar duplicados con el mismo tamaño
    const yaExiste = this.productosSeleccionados.some(p => 
      p.id === producto.id && 
      (p.tamanoSeleccionado?.id || null) === (tamanoId || null)
    );
    
    if (yaExiste) {
      const tamanoTexto = tamanoId ? ' con este tamaño' : '';
      alert(`El producto${tamanoTexto} ya fue ingresado`);
      return;
    }
    
    // ✅ USAR la interfaz Tamano correcta
    const productoConTamano: ProductoConTamano = { 
      ...producto,
      tamanoSeleccionado: tamanoId ? this.tamanos.find(t => t.id === tamanoId) || null : null
    };
    
    this.productosSeleccionados.push(productoConTamano);
    this.actualizarVisualizacionProductos();
  }

  // ✅ AGREGAR método para actualizar visualización
  private actualizarVisualizacionProductos(): void {
    const productosTexto = this.productosSeleccionados.map(p => {
      const tamanoStr = p.tamanoSeleccionado ? ` (${p.tamanoSeleccionado.nombre})` : '';
      return `${p.nombre}${tamanoStr}`;
    }).join(', ');
    
    this.promocionForm.get('productosSeleccionados')?.setValue(productosTexto);
  }

  eliminarProducto(producto: Producto): void {
    this.productosSeleccionados = this.productosSeleccionados.filter(p => p.id !== producto.id);
    this.actualizarVisualizacionProductos();
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
    this.router.navigate(['/administrador/gestion-promociones/crear']);
  }
  private cargarPromocionParaEditar(): void {
    if (!this.promocionId) return;

    this.publicidadService.obtenerPromocionPorId(this.promocionId).subscribe({
      next: (promocion) => {
        console.log('🔍 DEBUG 1 - Promoción completa del backend:', promocion);
        console.log('📦 DEBUG 2 - productos_detalle:', promocion.productos_detalle);
        console.log('🍽️ DEBUG 3 - menus_detalle:', promocion.menus_detalle);

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

        console.log('🛍️ DEBUG 4 - Productos disponibles:', this.productos);
        console.log('📏 DEBUG 5 - Tamaños disponibles:', this.tamanos);

        // ✅ VERIFICAR si entra al bloque de productos
        console.log('🔍 DEBUG 6 - Verificando productos_detalle...');
        console.log('   - productos_detalle existe?', !!promocion.productos_detalle);
        console.log('   - es array?', Array.isArray(promocion.productos_detalle));
        console.log('   - longitud:', promocion.productos_detalle?.length);

        if (promocion.productos_detalle && Array.isArray(promocion.productos_detalle)) {
          console.log('✅ DEBUG 7 - ENTRANDO al bloque de productos');
          
          // ✅ CAMBIAR: Procesar cada producto con su tamaño específico
          this.productosSeleccionados = promocion.productos_detalle
            .map((pd: any) => {
              const producto = this.productos.find(prod => prod.id === (pd.producto?.id ?? pd.producto));
              if (!producto) {
                console.log(`❌ Producto no encontrado para ID: ${pd.producto?.id ?? pd.producto}`);
                return null;
              }
              
              // ✅ BUSCAR el tamaño por nombre (como viene del backend)
              let tamanoSeleccionado = null;
              if (pd.tamano_nombre) {
                tamanoSeleccionado = this.tamanos.find(t => t.nombre === pd.tamano_nombre);
                console.log(`🔍 Buscando tamaño "${pd.tamano_nombre}":`, tamanoSeleccionado);
              }
              
              const productoConTamano: ProductoConTamano = {
                ...producto,
                tamanoSeleccionado: tamanoSeleccionado
              };
              
              console.log(`✨ Producto procesado:`, productoConTamano);
              return productoConTamano;
            })
            .filter((p: any): p is ProductoConTamano => !!p);
          
          console.log('🎉 DEBUG 11 - productosSeleccionados final:', this.productosSeleccionados);
          
          // ✅ ACTUALIZAR la visualización
          this.actualizarVisualizacionProductos();
        } else {
          console.log('❌ DEBUG 7 - NO ENTRANDO al bloque de productos');
          console.log('   - Motivo: productos_detalle no existe o no es array');
        }

        // ✅ DEBUG similar para menús
        console.log('🔍 DEBUG 12 - Verificando menus_detalle...');
        if (promocion.menus_detalle && Array.isArray(promocion.menus_detalle)) {
          console.log('✅ DEBUG 13 - ENTRANDO al bloque de menús');
          
          this.menusSeleccionados = promocion.menus_detalle
            .map((md: any) => {
              const menuId = md.menu?.id ?? md.menu;
              const menu = this.menus.find(m => m.id === menuId);
              console.log(`🔍 Buscando menu ID ${menuId}:`, menu);
              return menu;
            })
            .filter((m: any): m is Menu => !!m);
          
          console.log('🎉 Menús seleccionados final:', this.menusSeleccionados);
          
          // ✅ ACTUALIZAR la visualización
          this.actualizarVisualizacionMenus();
        } else {
          console.log('❌ DEBUG 13 - NO ENTRANDO al bloque de menús');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar la promoción:', error);
        alert('❌ Error al cargar la promoción. Redirigiendo...');
        this.router.navigate(['/administrador/gestion-promociones']);
      }
    });
  }

  agregarMenu(menu: Menu): void {
    // Verificar si el menú ya está seleccionado
    const yaExiste = this.menusSeleccionados.some(m => m.id === menu.id);
    
    if (yaExiste) {
      alert('El menú ya fue agregado');
      return;
    }
    
    this.menusSeleccionados.push(menu);
    this.actualizarVisualizacionMenus();
  }

  // ✅ AGREGAR método para actualizar visualización de menús
  private actualizarVisualizacionMenus(): void {
    const menusTexto = this.menusSeleccionados.map(m => m.nombre).join(', ');
    this.promocionForm.get('menusSeleccionados')?.setValue(menusTexto);
  }

  // ✅ AGREGAR estos getters
  get productosSeleccionadosTexto(): string {
    console.log('🔍 DEBUG getter productosSeleccionadosTexto ejecutado');
    console.log('📦 productosSeleccionados actuales:', this.productosSeleccionados);
    
    if (!this.productosSeleccionados || this.productosSeleccionados.length === 0) {
      console.log('❌ No hay productos seleccionados');
      return '';
    }
    
    return this.productosSeleccionados.map(prod => {
      let texto = prod.nombre;
      // ✅ AGREGAR tamaño si existe
      if (prod.tamanoSeleccionado) {
        texto += ` (${prod.tamanoSeleccionado.nombre})`;
      }
      console.log(`✨ Producto texto: ${texto}`);
      return texto;
    }).join(', ');
  }

  get menusSeleccionadosTexto(): string {
    console.log('🔍 DEBUG getter menusSeleccionadosTexto ejecutado');
    console.log('🍽️ menusSeleccionados actuales:', this.menusSeleccionados);
    
    if (!this.menusSeleccionados || this.menusSeleccionados.length === 0) {
      console.log('❌ No hay menús seleccionados');
      return '';
    }
    
    return this.menusSeleccionados.map(menu => menu.nombre).join(', ');
  }
}
