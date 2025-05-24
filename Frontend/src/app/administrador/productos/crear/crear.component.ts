import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
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
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, HeaderAdminComponent, FooterAdminComponent
  ],
  templateUrl: './crear.component.html',
  styleUrls: ['./crear.component.scss']
})
export class CrearComponent implements OnInit {
  productoForm: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  imagenSeleccionada: File | null = null;

  // Inicializa con arrays vacíos, se poblarán con datos quemados
  categorias: Categoria[] = [];
  estados: Estado[] = [];

  constructor(
    private fb: FormBuilder,
    private catalogoService: CatalogoService, // Lo mantenemos por si quieres usarlo para crearProducto
    private router: Router
  ) {
    this.productoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      categoria: ['', Validators.required], // El validador se mantendrá, pero el select tendrá opciones
      precio: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      disponibilidad: ['', Validators.required] // El validador se mantendrá
    });
  }

  ngOnInit(): void {
    this.cargarDatosQuemadosParaSelects();
  }

  cargarDatosQuemadosParaSelects(): void {
    // Datos quemados para categorías
    this.categorias = [
      { id: 2, nombre: 'Hamburguesas (Prueba)' },
      { id: 3, nombre: 'Bebidas (Prueba)' },
      { id: 4, nombre: 'Postres (Prueba)' },
      { id: 5, nombre: 'Pizzas (Prueba)' } // Añade más si necesitas
    ];
    console.log('Categorías quemadas cargadas:', this.categorias);

    // Datos quemados para estados (disponibilidad)
    this.estados = [
      { id: 4, nombre: 'Disponible (Prueba)' },
      { id: 5, nombre: 'No Disponible (Prueba)' },
      { id: 6, nombre: 'Pocas Unidades (Prueba)' } // Añade más si necesitas
    ];
    console.log('Estados quemados cargados:', this.estados);

    // Opcional: Si quieres preseleccionar un valor por defecto en el formulario
    // this.productoForm.patchValue({
    //   categoria: this.categorias.length > 0 ? this.categorias[0].id : '',
    //   disponibilidad: this.estados.length > 0 ? this.estados[0].id : ''
    // });
  }

  // Comentamos las llamadas al servicio ya que los endpoints no existen
  // cargarCategorias(): void {
  //   this.catalogoService.getCategorias().subscribe({
  //     next: (data) => this.categorias = data,
  //     error: (err) => console.error('Error al cargar categorías:', err)
  //   });
  // }

  // cargarEstados(): void {
  //   this.catalogoService.getEstados().subscribe({
  //     next: (data) => this.estados = data,
  //     error: (err) => console.error('Error al cargar estados:', err)
  //   });
  // }

  /* onFileSelected(event: Event): void { 
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(this.selectedFile);
    }
  } */

  eliminarImagen(): void {
    this.imagePreview = null; this.selectedFile = null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.imagenSeleccionada = input.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(this.imagenSeleccionada);
  }
}

  /*onSubmit(): void {
    if (this.productoForm.valid) {
      const formValue = this.productoForm.value;
      // Ahora formValue.categoria y formValue.disponibilidad deberían tener los IDs
      // seleccionados de los datos quemados.
      const formData = new FormData();
        formData.append('nombre', formValue.nombre);
        formData.append('descripcion', formValue.descripcion);
        formData.append('precio', formValue.precio.toString());
        formData.append('categoria', formValue.categoria);
        formData.append('estado', formValue.disponibilidad);

        if (this.imagenSeleccionada) {
          formData.append('imagenProductoUrl', this.imagenSeleccionada);
        }


      console.log('Enviando datos del producto:', formData);

      this.catalogoService.crearProducto(formData).subscribe({
        next: (response) => {
          console.log('Producto creado exitosamente:', response);
          alert('Producto creado exitosamente!');
          this.router.navigate(['/administrador/gestion-productos']);
        },
        error: (error) => {
          console.error('Error al crear el producto:', error);
          let errorMessage = 'Ocurrió un error al crear el producto.';
          if (error.error && typeof error.error === 'object') {
            errorMessage += '\nDetalles:\n';
            for (const key in error.error) {
              if (error.error.hasOwnProperty(key)) {
                errorMessage += `${key}: ${error.error[key].join ? error.error[key].join(', ') : error.error[key]}\n`;
              }
            }
          }
          alert(errorMessage);
        }
      });
    } else {
      console.log('Formulario no válido');
      this.productoForm.markAllAsTouched();
    }
  }*/

  onSubmit(): void {
  if (this.productoForm.valid) {
    const formValue = this.productoForm.value;

    const formData = new FormData();
    formData.append('nombre', formValue.nombre);
    formData.append('descripcion', formValue.descripcion);
    formData.append('precio', formValue.precio.toString());
    formData.append('categoria', formValue.categoria); // ID de la categoría
    formData.append('estado', formValue.disponibilidad); // ID del estado

    if (this.imagenSeleccionada) {
      formData.append('imagen', this.imagenSeleccionada); // ✅ nombre correcto del campo
    }

    // Opcional: revisar qué se está enviando
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    this.catalogoService.crearProducto(formData).subscribe({
      next: (response) => {
        console.log('Producto creado exitosamente:', response);
        alert('Producto creado exitosamente!');
        this.router.navigate(['/administrador/gestion-productos']);
      },
      error: (error) => {
        console.error('Error al crear el producto:', error);
        let errorMessage = 'Ocurrió un error al crear el producto.';
        if (error.error && typeof error.error === 'object') {
          errorMessage += '\nDetalles:\n';
          for (const key in error.error) {
            if (error.error.hasOwnProperty(key)) {
              errorMessage += `${key}: ${error.error[key].join ? error.error[key].join(', ') : error.error[key]}\n`;
            }
          }
        }
        alert(errorMessage);
      }
    });
    } else {
      console.log('Formulario no válido');
      this.productoForm.markAllAsTouched();
    }
  }

}