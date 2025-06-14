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
import {  Tamano } from '../../../models/tamano.model';
import { Router, ActivatedRoute } from '@angular/router';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
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
  tamanos: Tamano[] = [];
  productosConTamanos: Producto[] = [];
  search: string = '';
  productosSeleccionados: {
    producto: number,
    cantidad: number,
    tamano?: number
  }[] = [];

  busqueda: string = '';
  productosFiltrados: Producto[] = [];

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
        Validators.pattern(/^(?!0+(\.0{1,2})?$)\d+(\.\d{1,2})?$/),
        Validators.min(0.01)
      ]],
      tipo_menu: ['', Validators.required],
      estado: ['', Validators.required],
      productos: [[], Validators.required],
      imagen: [null, Validators.required],
      busqueda: [''],
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
    if (this.selectedFile) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(this.selectedFile.type)) {
        alert('⚠️ Solo se permiten archivos de imagen (JPG, PNG, GIF)');
        this.eliminarImagen();
        return;
      }
      const maxSize = 5 * 1024 * 1024;
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
      this.menuForm.get('imagen')?.setValue(this.selectedFile);
      this.menuForm.get('imagen')?.markAsTouched();
    }
  }

  ngOnInit(): void {
    this.menuId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.menuId && !isNaN(this.menuId);

    this.catalogoService.getEstados().subscribe(data => {
      this.estados = data;
    });
    this.catalogoService.getProductos().subscribe(data => {
      this.productos = data;
      this.loadProductImages();
      this.filtrarProductos();
    });
    this.catalogoService.getTamanos().subscribe(data => {
      this.tamanos = data;
    });

    if (this.isEditMode) {
      this.cargarmenuParaEditar();
    }

    this.filtrarProductos();
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

  private cargarmenuParaEditar(): void {
    if (!this.menuId) return;

    this.catalogoService.obtenerMenuPorId(this.menuId).subscribe({
      next: (menu) => {
        this.menuForm.patchValue({
          nombre: menu.nombre,
          descripcion: menu.descripcion,
          precio: menu.precio,
          tipo_menu: menu.tipo_menu,
          estado: menu.estado,
          productos: [],
          imagen: null
        });

        if (menu.imagen_url) {
          this.currentImageUrl = this.catalogoService.getFullImageUrl(menu.imagen_url);
          this.imagePreview = this.currentImageUrl;
          this.menuForm.get('imagen')?.clearValidators();
          this.menuForm.get('imagen')?.updateValueAndValidity();
        }

        if (menu.productos_detalle && Array.isArray(menu.productos_detalle)) {
          this.productosSeleccionados = menu.productos_detalle.map((p: any) => {
            const productoData: any = {
              producto: typeof p.producto === 'object' ? p.producto.id : p.producto,
              cantidad: p.cantidad
            };
            if (p.tamano_nombre) {
              const tamano = this.tamanos.find(t => t.nombre === p.tamano_nombre);
              if (tamano) {
                productoData.tamano = tamano.id;
              }
            }
            return productoData;
          });

          this.menuForm.get('productos')?.setValue(this.productosSeleccionados);
        } else {
          this.productosSeleccionados = [];
          this.menuForm.get('productos')?.setValue([]);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar el menú:', error);
      }
    });
  }

  get productosSeleccionadosTexto(): string {
    if (!this.productosSeleccionados || this.productosSeleccionados.length === 0) {
      return '';
    }
    return this.productosSeleccionados.map(prodSel => {
      const producto = this.productos.find(p => p.id === prodSel.producto);
      if (!producto) return 'Producto no encontrado';
      let texto = `${producto.nombre}`;
      if (prodSel.cantidad > 1) {
        texto += ` (x${prodSel.cantidad})`;
      }
      if (prodSel.tamano) {
        const tamano = this.tamanos.find(t => t.id === prodSel.tamano);
        if (tamano && tamano.codigo) {
          texto += ` (${tamano.codigo})`;
        }
      }
      return texto;
    }).join(', ');
  }

  agregarProducto(producto: Producto, tamanoId?: number): void {
    if (!producto || !producto.id) return;
    if (producto.aplica_tamanos && !tamanoId) {
      alert('⚠️ Este producto requiere seleccionar un tamaño');
      return;
    }
    const idx = this.productosSeleccionados.findIndex(p =>
      p.producto === producto.id &&
      (p.tamano || null) === (tamanoId || null)
    );
    if (idx > -1) {
      this.productosSeleccionados[idx].cantidad += 1;
    } else {
      const nuevoProducto: any = {
        producto: producto.id,
        cantidad: 1
      };
      if (tamanoId) {
        nuevoProducto.tamano = tamanoId;
      }
      this.productosSeleccionados.push(nuevoProducto);
    }
    this.menuForm.get('productos')?.setValue(this.productosSeleccionados);
  }

  eliminarProductos(): void {
    this.productosSeleccionados = [];
    this.menuForm.get('productos')?.setValue([]);
  }

  eliminarImagen(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.currentImageUrl = null;
    this.menuForm.get('imagen')?.setValue(null);
    if (!this.isEditMode) {
      this.menuForm.get('imagen')?.markAsTouched();
    }
  }

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
      this.mostrarDialogConfirmacion();
    } else {
      alert('⚠️ Por favor completa todos los campos requeridos');
    }
  }

  private mostrarDialogConfirmacion(): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'menú',
      action: this.isEditMode ? 'update' : 'create'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.procesarFormularioMenu();
      }
    });
  }

  private procesarFormularioMenu(): void {
    this.saving = true;
    const productos = (this.menuForm.get('productos')?.value || []).filter(
      (prod: any) => prod.producto && !isNaN(Number(prod.producto)) && prod.cantidad > 0
    );
    const formData = new FormData();
    formData.append('nombre', this.menuForm.get('nombre')?.value);
    formData.append('descripcion', this.menuForm.get('descripcion')?.value);
    formData.append('precio', this.menuForm.get('precio')?.value);
    formData.append('tipo_menu', this.menuForm.get('tipo_menu')?.value);
    formData.append('estado', this.menuForm.get('estado')?.value);
    productos.forEach((prod: any, i: number) => {
      formData.append(`productos[${i}][producto]`, prod.producto);
      formData.append(`productos[${i}][cantidad]`, prod.cantidad);
      if (prod.tamano) {
        formData.append(`productos[${i}][tamano]`, prod.tamano);
      }
    });
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile, this.selectedFile.name);
    }
    if (this.isEditMode) {
      this.actualizarMenu(formData);
    } else {
      this.crearMenu(formData);
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
    const precioValido = /^\d+(\.\d{1,2})?$/.test(precio) && parseFloat(precio) >= 0.01;
    return camposCompletos && precioValido;
  }

  private crearMenu(formData: FormData): void {
    this.catalogoService.crearMenu(formData).subscribe({
      next: (response) => {
        this.mostrarDialogExito(
          'CREADO',
          '¡El Menu ha sido creado exitosamente!',
          'Continuar'
        );
      },
      error: (error) => {
        alert('❌ Error al crear el menu. Revisa los datos e intenta nuevamente.');
        this.saving = false;
      }
    });
  }

  private actualizarMenu(formData: FormData): void {
    if (!this.menuId) return;
    this.catalogoService.actualizarMenu(this.menuId, formData).subscribe({
      next: (response) => {
        this.saving = false;
        this.mostrarDialogExito(
          'ACTUALIZADO',
          '¡El Menu ha sido actualizado exitosamente!',
          'Continuar'
        );
        this.router.navigate(['/administrador/gestion-menus/editar-eliminar']);
      },
      error: (error) => {
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
      }
      else {
        this.limpiarFormulario();
      }
    });
  }

  private navegarAListaMenus(): void {
    this.router.navigate(['/administrador/gestion-menus/editar-eliminar']);
  }

  private limpiarFormulario(): void {
    this.menuForm.reset();
    this.imagePreview = null;
    this.selectedFile = null;
    this.currentImageUrl = null;
    this.menuForm.patchValue({
      disponibilidad: '',
      categoria: ''
    });
    this.productosSeleccionados = [];
    this.menuForm.get('productos')?.setValue([]);
  }

  filtrarProductos(): void {
    const texto = this.menuForm.get('busqueda')?.value?.trim().toLowerCase() || '';
    this.productosFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(texto)
    );
  }
}
