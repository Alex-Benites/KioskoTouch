import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

// Angular Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Shared components
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../../shared/success-dialog/success-dialog.component';

// Services
import { UsuariosService } from '../../../services/usuarios.service';
import { RolesService } from '../../../services/roles.service';

import { EstablecimientosService } from '../../../services/establecimientos.service';

// Models
import { GruposResponse, Grupo } from '../../../models/roles.model';
import { Establecimiento } from '../../../models/establecimiento.model';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    HeaderAdminComponent,
    FooterAdminComponent,
  ],
  templateUrl: './crear-usuario.component.html',
  styleUrls: ['./crear-usuario.component.scss']
})
export class CrearUsuarioComponent implements OnInit {
  
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private usuariosService = inject(UsuariosService);
  private rolesService = inject(RolesService);
  private establecimientosService = inject(EstablecimientosService);

  usuarioForm!: FormGroup;
  isEditMode = false;
  userId: number | null = null;
  saving = false;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  // Datos para los selects
  establecimientos: Establecimiento[] = [];

  rolesDisponibles: Grupo[] = [];

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Verificar si estamos en modo edición
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.userId && !isNaN(this.userId);

    if (this.isEditMode) {
      this.cargarUsuarioParaEditar();
    }

    // Cargar datos necesarios
    this.cargarRoles();
    this.cargarEstablecimientos();
  }

  private initializeForm(): void {
    this.usuarioForm = this.fb.group({
      // Información personal
      cedula: ['', [Validators.required, Validators.pattern(/^\d{10}$/), this.cedulaEcuatorianaValidator()]],
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(100)]],
      fechaNacimiento: [''],
      telefono: ['', [Validators.pattern(/^\d{10}$/)]],
      sexo: [''],

      // Credenciales
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', this.isEditMode ? [] : [Validators.required]],

      // Información laboral
      establecimiento: [null],
      turnoTrabajo: [''],
      grupos: [null, [Validators.required]], 
      isActive: [true]
    }, {
      validators: this.isEditMode ? [] : [this.passwordMatchValidator()]
    });
  }

  private cargarUsuarioParaEditar(): void {
    if (!this.userId) return;

    this.loading = true;
    this.usuariosService.obtenerEmpleado(this.userId).subscribe({
      next: (response) => {
        console.log('✅ Datos recibidos del backend:', response);
        const empleado = response.empleado;
        
        // ✅ DETERMINAR EL ESTABLECIMIENTO A MOSTRAR
        let establecimientoSeleccionado = null;
        let mensajeEstablecimiento = '';

        if (empleado.establecimiento_actual) {
          establecimientoSeleccionado = empleado.establecimiento_actual.id;
          mensajeEstablecimiento = `Establecimiento actual: ${empleado.establecimiento_actual.nombre}`;
          console.log('✅ Empleado tiene establecimiento:', empleado.establecimiento_actual);
        } else {
          mensajeEstablecimiento = 'Este empleado no tiene establecimiento asignado';
          console.log('⚠️ Empleado sin establecimiento asignado');
        }

        this.usuarioForm.patchValue({
          cedula: empleado.cedula,
          nombres: empleado.nombres,
          apellidos: empleado.apellidos,
          fechaNacimiento: empleado.fecha_nacimiento ? this.parseBackendDate(empleado.fecha_nacimiento) : null,
          telefono: empleado.telefono,
          sexo: empleado.sexo,
          username: empleado.username,
          email: empleado.email,
          turnoTrabajo: empleado.turno_trabajo,
          grupos: empleado.roles.length > 0 ? empleado.roles[0].id : null,
          isActive: empleado.is_active,
          establecimiento: establecimientoSeleccionado
        });

        // ✅ DESHABILITAR USERNAME EN MODO EDICIÓN
        this.usuarioForm.get('username')?.disable();

        // Remover validaciones de contraseña en modo edición
        this.usuarioForm.get('password')?.clearValidators();
        this.usuarioForm.get('confirmPassword')?.clearValidators();
        this.usuarioForm.get('password')?.updateValueAndValidity();
        this.usuarioForm.get('confirmPassword')?.updateValueAndValidity();

        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        this.mostrarError('Error al cargar los datos del usuario');
        this.loading = false;
        this.navegarAListaUsuarios();
      }
    });
  }

  private cargarRoles(): void {
    this.rolesService.getRoles().subscribe({
      next: (response: GruposResponse) => {
        this.rolesDisponibles = response.grupos;
        console.log('✅ Roles cargados:', this.rolesDisponibles);
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        this.mostrarError('Error al cargar los roles disponibles');
      }
    });
  }

  private cargarEstablecimientos(): void {
    this.establecimientosService.obtenerEstablecimientos().subscribe({
      next: (establecimientos: Establecimiento[]) => {
        this.establecimientos = establecimientos;
        console.log('✅ Establecimientos cargados:', this.establecimientos);
      },
      error: (error) => {
        console.error('Error al cargar establecimientos:', error);
        this.mostrarError('Error al cargar los establecimientos disponibles');
      }
    });
  }

  // Validador personalizado para cédula ecuatoriana
  private cedulaEcuatorianaValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const cedula = control.value;
      if (!cedula) return null;

      if (!/^\d{10}$/.test(cedula)) {
        return { cedulaInvalida: true };
      }

      const digits = cedula.split('').map(Number);
      const province = parseInt(cedula.substring(0, 2));

      if (province < 1 || province > 24) {
        return { cedulaInvalida: true };
      }

      const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
      let sum = 0;

      for (let i = 0; i < 9; i++) {
        let result = digits[i] * coefficients[i];
        if (result > 9) result -= 9;
        sum += result;
      }

      const verifierDigit = sum % 10 === 0 ? 0 : 10 - (sum % 10);
      
      return verifierDigit === digits[9] ? null : { cedulaInvalida: true };
    };
  }

  // ✅ MEJORAR VALIDADOR DE CONTRASEÑAS
  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password');
      const confirmPassword = control.get('confirmPassword');

      if (!password || !confirmPassword) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        // ✅ ESTABLECER ERROR EN confirmPassword
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        // ✅ LIMPIAR ERROR SI LAS CONTRASEÑAS COINCIDEN
        const errors = confirmPassword.errors;
        if (errors) {
          delete errors['passwordMismatch'];
          confirmPassword.setErrors(Object.keys(errors).length === 0 ? null : errors);
        }
      }

      return null;
    };
  }

  onSubmit(): void {
    if (this.usuarioForm.invalid) {
      this.mostrarError('Por favor completa todos los campos requeridos correctamente');
      this.usuarioForm.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.actualizarUsuario();
    } else {
      this.crearUsuario();
    }
  }

  private crearUsuario(): void {
    const formData = { ...this.usuarioForm.value };
    
    if (formData.fechaNacimiento) {
      formData.fechaNacimiento = this.formatDateForBackend(new Date(formData.fechaNacimiento));
    }
    
    if (formData.grupos) {
      formData.grupos = [formData.grupos];
    }
    
    delete formData.confirmPassword;

    console.log('🎯 Datos a enviar para crear usuario:', formData);

    this.usuariosService.crearUsuario(formData).subscribe({
      next: (response) => {
        console.log('✅ Usuario creado:', response);
        this.saving = false;
        
        this.mostrarDialogExito(
          'REGISTRO',
          '¡El usuario se ha creado exitosamente!',
          'Continuar'
        );
      },
      error: (error) => {
        console.error('❌ Error al crear usuario:', error);
        const mensaje = error.error?.error || 'Error al crear el usuario';
        this.mostrarError(mensaje);
        this.saving = false;
      }
    });
  }

  private actualizarUsuario(): void {
    const formData = { ...this.usuarioForm.value };
    
    // ✅ INCLUIR USERNAME AUNQUE ESTÉ DISABLED
    if (this.usuarioForm.get('username')?.disabled) {
      formData.username = this.usuarioForm.get('username')?.value;
    }
    
    if (formData.fechaNacimiento) {
      formData.fechaNacimiento = this.formatDateForBackend(new Date(formData.fechaNacimiento));
    }
    
    if (formData.grupos) {
      formData.grupos = [formData.grupos];
    }
    
    delete formData.confirmPassword;
    if (!formData.password) {
      delete formData.password;
    }

    console.log('🎯 Datos a enviar para actualizar usuario:', formData);

    this.usuariosService.actualizarEmpleado(this.userId!, formData).subscribe({
      next: (response) => {
        console.log('✅ Usuario actualizado:', response);
        this.saving = false;
        
        this.mostrarDialogExito(
          'ACTUALIZACIÓN',
          '¡El usuario se ha actualizado exitosamente!',
          'Continuar'
        );
      },
      error: (error) => {
        console.error('❌ Error al actualizar usuario:', error);
        const mensaje = error.error?.error || 'Error al actualizar el usuario';
        this.mostrarError(mensaje);
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
      this.navegarAListaUsuarios();
    });
  }

  cancelar(): void {
    this.navegarAListaUsuarios();
  }

  private navegarAListaUsuarios(): void {
    this.router.navigate(['/administrador/gestion-usuarios']);
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth()+1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; 
  }

  private parseBackendDate(dateString: string): Date{
    const [year,month,day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // Mes - 1 porque los meses en JS van de 0 a 11
  }
}