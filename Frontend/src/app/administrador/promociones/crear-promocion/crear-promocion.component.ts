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
import { Producto, Estado, Categoria } from '../../../models/catalogo.model';
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
  productosSeleccionados: Producto [] = [];
  categorias: Categoria[] = [];
  search: string = '';
  estados: any[] = [];
  constructor(
    private fb: FormBuilder,
    private catalogoService: CatalogoService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.promocionForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      tipo: ['', Validators.required],
      descuento: ['', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0.01)
      ]],
      codigo: ['', Validators.required],
      limiteTotal: ['', Validators.required],
      limiteUsuario: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      disponibilidad: ['', Validators.required],
      imagen: [null, Validators.required],
      productosSeleccionados: ['']
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
      this.loadProductImages(); // Solo para productos
    });
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
  get precioError(): string {
    const control = this.promocionForm.get('precio');
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
  if (this.promocionForm.valid) {
    const formValue = this.promocionForm.value;

    const formData = new FormData();
    formData.append('nombre', formValue.nombre);
    formData.append('descripcion', formValue.descripcion);
    formData.append('descuento', formValue.descuento.toString());
    formData.append('tipo', formValue.tipo);
    formData.append('codigo', formValue.codigo);
    formData.append('limiteTotal', formValue.limiteTotal.toString());
    formData.append('limiteUsuario', formValue.limiteUsuario.toString());
    formData.append('fechaInicio', formValue.fechaInicio.toString());
    formData.append('fechaFin', formValue.fechaFin.toString());
    formData.append('disponibilidad', formValue.disponibilidad);
    formData.append('productos', this.promocionForm.get('productosSeleccionados')?.value);

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile, this.selectedFile.name);
    }

    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
  } else {
    console.log('Formulario no válido');
    this.promocionForm.markAllAsTouched();
  }
}
  agregarProducto(producto: Producto): void {
    // Verificar si el producto ya está en la lista
    if (this.productosSeleccionados.some(p => p.id === producto.id)) {
      alert('El producto ya fue ingresado');
      return;
    }

    // Agregar el producto seleccionado al array
    this.productosSeleccionados.push(producto);

    // Contar cuántas veces aparece cada producto por su id
    const contador: { [id: number]: { producto: Producto, cantidad: number } } = {};

    this.productosSeleccionados.forEach((prod: Producto) => {
      if (prod.id in contador) {
        contador[prod.id].cantidad += 1;
      } else {
        contador[prod.id] = { producto: prod, cantidad: 1 };
      }
    });

    // Construir el string con nombre(cantidad) solo si cantidad > 1
    const seleccionados = Object.values(contador)
      .map(({ producto, cantidad }) =>
        cantidad > 1 ? `${producto.nombre}(${cantidad})` : producto.nombre
      )
      .join(', ');

    this.promocionForm.get('productosSeleccionados')?.setValue(seleccionados);
  }
  eliminarProductos(): void {
    this.productosSeleccionados = [];
    this.promocionForm.get('productosSeleccionados')?.setValue('');
  }
}
