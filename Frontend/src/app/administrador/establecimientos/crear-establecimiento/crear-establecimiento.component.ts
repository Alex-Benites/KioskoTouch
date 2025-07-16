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
import { CatalogoService } from '../../../services/catalogo.service';
import { ActivatedRoute } from '@angular/router';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { MatDialog } from '@angular/material/dialog';
import { SuccessDialogComponent } from '../../../shared/success-dialog/success-dialog.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

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
  estados: { id: number, nombre: string }[] = [];

  // Para la cascada provincia → ciudad
  ciudadesDisponibles: string[] = [];

  // Lista de empleados desde la base de datos
  empleadosDisponibles: EmpleadoDropdown[] = [];
  loadingEmpleados: boolean = false;

  // 🖼️ VARIABLES PARA MANEJO DE IMAGEN SIMPLIFICADO
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  imagenActual: string | null = null; // Para mostrar imagen existente en modo edición

  // Variables de control
  establecimientoId: number | null = null;
  isEditMode = false;

  // ← AGREGAR esta propiedad
  mostrarCampoImagen: boolean = false; // ← AGREGAR esta propiedad

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
    private route: ActivatedRoute,
    private empleadosService: EmpleadosService,
    private establecimientosService: EstablecimientosService,
    private catalogoService: CatalogoService,
    private dialog: MatDialog,
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
      // 🗑️ ELIMINAR: imagen: [''] - Ya no necesitamos control de form para imagen
    });
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit - Iniciando componente');

    this.cargarEmpleados();
    this.cargarEstados();

    // Detectar modo edición
    this.establecimientoId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.establecimientoId && !isNaN(this.establecimientoId);

    console.log('🔍 Modo edición:', this.isEditMode);
    console.log('🔍 ID del establecimiento:', this.establecimientoId);

    if (this.isEditMode) {
      this.cargarEstablecimientoParaEditar();
    }
  }

  abrirDialogoExito(titulo: string, mensaje: string, callback?: () => void) {
    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      data: {
        title: titulo,
        message: mensaje,
        buttonText: 'Continuar'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      if (callback) callback();
    });
  }

  // ✅ MÉTODO SIMPLIFICADO - Solo cargar datos del establecimiento
  cargarEstablecimientoParaEditar(): void {
    if (!this.establecimientoId) return;

    console.log('🔄 Cargando establecimiento para editar, ID:', this.establecimientoId);

    this.establecimientosService.obtenerEstablecimientoPorId(this.establecimientoId).subscribe({
      next: (establecimiento) => {
        console.log('📋 Establecimiento cargado:', establecimiento);
        console.log('🖼️ Imagen URL:', establecimiento.imagen_url);

        // ✅ MOSTRAR IMAGEN ACTUAL SI EXISTE
        if (establecimiento.imagen_url) {
          this.imagenActual = establecimiento.imagen_url;
          console.log('🖼️ Imagen actual configurada:', this.imagenActual);
        }

        // Cargar datos del formulario
        this.form.patchValue({
          nombreEstablecimiento: establecimiento.nombre,
          tipoEstablecimiento: establecimiento.tipo_establecimiento,
          provincia: establecimiento.provincia,
          direccionEspecifica: establecimiento.direccion,
          telefonoContacto: establecimiento.telefono,
          correoElectronico: establecimiento.correo,
          estadoEstablecimiento: establecimiento.estado_id
        });

        // Actualizar ciudades disponibles y seleccionar ciudad
        this.ciudadesDisponibles = this.ciudadesPorProvincia[establecimiento.provincia] || [];
        this.form.patchValue({
          ciudad: establecimiento.ciudad
        });

        // Buscar el responsable y asignar cargo
        const responsable = this.empleadosDisponibles.find(e => e.id === establecimiento.responsable_id);
        this.form.patchValue({
          responsableAsignado: establecimiento.responsable_id,
          cargoAsignado: responsable ? responsable.cargo : ''
        });

        console.log('📋 Form values después de cargar:', this.form.value);
      },
      error: (error) => {
        console.error('❌ Error cargando establecimiento:', error);
        alert('Error al cargar el establecimiento');
        this.router.navigate(['/administrador/gestion-establecimientos']);
      }
    });
  }

  cargarEstados(): void {
    this.catalogoService.getEstados().subscribe({
      next: (estados) => {
        this.estados = estados;
      },
      error: (error) => {
        console.error('❌ Error cargando estados:', error);
        alert('Error al cargar los estados. Por favor, recarga la página.');
      }
    });
  }

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

  // ✅ MÉTODO PARA SELECCIONAR ARCHIVO DE IMAGEN
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        alert('Solo se permiten archivos de imagen (JPG, PNG, WEBP)');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no puede superar los 5MB');
        return;
      }

      console.log('📁 Archivo seleccionado:', file.name);
      this.selectedFile = file;

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        console.log('🖼️ Preview creado');
      };
      reader.readAsDataURL(file);
    }
  }

  // ✅ MÉTODO PARA LIMPIAR ARCHIVO SELECCIONADO
  clearFile(): void {
    this.selectedFile = null;
    this.imagePreview = '';
    this.mostrarCampoImagen = false; // ← AGREGAR esta línea
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

  // Método para cuando se selecciona un responsable
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

    // Limpiar el input file del mapa
    const fileInput = document.querySelector('input[type="file"][accept=".jpg,.jpeg,.png,.pdf"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    console.log('Mapa eliminado');
  }

  // ✅ MÉTODO PRINCIPAL SIMPLIFICADO
  crearEstablecimiento(): void {
    if (this.form.invalid) {
      this.marcarCamposComoTocados();
      this.abrirDialogoExito('Campos incompletos', 'Por favor, complete todos los campos requeridos.');
      return;
    }

    // Imagen obligatoria SIEMPRE: debe haber una imagen seleccionada o una imagen actual
    if (!this.selectedFile && !this.imagenActual) {
      this.abrirDialogoExito('Imagen requerida', 'Debe seleccionar una imagen para el establecimiento.');
      return;
    }

    this.mostrarDialogConfirmacion();
  }

  private mostrarDialogConfirmacion(): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'establecimiento',
      action: this.isEditMode ? 'update' : 'create'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        // Usuario confirmó, proceder con la operación
        this.procesarFormulario();
      }
      // Si no confirmó, no hacer nada (el diálogo se cierra automáticamente)
    });
  }

  private procesarFormulario(): void {
    const empleadoSeleccionado = this.empleadosDisponibles.find(
      emp => emp.id === this.form.get('responsableAsignado')?.value
    );

    console.log('🖼️ Archivo seleccionado:', this.selectedFile?.name || 'Ninguno');
    console.log('🔄 Procesando establecimiento...');

    // ✅ SIEMPRE USAR FormData (más simple y consistente)
    const formData = new FormData();

    // Agregar datos del formulario
    const formValue = this.form.value;
    formData.append('nombre', formValue.nombreEstablecimiento);
    formData.append('tipo_establecimiento', formValue.tipoEstablecimiento);
    formData.append('provincia', formValue.provincia);
    formData.append('ciudad', formValue.ciudad);
    formData.append('direccion', formValue.direccionEspecifica);
    formData.append('telefono', formValue.telefonoContacto);
    formData.append('correo', formValue.correoElectronico);
    formData.append('responsable_id', String(empleadoSeleccionado!.id));
    formData.append('estado_id', String(formValue.estadoEstablecimiento));

    // ✅ AGREGAR IMAGEN SOLO SI SE SELECCIONÓ UNA NUEVA
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile, this.selectedFile.name);
      console.log('🖼️ Imagen agregada al FormData:', this.selectedFile.name);
    } else {
      console.log('📝 Sin imagen nueva seleccionada');
    }

    // ✅ AGREGAR MAPA SI EXISTE
    if (this.archivoMapa) {
      formData.append('mapa', this.archivoMapa, this.archivoMapa.name);
      console.log('🗺️ Mapa agregado al FormData:', this.archivoMapa.name);
    }

    console.log('📤 Enviando FormData...');

    // Enviar petición
    if (this.isEditMode && this.establecimientoId) {
      // Actualizar establecimiento
      this.establecimientosService.actualizarEstablecimiento(this.establecimientoId, formData).subscribe({
        next: (response) => {
          console.log('✅ Establecimiento actualizado:', response);
          this.abrirDialogoExito(
            '¡Éxito!',
            'Establecimiento actualizado correctamente',
            () => this.router.navigate(['/administrador/gestion-establecimientos'])
          );
        },
        error: (error) => {
          console.error('❌ Error al actualizar establecimiento:', error);
          alert('Error al actualizar el establecimiento: ' + (error.error?.error || error.message));
        }
      });
    } else {
      // Crear nuevo establecimiento
      this.establecimientosService.crearEstablecimiento(formData).subscribe({
        next: (response) => {
          console.log('✅ Establecimiento creado:', response);
              this.abrirDialogoExito(
              '¡Éxito!',
              'Establecimiento creado correctamente',
              () => this.router.navigate(['/administrador/gestion-establecimientos'])
            );
        },
        error: (error) => {
          console.error('❌ Error al crear establecimiento:', error);
          alert('Error al crear el establecimiento: ' + (error.error?.error || error.message));
        }
      });
    }
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

  // Método para cancelar
  cancelar(): void {
    if (confirm('¿Está seguro de que desea cancelar? Se perderán todos los datos ingresados.')) {
      this.router.navigate(['/administrador/gestion-establecimientos']);
    }
  }

  // Método para obtener errores de validación
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