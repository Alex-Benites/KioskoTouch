import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

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
    FormsModule,                    // 🆕 Agregado para ngModel
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './crear-rol.component.html',
  styleUrl: './crear-rol.component.scss'
})
export class CrearRolComponent implements OnInit {
  // 📋 Propiedades del componente
  rolForm!: FormGroup;              // 🆕 Agregado ! para indicar asignación definitiva
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
      ]]
    });
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
   * 🔄 Procesar gestiones del backend para el UI
   */
  private procesarGestiones(response: GestionesResponse): void {
    const gestionesData: GestionesData = response.gestiones;
    
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
  onPermisoChange(gestionIndex: number, accion: AccionPermiso): void {
    if (accion === 'todos') {
      this.toggleTodos(gestionIndex);
    } else {
      this.actualizarEstadoTodos(gestionIndex);
    }
  }

  /**
   * 🔄 Toggle "Todos" para una gestión
   */
  private toggleTodos(gestionIndex: number): void {
    const gestion = this.gestiones[gestionIndex];
    const nuevoEstado = !gestion.seleccionados.todos;
    
    gestion.seleccionados.todos = nuevoEstado;
    gestion.seleccionados.crear = nuevoEstado;
    gestion.seleccionados.modificar = nuevoEstado;
    gestion.seleccionados.eliminar = nuevoEstado;
    gestion.seleccionados.ver = nuevoEstado;
  }

  /**
   * 🔄 Actualizar estado de "Todos" basado en selecciones individuales
   */
  private actualizarEstadoTodos(gestionIndex: number): void {
    const gestion = this.gestiones[gestionIndex];
    const { crear, modificar, eliminar, ver } = gestion.seleccionados;
    
    gestion.seleccionados.todos = crear && modificar && eliminar && ver;
  }

  /**
   * 📊 Obtener IDs de permisos seleccionados
   */
  getPermisosSeleccionados(): number[] {
    const permisosIds: number[] = [];
    
    this.gestiones.forEach(gestion => {
      Object.keys(gestion.seleccionados).forEach(accion => {
        if (accion !== 'todos' && gestion.seleccionados[accion as keyof typeof gestion.seleccionados]) {
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