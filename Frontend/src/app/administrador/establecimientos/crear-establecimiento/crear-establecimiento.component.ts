import { Component, OnInit } from '@angular/core';
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
import { EmpleadosService, EmpleadoDropdown } from '../../../services/empleados.service';

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
export class CrearEstablecimientoComponent implements OnInit {
  form: FormGroup;
  imagenMapaUrl: string | null = null;
  archivoMapa: File | null = null;

  // Para la cascada provincia → ciudad
  ciudadesDisponibles: string[] = [];

  // 🆕 Lista de empleados desde la base de datos
  empleadosDisponibles: EmpleadoDropdown[] = [];
  loadingEmpleados: boolean = false;

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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private empleadosService: EmpleadosService // 🆕 Inyectar servicio
  ) {
    this.form = this.fb.group({
      nombreEstablecimiento: ['', [Validators.required]],
      tipoEstablecimiento: ['', [Validators.required]],
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

  ngOnInit(): void {
    this.cargarEmpleados(); // 🆕 Cargar empleados al inicializar
  }

  // 🆕 Cargar empleados desde la base de datos
  cargarEmpleados(): void {
    this.loadingEmpleados = true;

    this.empleadosService.getEmpleadosParaDropdown().subscribe({
      next: (response) => {
        this.empleadosDisponibles = response.empleados;
        this.loadingEmpleados = false;
        console.log('✅ Empleados cargados:', this.empleadosDisponibles);
      },
      error: (error) => {
        console.error('❌ Error cargando empleados:', error);
        this.loadingEmpleados = false;
        alert('Error al cargar los empleados. Por favor, recarga la página.');
      }
    });
  }

  // Método para cuando se selecciona una provincia
  onProvinciaChange(event: any): void {
    const provincia = event.value;
    this.ciudadesDisponibles = this.ciudadesPorProvincia[provincia] || [];

    // Limpiar la selección de ciudad
    this.form.get('ciudad')?.setValue('');

    console.log('Provincia seleccionada:', provincia);
    console.log('Ciudades disponibles:', this.ciudadesDisponibles);
  }

  // 🆕 Método actualizado para cuando se selecciona un responsable
  onResponsableChange(event: any): void {
    const empleadoId = event.value;
    const empleadoSeleccionado = this.empleadosDisponibles.find(emp => emp.id === empleadoId);

    if (empleadoSeleccionado) {
      // Automáticamente llenar el campo cargo
      this.form.get('cargoAsignado')?.setValue(empleadoSeleccionado.cargo);

      console.log('✅ Responsable seleccionado:', empleadoSeleccionado);
    }
  }

  // Método para seleccionar archivo de mapa
  onMapaSeleccionado(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoMapa = file;

      // Crear URL para vista previa
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenMapaUrl = e.target.result;
      };
      reader.readAsDataURL(file);

      console.log('Archivo de mapa seleccionado:', file.name);
    }
  }

  // Método para eliminar el mapa
  eliminarMapa(): void {
    this.imagenMapaUrl = null;
    this.archivoMapa = null;

    // Limpiar el input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    console.log('Mapa eliminado');
  }

  crearEstablecimiento(): void {
    if (this.form.invalid) {
      this.marcarCamposComoTocados();
      alert('Por favor, complete todos los campos requeridos.');
      return;
    }

    // 🆕 Obtener el empleado seleccionado con toda su información
    const empleadoSeleccionado = this.empleadosDisponibles.find(
      emp => emp.id === this.form.get('responsableAsignado')?.value
    );

    const establecimientoData = {
      nombreEstablecimiento: this.form.get('nombreEstablecimiento')?.value,
      tipoEstablecimiento: this.form.get('tipoEstablecimiento')?.value,

      ubicacion: {
        provincia: this.form.get('provincia')?.value,
        ciudad: this.form.get('ciudad')?.value,
        direccionEspecifica: this.form.get('direccionEspecifica')?.value,
        direccionCompleta: `${this.form.get('direccionEspecifica')?.value}, ${this.form.get('ciudad')?.value}, ${this.form.get('provincia')?.value}`
      },

      telefonoContacto: this.form.get('telefonoContacto')?.value,
      correoElectronico: this.form.get('correoElectronico')?.value,

      // 🆕 Información completa del responsable desde la BD
      responsable: {
        empleado_id: empleadoSeleccionado?.id,
        user_id: empleadoSeleccionado?.user_id,
        nombre_completo: empleadoSeleccionado?.nombre_completo,
        nombres: empleadoSeleccionado?.nombres,
        apellidos: empleadoSeleccionado?.apellidos,
        cargo: empleadoSeleccionado?.cargo,
        cedula: empleadoSeleccionado?.cedula,
        telefono: empleadoSeleccionado?.telefono,
        email: empleadoSeleccionado?.email
      },

      estadoEstablecimiento: this.form.get('estadoEstablecimiento')?.value,
      archivoMapa: this.archivoMapa
    };

    console.log('🏢 Establecimiento creado con empleado de BD:', establecimientoData);
    alert('Establecimiento creado exitosamente con responsable de la base de datos!');
  }

  // Método auxiliar para marcar campos como tocados
  private marcarCamposComoTocados(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Método opcional para limpiar el formulario
  private limpiarFormulario(): void {
    this.form.reset();
    this.imagenMapaUrl = null;
    this.archivoMapa = null;
    this.ciudadesDisponibles = [];

    // Establecer valores por defecto
    this.form.patchValue({
      estadoEstablecimiento: 'activo'
    });
  }

  // Método para cancelar (opcional)
  cancelar(): void {
    if (confirm('¿Está seguro de que desea cancelar? Se perderán todos los datos ingresados.')) {
      this.router.navigate(['/administrador/establecimientos']);
    }
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
