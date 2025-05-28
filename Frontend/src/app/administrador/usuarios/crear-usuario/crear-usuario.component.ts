import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

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

// Services (para cuando los implementes)
// import { UsuariosService } from '../../../services/usuarios.service';
// import { EstablecimientosService } from '../../../services/establecimientos.service';
// import { RolesService } from '../../../services/roles.service';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [
    CommonModule,
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
    FooterAdminComponent
  ],
  templateUrl: './crear-usuario.component.html',
  styleUrls: ['./crear-usuario.component.scss']
})
export class CrearUsuarioComponent implements OnInit {
  usuarioForm!: FormGroup;
  isEditMode = false;
  userId: number | null = null;
  saving = false;
  hidePassword = true;
  hideConfirmPassword = true;

  // Datos para los selects
  establecimientos = [
    { id: 1, nombre: 'Establecimiento Central' },
    { id: 2, nombre: 'Sucursal Norte' },
    { id: 3, nombre: 'Sucursal Sur' }
  ];

  rolesDisponibles = [
    { id: 1, name: 'Administrador' },
    { id: 2, name: 'Supervisor' },
    { id: 3, name: 'Cajero' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
    // private usuariosService: UsuariosService,
    // private establecimientosService: EstablecimientosService,
    // private rolesService: RolesService
  ) {
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
    this.cargarEstablecimientos();
    this.cargarRoles();
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
      establecimiento: ['', [Validators.required]],
      turnoTrabajo: [''],
      grupos: [[], [Validators.required]],
      isActive: [true]
    }, {
      validators: this.isEditMode ? [] : [this.passwordMatchValidator()]
    });
  }

  private cargarUsuarioParaEditar(): void {
    // TODO: Implementar cuando tengas el servicio
    console.log('Cargando usuario para editar:', this.userId);
    
    // Remover validaciones de contraseña en modo edición
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('confirmPassword')?.clearValidators();
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.usuarioForm.get('confirmPassword')?.updateValueAndValidity();
  }

  private cargarEstablecimientos(): void {
    // TODO: Implementar servicio de establecimientos
    console.log('Cargando establecimientos...');
  }

  private cargarRoles(): void {
    // TODO: Implementar servicio de roles
    console.log('Cargando roles...');
  }

  // Validador personalizado para cédula ecuatoriana
  private cedulaEcuatorianaValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const cedula = control.value;
      if (!cedula) return null;

      if (!/^\d{10}$/.test(cedula)) {
        return { cedulaInvalida: true };
      }

      // Validación del dígito verificador
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

  // Validador para confirmar contraseña
  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password');
      const confirmPassword = control.get('confirmPassword');

      if (!password || !confirmPassword) {
        return null;
      }

      return password.value === confirmPassword.value ? null : { passwordMismatch: true };
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
    const formData = this.usuarioForm.value;
    console.log('Creando usuario:', formData);

    // TODO: Implementar llamada al servicio
    setTimeout(() => {
      this.mostrarExito('Usuario creado exitosamente');
      this.navegarAListaUsuarios();
    }, 2000);
  }

  private actualizarUsuario(): void {
    const formData = this.usuarioForm.value;
    console.log('Actualizando usuario:', formData);

    // TODO: Implementar llamada al servicio
    setTimeout(() => {
      this.mostrarExito('Usuario actualizado exitosamente');
      this.navegarAListaUsuarios();
    }, 2000);
  }

  cancelar(): void {
    this.navegarAListaUsuarios();
  }

  private navegarAListaUsuarios(): void {
    this.router.navigate(['/administrador/usuarios']);
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
}