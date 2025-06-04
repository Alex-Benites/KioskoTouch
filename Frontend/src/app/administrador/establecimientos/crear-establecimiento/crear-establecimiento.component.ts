import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';

@Component({
  selector: 'app-crear-establecimiento',
  templateUrl: './crear-establecimiento.component.html',
  styleUrls: ['./crear-establecimiento.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    FooterAdminComponent,
    HeaderAdminComponent
  ]
})
export class CrearEstablecimientoComponent {
  form: FormGroup;
  imagenMapaUrl: string | null = null;
  archivoMapa: File | null = null;

  // Para la opción 2 (cascada)
  ciudadesDisponibles: string[] = [];

  private ciudadesPorProvincia: { [key: string]: string[] } = {
    'Guayas': ['Guayaquil', 'Durán', 'Milagro', 'Daule', 'Samborondón'],
    'Pichincha': ['Quito', 'Sangolquí', 'Cayambe', 'Tabacundo'],
    'Manabí': ['Portoviejo', 'Manta', 'Chone', 'Montecristi'],
    'Esmeraldas': ['Esmeraldas', 'Atacames', 'Quinindé'],
    'El Oro': ['Machala', 'Pasaje', 'Santa Rosa', 'Huaquillas'],
    'Los Ríos': ['Babahoyo', 'Quevedo', 'Ventanas'],
    'Azuay': ['Cuenca', 'Gualaceo', 'Paute'],
    'Loja': ['Loja', 'Catamayo', 'Cariamanga'],
    'Tungurahua': ['Ambato', 'Baños', 'Pelileo'],
    'Imbabura': ['Ibarra', 'Otavalo', 'Cotacachi']
  };

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      nombreEstablecimiento: ['', [Validators.required]],
      tipoEstablecimiento: ['', [Validators.required]],

      // Campos de ubicación actualizados - SIN sector y codigoPostal
      provincia: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      direccionEspecifica: ['', [Validators.required]],

      telefonoContacto: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      correoElectronico: ['', [Validators.required, Validators.email]],
      responsableAsignado: ['', [Validators.required]],
      cargoAsignado: ['', [Validators.required]],
      estadoEstablecimiento: ['activo', [Validators.required]]
    });
  }

  // Para la opción 2 (cascada)
  onProvinciaChange(event: any): void {
    const provincia = event.value;
    this.ciudadesDisponibles = this.ciudadesPorProvincia[provincia] || [];

    // Limpiar la selección de ciudad
    this.form.get('ciudad')?.setValue('');

    console.log('Provincia seleccionada:', provincia);
    console.log('Ciudades disponibles:', this.ciudadesDisponibles);
  }

  onMapaSeleccionado(event: any): void {
    const archivo = event.target.files[0];

    if (archivo && archivo.type.startsWith('image/')) {
      this.archivoMapa = archivo;

      // Crear URL para vista previa
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenMapaUrl = e.target.result;
      };
      reader.readAsDataURL(archivo);

      console.log('Archivo de mapa seleccionado:', archivo.name);
    } else {
      alert('Por favor, seleccione un archivo de imagen válido.');
    }
  }

  eliminarMapa(): void {
    this.imagenMapaUrl = null;
    this.archivoMapa = null;
    console.log('Mapa eliminado');
  }

  crearEstablecimiento(): void {
    if (this.form.invalid) {
      this.marcarCamposComoTocados();
      alert('Por favor, complete todos los campos requeridos.');
      return;
    }

    // Crear objeto con los datos del establecimiento - SIN sector y codigoPostal
    const establecimientoData = {
      nombreEstablecimiento: this.form.get('nombreEstablecimiento')?.value,
      tipoEstablecimiento: this.form.get('tipoEstablecimiento')?.value,

      // Ubicación simplificada
      ubicacion: {
        provincia: this.form.get('provincia')?.value,
        ciudad: this.form.get('ciudad')?.value,
        direccionEspecifica: this.form.get('direccionEspecifica')?.value,
        // Crear dirección completa para mostrar
        direccionCompleta: `${this.form.get('direccionEspecifica')?.value}, ${this.form.get('ciudad')?.value}, ${this.form.get('provincia')?.value}`
      },

      telefonoContacto: this.form.get('telefonoContacto')?.value,
      correoElectronico: this.form.get('correoElectronico')?.value,
      responsableAsignado: this.form.get('responsableAsignado')?.value,
      cargoAsignado: this.form.get('cargoAsignado')?.value,
      estadoEstablecimiento: this.form.get('estadoEstablecimiento')?.value,
      archivoMapa: this.archivoMapa
    };

    console.log('Establecimiento creado:', establecimientoData);
    alert('Establecimiento creado exitosamente!');
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  // Métodos para obtener errores de validación (opcional)
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);

    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (control?.hasError('email')) {
      return 'Ingrese un email válido';
    }

    if (control?.hasError('pattern') && fieldName === 'telefonoContacto') {
      return 'El teléfono debe tener 10 dígitos';
    }

    return '';
  }
}
