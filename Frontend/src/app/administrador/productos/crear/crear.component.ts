import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select'; 
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';

@Component({
  selector: 'app-crear',
  imports: [
    ReactiveFormsModule, 
    CommonModule,
    HeaderAdminComponent,
    FooterAdminComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './crear.component.html',
  styleUrls: ['./crear.component.scss'], 
})
export class CrearComponent implements OnInit {

  productoForm!: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  categorias = [
    { value: 'categoria-1', viewValue: 'Categoría 1' },
    { value: 'categoria-2', viewValue: 'Categoría 2' },
    { value: 'categoria-3', viewValue: 'Categoría 3' },
  ];
  disponibilidades = [
    { value: true, viewValue: 'Disponible' },
    { value: false, viewValue: 'No Disponible' },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.productoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      categoria: ['', Validators.required],
      precio: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      disponibilidad: [true, Validators.required],
      imagen: [null] 
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList[0]) {
      this.selectedFile = fileList[0];
      this.productoForm.patchValue({ imagen: this.selectedFile });

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  eliminarImagen(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.productoForm.patchValue({ imagen: null });
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    if (this.productoForm.valid) {
      console.log('Formulario Enviado:', this.productoForm.value);
      // Enviar al backend...
    } else {
      console.log('Formulario no válido');
      this.productoForm.markAllAsTouched();
    }
  }
}