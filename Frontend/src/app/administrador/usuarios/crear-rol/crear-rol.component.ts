import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';

// 🎨 Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

// 📦 Importar servicio y modelos
import { RolesService } from '../../../services/roles.service';
import {
  GestionesResponse,
  GestionUI,
  AccionPermiso,
  CrearRolRequest,
  Permiso,
  GestionesData
} from '../../../models/roles.model';

@Component({
  selector: 'app-crear-rol',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    HeaderAdminComponent,
    FooterAdminComponent,
    MatSnackBarModule,
  ],
  templateUrl: './crear-rol.component.html',
  styleUrl: './crear-rol.component.scss'
})
export class CrearRolComponent implements OnInit {
  // 📋 Propiedades del componente
  rolForm!: FormGroup;
  gestiones: GestionUI[] = [];
  loading = true;
  saving = false;
  
  // 📊 Configuración de la tabla
  displayedColumns: string[] = ['gestion', 'ver', 'crear', 'modificar', 'eliminar', 'todos'];

  constructor(
    private fb: FormBuilder,
    private rolesService: RolesService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarGestiones();
  }

  /**
   * 🏗️ Inicializar formulario
   */
  private inicializarFormulario(): void {
    this.rolForm = this.fb.group({
      nombre: ['', [
        Validators.required, 
        Validators.minLength(3),
        Validators.maxLength(50)
      ]],
      permisos: this.fb.group({})
    });
  }

  /**
   * 🔄 Procesar gestiones y crear controles dinámicos
   */
  private procesarGestiones(response: GestionesResponse): void {
    const gestionesData: GestionesData = response.gestiones;
    const permisosGroup = this.rolForm.get('permisos') as FormGroup;
    
    this.gestiones = Object.keys(gestionesData).map(key => {
      const gestion = gestionesData[key as keyof GestionesData];
      
      // 📋 Organizar permisos por acción
      const permisosPorAccion = {
        crear: gestion.permisos.filter(p => p.accion === 'crear'),
        modificar: gestion.permisos.filter(p => p.accion === 'modificar'),
        eliminar: gestion.permisos.filter(p => p.accion === 'eliminar'),
        ver: gestion.permisos.filter(p => p.accion === 'ver'),
        otros: gestion.permisos.filter(p => p.accion === 'otros')
      };

      // 🆕 Crear controles para cada gestión
      const gestionControls = this.fb.group({
        ver: [{ 
          value: false, 
          disabled: permisosPorAccion.ver.length === 0 
        }],
        crear: [{ 
          value: false, 
          disabled: permisosPorAccion.crear.length === 0 
        }],
        modificar: [{ 
          value: false, 
          disabled: permisosPorAccion.modificar.length === 0 
        }],
        eliminar: [{ 
          value: false, 
          disabled: permisosPorAccion.eliminar.length === 0 
        }],
        todos: [false]
      });
      
      // Agregar controles al grupo de permisos
      permisosGroup.addControl(key, gestionControls);

      return {
        key,
        label: gestion.label,
        permisos: permisosPorAccion,
        seleccionados: {
          crear: false,
          modificar: false,
          eliminar: false,
          ver: false,
          todos: false
        }
      };
    });
  }

  /**
   * 🔄 Manejar cambio en checkbox - CORREGIDO
   */
  onPermisoChange(gestionKey: string, accion: AccionPermiso): void {
    const permisosGroup = this.rolForm.get('permisos') as FormGroup;
    const gestionGroup = permisosGroup.get(gestionKey) as FormGroup;
    
    if (accion === 'todos') {
      this.toggleTodosFormControl(gestionGroup);
    } else {
      this.actualizarEstadoTodosFormControl(gestionGroup);
    }
  }

  /**
   * 🔄 Toggle "Todos" - CORREGIDO
   */
  private toggleTodosFormControl(gestionGroup: FormGroup): void {
    const todosControl = gestionGroup.get('todos');
    const nuevoEstado = todosControl?.value;
    
    // 🎯 Si "Todos" se marca, marcar todos los disponibles
    if (nuevoEstado) {
      // Marcar solo los que están habilitados
      const controles = ['ver', 'crear', 'modificar', 'eliminar'];
      controles.forEach(control => {
        const controlInstance = gestionGroup.get(control);
        if (controlInstance && !controlInstance.disabled) {
          controlInstance.setValue(true, { emitEvent: false });
        }
      });
    } else {
      // Si "Todos" se desmarca, desmarcar todos
      gestionGroup.patchValue({
        ver: false,
        crear: false,
        modificar: false,
        eliminar: false
      }, { emitEvent: false });
    }
  }

