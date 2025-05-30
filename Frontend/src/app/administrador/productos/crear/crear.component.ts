import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormArray } from '@angular/forms'; // Agregar FormArray
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox'; // Agregar para mat-checkbox
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
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatSelectModule, 
    MatButtonModule, 
    MatCheckboxModule, // Agregar MatCheckboxModule
    HeaderAdminComponent, 
    FooterAdminComponent
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

  constructor(
    private fb: FormBuilder,
    private catalogoService: CatalogoService,
    private router: Router
  ) {
    this.productoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      categoria: ['', Validators.required],
      precio: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      disponibilidad: ['', Validators.required],
      imagen: [null],
      ingredientesSeleccionados: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.catalogoService.getCategorias().subscribe(data => {
      this.categorias = data;
    });

    this.catalogoService.getEstados().subscribe(data => {
      this.estados = data;
    });
  }

  onCategoriaSeleccionada(event: MatSelectChange): void {
    const categoriaId = event.value;
    const categoria = this.categorias.find(cat => cat.id === categoriaId);

    if (categoria) {
      this.cargarIngredientesPorCategoria(categoria.nombre);
    } else {
      this.ingredientes = [];
    }
  }

  getFullImageUrl(imagenUrl: string | undefined): string {
    return this.catalogoService.getFullImageUrl(imagenUrl);
  }

  cargarIngredientesPorCategoria(categoriaNombre: string): void {
    const categoriaMap: { [key: string]: string } = {
      'Hamburguesa': 'hamburguesas',
      'Pizza': 'pizzas',
      'Ensalada': 'ensaladas',
      'Pollo': 'pollo',
      'Postre': 'postres',
      'Bebida': 'bebidas'
    };

    const categoriaBackend = categoriaMap[categoriaNombre] || 'general';

    this.catalogoService.getIngredientesPorCategoria(categoriaBackend)
      .subscribe(ingredientes => {
        this.ingredientes = ingredientes;
        this.ingredientesSeleccionadosFormArray.clear();
        this.ingredientes.forEach(() => this.ingredientesSeleccionadosFormArray.push(new FormControl(false)));
        console.log('Ingredientes para', categoriaNombre, ':', ingredientes);
      });
  }

  get ingredientesSeleccionadosFormArray(): FormArray {
    return this.productoForm.get('ingredientesSeleccionados') as FormArray;
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      }
      reader.readAsDataURL(this.selectedFile)
    }
  }

  eliminarImagen(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.productoForm.get('imagen')?.setValue(null);
  }

  onSubmit(): void {
    if (this.productoForm.valid) {
      const formData = new FormData();
      formData.append('nombre', this.productoForm.get('nombre')?.value);
      formData.append('descripcion', this.productoForm.get('descripcion')?.value);
      formData.append('categoria', this.productoForm.get('categoria')?.value);
      formData.append('precio', this.productoForm.get('precio')?.value);
      formData.append('estado', this.productoForm.get('disponibilidad')?.value);

      if (this.selectedFile) {
        formData.append('imagen', this.selectedFile, this.selectedFile.name);
      }

      // Corregir tipos explícitos
      const ingredientesSeleccionados = this.ingredientesSeleccionadosFormArray.value
        .map((seleccionado: boolean, index: number) => seleccionado ? this.ingredientes[index].id : null)
        .filter((val: any) => val !== null);

      formData.append('ingredientes', JSON.stringify(ingredientesSeleccionados));

      this.catalogoService.crearProducto(formData).subscribe({
        next: (response) => {
          console.log('Producto creado exitosamente', response);
          this.router.navigate(['/administrador/gestion-productos']);
        },
        error: (error) => {
          console.error('Error al crear el producto', error);
        }
      });
    }
  }
}