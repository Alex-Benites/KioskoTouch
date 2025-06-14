import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  EditarRolRequest,
  DetalleRol,
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
  
  // 🆕 Propiedades para modo edición
  rolId: number | null = null;
  isEditMode: boolean = false;
  
  // 📊 Configuración de la tabla
  displayedColumns: string[] = ['gestion', 'ver', 'crear', 'modificar', 'eliminar', 'todos'];

  constructor(
    private fb: FormBuilder,
    private rolesService: RolesService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    // 🔍 Verificar si estamos en modo edición
    this.rolId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.rolId && !isNaN(this.rolId);
    
    if (this.isEditMode) {
      this.cargarRolParaEditar();
    } else {
      this.cargarGestiones();
    }
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
   * 📥 Cargar rol para editar
   */
  private cargarRolParaEditar(): void {
    this.loading = true;
    
    this.rolesService.getDetalleRol(this.rolId!).subscribe({
      next: (detalleRol: DetalleRol) => {
        // Primero cargar las gestiones
        this.cargarGestiones().then(() => {
          // Luego llenar el formulario con los datos del rol
          this.rolForm.patchValue({
            nombre: detalleRol.grupo.name
          });
          
          // Marcar los permisos seleccionados
          this.marcarPermisosSeleccionados(detalleRol.grupo.permisos);
        });
      },
      error: (error) => {
        console.error('Error al cargar rol:', error);
        this.mostrarError('Error al cargar el rol para editar');
        this.router.navigate(['/administrador/usuarios/editar-eliminar-rol']);
        this.loading = false;
      }
    });
  }

  /**
   * ✅ Marcar permisos seleccionados en modo edición
   */
  private marcarPermisosSeleccionados(permisosDelRol: Permiso[]): void {
    const permisosGroup = this.rolForm.get('permisos') as FormGroup;
    const idsPermisosDelRol = permisosDelRol.map(p => p.id);
    
    this.gestiones.forEach(gestion => {
      const gestionGroup = permisosGroup.get(gestion.key) as FormGroup;
      
      // Verificar cada acción
      Object.keys(gestion.permisos).forEach(accion => {
        if (accion !== 'otros') { // Omitir 'otros' por ahora
          const permisosDeEstaAccion = gestion.permisos[accion as keyof typeof gestion.permisos];
          
          // Si algún permiso de esta acción está en el rol, marcar la acción
          const tienePermisoDeEstaAccion = permisosDeEstaAccion.some(p => 
            idsPermisosDelRol.includes(p.id)
          );
          
          if (tienePermisoDeEstaAccion) {
            gestionGroup.get(accion)?.setValue(true, { emitEvent: false });
          }
        }
      });
      
      // ✅ APLICAR LÓGICA DE DEPENDENCIAS DESPUÉS DE CARGAR
      this.controlarEstadoVerControl(gestionGroup);
      // Actualizar el estado de "Todos"
      this.actualizarEstadoTodosFormControl(gestionGroup);
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
   * 🔄 Manejar cambio en checkbox
   */
  onPermisoChange(gestionKey: string, accion: AccionPermiso): void {
    const permisosGroup = this.rolForm.get('permisos') as FormGroup;
    const gestionGroup = permisosGroup.get(gestionKey) as FormGroup;
    
    if (accion === 'todos') {
      this.toggleTodosFormControl(gestionGroup);
    } else {
      // ✅ APLICAR LÓGICA DE DEPENDENCIAS
      this.aplicarLogicaPermisos(gestionGroup, accion);
      this.actualizarEstadoTodosFormControl(gestionGroup);
    }
  }

  /**
   * ✅ MEJORADO: Aplicar lógica de dependencias de permisos
   */
  private aplicarLogicaPermisos(gestionGroup: FormGroup, accion: AccionPermiso): void {
    const verControl = gestionGroup.get('ver');
    const accionesQueRequierenVer: AccionPermiso[] = ['crear', 'modificar', 'eliminar'];
    
    // ✅ NULL CHECK
    if (!verControl) {
      console.warn('Control "ver" no encontrado para esta gestión');
      return;
    }
    
    // Si se selecciona crear/modificar/eliminar, auto-marcar "ver"
    if (accionesQueRequierenVer.includes(accion)) {
      const accionControl = gestionGroup.get(accion);
      
      if (!accionControl) {
        console.warn(`Control "${accion}" no encontrado para esta gestión`);
        return;
      }
      
      // Si la acción se acaba de marcar Y "ver" no está marcado Y "ver" está habilitado
      if (accionControl.value && !verControl.value && !verControl.disabled) {
        verControl.setValue(true, { emitEvent: false });
        console.log(`ℹ️ Permiso "ver" marcado automáticamente por dependencia de "${accion}"`);
      }
    }
    
    // ✅ CONTROLAR ESTADO DE "VER" BASADO EN DEPENDENCIAS
    this.controlarEstadoVerControl(gestionGroup);
  }

  /**
   * ✅ NUEVO MÉTODO: Controlar si "ver" debe estar habilitado o bloqueado - MEJORADO
   */
  private controlarEstadoVerControl(gestionGroup: FormGroup): void {
    const verControl = gestionGroup.get('ver');
    const crearControl = gestionGroup.get('crear');
    const modificarControl = gestionGroup.get('modificar');
    const eliminarControl = gestionGroup.get('eliminar');
    
    if (!verControl) return;
    
    // Verificar si alguna dependencia está activa
    const tieneDependenciasActivas = 
      (crearControl?.value && !crearControl?.disabled) ||
      (modificarControl?.value && !modificarControl?.disabled) ||
      (eliminarControl?.value && !eliminarControl?.disabled);
    
    if (tieneDependenciasActivas) {
      // ✅ HAY DEPENDENCIAS: marcar "ver" pero NO deshabilitarlo
      // Solo marcarlo como requerido visualmente
      verControl.setValue(true, { emitEvent: false });
      // NO deshabilitar: verControl.disable({ emitEvent: false });
      
      // ✅ OPCIONAL: Agregar clase CSS para mostrar que es requerido
      verControl.markAsTouched();
    } else {
      // ✅ NO HAY DEPENDENCIAS: permitir que el usuario elija
      verControl.enable({ emitEvent: false });
    }
  }

  /**
   * 🔄 Toggle "Todos" - ACTUALIZADO
   */
  private toggleTodosFormControl(gestionGroup: FormGroup): void {
    const todosControl = gestionGroup.get('todos');
    const nuevoEstado = todosControl?.value;
    
    if (nuevoEstado) {
      // Marcar todos los controles habilitados
      const controles = ['ver', 'crear', 'modificar', 'eliminar'];
      controles.forEach(control => {
        const controlInstance = gestionGroup.get(control);
        if (controlInstance && !controlInstance.disabled) {
          controlInstance.setValue(true, { emitEvent: false });
        }
      });
    } else {
      // Desmarcar todos
      gestionGroup.patchValue({
        ver: false,
        crear: false,
        modificar: false,
        eliminar: false
      }, { emitEvent: false });
    }
    
    // ✅ ACTUALIZAR ESTADO DE "VER" DESPUÉS DE CAMBIOS
    this.controlarEstadoVerControl(gestionGroup);
  }

  /**
   * 🔄 Actualizar estado de "Todos"
   */
  private actualizarEstadoTodosFormControl(gestionGroup: FormGroup): void {
    const valores = gestionGroup.value;
    
    const controlesHabilitados = ['ver', 'crear', 'modificar', 'eliminar'].filter(control => {
      const controlInstance = gestionGroup.get(control);
      return controlInstance && !controlInstance.disabled;
    });
    
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
  cargarGestiones(): Promise<void> {
    this.loading = true;
    
    return new Promise((resolve, reject) => {
      this.rolesService.getGestiones().subscribe({
        next: (response: GestionesResponse) => {
          this.procesarGestiones(response);
          this.loading = false;
          resolve();
        },
        error: (error) => {
          console.error('Error cargando gestiones:', error);
          this.mostrarError('Error al cargar los permisos');
          this.loading = false;
          reject(error);
        }
      });
    });
  }

  /**
   * 💾 Guardar rol (crear o actualizar)
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
    
    if (this.isEditMode) {
      this.actualizarRol(permisosSeleccionados);
    } else {
      this.crearRol(permisosSeleccionados);
    }
  }

  /**
   * 🆕 Crear nuevo rol
   */
  private crearRol(permisosSeleccionados: number[]): void {
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
   * ✏️ Actualizar rol existente
   */
  private actualizarRol(permisosSeleccionados: number[]): void {
    const data: EditarRolRequest = {
      nombre: this.rolForm.get('nombre')?.value.trim(),
      permisos: permisosSeleccionados
    };

    this.rolesService.editarRol(this.rolId!, data).subscribe({
      next: (response) => {
        this.mostrarExito('Rol actualizado exitosamente');
        this.navegarARoles();
      },
      error: (error) => {
        console.error('Error actualizando rol:', error);
        const mensaje = error.error?.error || 'Error al actualizar el rol';
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
    if(this.isEditMode){
      this.router.navigate(['/administrador/gestion-usuarios/editar-eliminar-rol']); 
    } else{
      this.router.navigate(['/administrador/gestion-usuarios']);
    }
  }
}