  /**
   * 🔄 Actualizar estado de "Todos" - CORREGIDO
   */
  private actualizarEstadoTodosFormControl(gestionGroup: FormGroup): void {
    const valores = gestionGroup.value;
    
    // Verificar solo los controles que están habilitados
    const controlesHabilitados = ['ver', 'crear', 'modificar', 'eliminar'].filter(control => {
      const controlInstance = gestionGroup.get(control);
      return controlInstance && !controlInstance.disabled;
    });
    
    // "Todos" está marcado solo si TODOS los controles habilitados están marcados
    const todosMarcados = controlesHabilitados.length > 0 && 
                         controlesHabilitados.every(control => valores[control]);
    
    gestionGroup.get('todos')?.setValue(todosMarcados, { emitEvent: false });
  }

  /**
   * 📊 Obtener IDs de permisos seleccionados
   */
  getPermisosSeleccionados(): number[] {
    const permisosIds: number[] = [];
    const permisosGroup = this.rolForm.get('permisos') as FormGroup;
    
    this.gestiones.forEach(gestion => {
      const gestionGroup = permisosGroup.get(gestion.key) as FormGroup;
      const valores = gestionGroup.value;
      
      // Solo procesar acciones individuales (no 'todos')
      Object.keys(valores).forEach(accion => {
        if (accion !== 'todos' && valores[accion]) {
          const permisos: Permiso[] = gestion.permisos[accion as keyof typeof gestion.permisos];
          permisos.forEach(permiso => {
            if (!permisosIds.includes(permiso.id)) {
              permisosIds.push(permiso.id);
            }
          });
        }
      });
    });
    
    return permisosIds;
  }

  /**
   * 🎯 Obtener FormGroup de una gestión específica
   */
  getGestionFormGroup(gestionKey: string): FormGroup {
    const permisosGroup = this.rolForm.get('permisos') as FormGroup;
    return permisosGroup.get(gestionKey) as FormGroup;
  }

  /**
   * 📥 Cargar gestiones desde el backend
   */
  cargarGestiones(): void {
    this.loading = true;
    
    this.rolesService.getGestiones().subscribe({
      next: (response: GestionesResponse) => {
        this.procesarGestiones(response);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando gestiones:', error);
        this.mostrarError('Error al cargar los permisos');
        this.loading = false;
      }
    });
  }

  /**
   * 💾 Guardar nuevo rol
   */
  guardarRol(): void {
    if (this.rolForm.invalid) {
      this.mostrarError('Por favor completa todos los campos requeridos');
      return;
    }

    const permisosSeleccionados = this.getPermisosSeleccionados();
    
    if (permisosSeleccionados.length === 0) {
      this.mostrarError('Debes seleccionar al menos un permiso');
      return;
    }

    this.saving = true;
    
    const data: CrearRolRequest = {
      nombre: this.rolForm.get('nombre')?.value.trim(),
      permisos: permisosSeleccionados
    };

    this.rolesService.crearRol(data).subscribe({
      next: (response) => {
        this.mostrarExito('Rol creado exitosamente');
        this.navegarARoles();
      },
      error: (error) => {
        console.error('Error creando rol:', error);
        const mensaje = error.error?.error || 'Error al crear el rol';
        this.mostrarError(mensaje);
        this.saving = false;
      }
    });
  }

  /**
   * ↩️ Cancelar y volver
   */
  cancelar(): void {
    this.navegarARoles();
  }

  /**
   * 📈 Obtener contador de permisos seleccionados
   */
  getContadorPermisos(): string {
    const total = this.getPermisosSeleccionados().length;
    return total > 0 ? `${total} permisos seleccionados` : 'Ningún permiso seleccionado';
  }

  /**
   * 🔴 Mostrar mensaje de error
   */
  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * 🟢 Mostrar mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { 
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * 🔄 Navegar a la lista de roles
   */
  private navegarARoles(): void {
    this.router.navigate(['/administrador/usuarios/roles']);
  }
}