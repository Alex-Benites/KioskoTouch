import { Component,OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { KioskoTouchService } from '../../../services/kiosko-touch.service';
import { Establecimiento } from '../../../models/establecimiento.model';
import { CatalogoService } from '../../../services/catalogo.service';
import { ActivatedRoute } from '@angular/router'; // Agregar import
import { MatDialog } from '@angular/material/dialog';
import { SuccessDialogComponent } from '../../../shared/success-dialog/success-dialog.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { SuccessPopupComponent } from '../../../shared/success-popup/success-popup.component';

@Component({
  selector: 'app-crear-kiosko-touch',
  templateUrl: './crear-kiosko-touch.component.html',
  styleUrls: ['./crear-kiosko-touch.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterModule,
    FooterAdminComponent,
    HeaderAdminComponent,
    SuccessPopupComponent
  ]
})
export class CrearKioskoTouchComponent implements OnInit {
  form: FormGroup;
  establecimientos: (Establecimiento & { seleccionado: boolean })[] = [];
  establecimientosFiltrados: (Establecimiento & { seleccionado: boolean })[] = [];
  establecimientosAsociados: (Establecimiento & { seleccionado: boolean })[] = [];

  ciudadSeleccionada: string = '';
  loading = false;
  estados: { id: number, nombre: string }[] = [];

  // ✅ AGREGAR: Propiedades para el popup
  mostrarPopup = false;
  tituloPopup = '';
  mensajePopup = '';

  // Lista de provincias...
  provinciasEcuador: string[] = [
    'Azuay',
    'Bolívar',
    'Cañar',
    'Carchi',
    'Chimborazo',
    'Cotopaxi',
    'El Oro',
    'Esmeraldas',
    'Galápagos',
    'Guayas',
    'Imbabura',
    'Loja',
    'Los Ríos',
    'Manabí',
    'Morona Santiago',
    'Napo',
    'Orellana',
    'Pastaza',
    'Pichincha',
    'Santa Elena',
    'Santo Domingo de los Tsáchilas',
    'Sucumbíos',
    'Tungurahua',
    'Zamora Chinchipe'
  ];

  constructor(
    private fb: FormBuilder,
    private establecimientosService: EstablecimientosService,
    private kioskoTouchService: KioskoTouchService,
    private router: Router,
    private route: ActivatedRoute,
    private catalogoService: CatalogoService,
    private dialog: MatDialog,
  ) {
    this.form = this.fb.group({
      nombreKiosco: ['', [Validators.required]],
      estadoKiosco: [''],
      token: ['', [Validators.required]],
      establecimientoAsociado: [''],
      // ✅ CAMBIAR: Cambiar a provinciaFiltro
      provinciaFiltro: [''] // En lugar de ciudadFiltro
    });
  }
  kioscoId: number | null = null;
  isEditMode = false;

  ngOnInit(): void {
    this.cargarEstados();
    this.generarToken();

    // Detectar modo edición
    this.kioscoId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.kioscoId && !isNaN(this.kioscoId);

    // ✅ CAMBIAR: Cargar establecimientos PRIMERO, luego el kiosco
    this.cargarEstablecimientos().then(() => {
      if (this.isEditMode) {
        this.cargarKioscoParaEditar();
      }
    });
  }

  abrirDialogoExito(titulo: string, mensaje: string, callback?: () => void) {
    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      disableClose: true,
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

  cargarEstados(): void {
    this.catalogoService.getEstados().subscribe({
      next: (estados) => {
        this.estados = estados;
      },
      error: (error) => {
        console.error('Error cargando estados:', error);
      }
    });
  }

  // ✅ MODIFICAR: Hacer cargarEstablecimientos async
  cargarEstablecimientos(): Promise<void> {
    console.log('🔍 INICIANDO carga de establecimientos...');
    this.loading = true;
    
    return new Promise((resolve, reject) => {
      this.establecimientosService.obtenerEstablecimientos().subscribe({
        next: (data) => {
          console.log('✅ Establecimientos recibidos:', data);
          this.establecimientos = data.map(e => ({ ...e, seleccionado: false }));
          this.establecimientosFiltrados = [...this.establecimientos];
          console.log('✅ Establecimientos procesados:', this.establecimientos.length);
          this.loading = false;
          resolve(); // ✅ Resolver cuando termine
        },
        error: (error) => {
          console.error('❌ Error cargando establecimientos:', error);
          alert('Error al cargar establecimientos');
          this.loading = false;
          reject(error); // ✅ Rechazar en caso de error
        }
      });
    });
  }

  // ✅ MODIFICAR: Agregar debug y corregir la lógica
  cargarKioscoParaEditar(): void {
    if (!this.kioscoId) return;
    
    console.log('🔧 Cargando kiosco para editar, ID:', this.kioscoId);
    console.log('🔧 Establecimientos disponibles:', this.establecimientos.length);
    
    this.kioskoTouchService.obtenerKioscoTouchPorId(this.kioscoId).subscribe({
      next: (kiosco) => {
        console.log('✅ Datos de kiosco recibidos:', kiosco);
        
        // Cargar datos básicos del kiosco
        this.form.patchValue({
          nombreKiosco: kiosco.nombre,
          token: kiosco.token,
          estadoKiosco: kiosco.estado_id
        });

        // ✅ VERIFICAR: ¿Qué estructura tiene el establecimiento en la respuesta?
        console.log('🏢 Establecimiento en respuesta:', kiosco.establecimiento);
        console.log('🏢 establecimiento_id:', kiosco.establecimiento_id);

        // ✅ CORREGIR: Buscar el establecimiento correctamente
        if (kiosco.establecimiento) {
          // Si viene el objeto completo del establecimiento
          const establecimientoId = kiosco.establecimiento.id || kiosco.establecimiento_id;
          console.log('🔍 Buscando establecimiento con ID:', establecimientoId);
          
          const establecimiento = this.establecimientos.find(e => e.id === establecimientoId);
          console.log('🔍 Establecimiento encontrado:', establecimiento);
          
          if (establecimiento) {
            this.establecimientosAsociados = [{ ...establecimiento, seleccionado: false }];
            this.actualizarCampoEstablecimientoAsociado();
            console.log('✅ Establecimiento asociado cargado:', establecimiento.nombre);
          } else {
            console.warn('⚠️ No se encontró el establecimiento en la lista');
          }
        } else if (kiosco.establecimiento_id) {
          // Si solo viene el ID
          console.log('🔍 Buscando por establecimiento_id:', kiosco.establecimiento_id);
          
          const establecimiento = this.establecimientos.find(e => e.id === kiosco.establecimiento_id);
          if (establecimiento) {
            this.establecimientosAsociados = [{ ...establecimiento, seleccionado: false }];
            this.actualizarCampoEstablecimientoAsociado();
            console.log('✅ Establecimiento asociado cargado:', establecimiento.nombre);
          }
        } else {
          console.log('⚠️ No hay establecimiento asociado a este kiosco');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar el kiosco:', error);
        alert('Error al cargar el kiosco');
        this.router.navigate(['/administrador/gestion-kiosko-touch']);
      }
    });
  }

  generarToken(): void {
    const token = Math.random().toString(36).substr(2, 12).toUpperCase();
    this.form.get('token')?.setValue(token);
  }

  // ✅ CAMBIAR: Método para filtrar por provincia
  filtrarPorProvincia(): void {
    const provinciaSeleccionada = this.form.get('provinciaFiltro')?.value;

    if (!provinciaSeleccionada) {
      // Si no hay provincia seleccionada, mostrar todos
      this.establecimientosFiltrados = [...this.establecimientos];
    } else {
      // Filtrar por provincia (sin importar mayúsculas/minúsculas)
      this.establecimientosFiltrados = this.establecimientos.filter(establecimiento =>
        establecimiento.provincia?.toLowerCase().includes(provinciaSeleccionada.toLowerCase())
      );
    }

    console.log(`🗺️ Filtrando por provincia: "${provinciaSeleccionada}"`);
    console.log(`📊 Establecimientos encontrados: ${this.establecimientosFiltrados.length}`);
  }

  onEstablecimientoSeleccionado(establecimiento: any, event: any): void {
    establecimiento.seleccionado = event.checked;
  }

  // ✅ AGREGAR: Método faltante para actualizar campo
  actualizarCampoEstablecimientoAsociado(): void {
    const nombresEstablecimientos = this.establecimientosAsociados.map((e: any) => e.nombre).join(', ');
    this.form.get('establecimientoAsociado')?.setValue(nombresEstablecimientos);
  }

  // ✅ AGREGAR: Métodos para manejar el popup
  mostrarPopupPersonalizado(titulo: string, mensaje: string): void {
    this.tituloPopup = titulo;
    this.mensajePopup = mensaje;
    this.mostrarPopup = true;
  }

  mostrarPopupConNavegacion(titulo: string, mensaje: string, ruta: string): void {
    this.tituloPopup = titulo;
    this.mensajePopup = mensaje;
    this.mostrarPopup = true;

    // Navegar después de cerrar el popup
    setTimeout(() => {
      this.router.navigate([ruta]);
    }, 2000); // Esperar 2 segundos antes de navegar
  }

  cerrarPopup(): void {
    this.mostrarPopup = false;
  }

  // ✅ AGREGAR AQUÍ: Método para eliminar establecimientos
  eliminarEstablecimiento(): void {
    if (this.establecimientosAsociados.length === 0) {
      this.mostrarPopupPersonalizado(
        'No hay establecimientos',
        'No hay establecimientos asociados para eliminar.'
      );
      return;
    }

    // Limpiar todos los establecimientos asociados
    this.establecimientosAsociados = [];
    this.form.get('establecimientoAsociado')?.setValue('');

    // Mostrar popup de confirmación
    this.mostrarPopupPersonalizado(
      'Establecimientos eliminados',
      'Todos los establecimientos han sido desvinculados del kiosco.'
    );
  }

  // ✅ MODIFICAR: Método agregarEstablecimiento con popups
  agregarEstablecimiento(): void {
    const establecimientosSeleccionados = this.establecimientos.filter(e => e.seleccionado);

    if (establecimientosSeleccionados.length === 0) {
      // ✅ CAMBIAR: Usar popup en lugar de alert
      this.mostrarPopupPersonalizado(
        'Selección requerida',
        'Por favor, selecciona al menos un establecimiento para agregar.'
      );
      return;
    }

    const establecimientosYaAsociados: string[] = [];
    const establecimientosNuevos: (Establecimiento & { seleccionado: boolean })[] = [];

    establecimientosSeleccionados.forEach(establecimiento => {
      const yaAsociado = this.establecimientosAsociados.find((ea: any) => ea.id === establecimiento.id);

      if (yaAsociado) {
        establecimientosYaAsociados.push(establecimiento.nombre);
      } else {
        establecimientosNuevos.push(establecimiento);
      }
    });

    if (establecimientosYaAsociados.length > 0) {
      const mensaje = establecimientosYaAsociados.length === 1
        ? `El establecimiento "${establecimientosYaAsociados[0]}" ya ha sido asociado.`
        : `Los establecimientos "${establecimientosYaAsociados.join('", "')}" ya han sido asociados.`;

      // ✅ CAMBIAR: Usar popup en lugar de alert
      this.mostrarPopupPersonalizado('Establecimiento ya asociado', mensaje);
      return;
    }

    if (establecimientosNuevos.length > 0) {
      this.establecimientosAsociados.push(...establecimientosNuevos);
      this.actualizarCampoEstablecimientoAsociado();
      this.establecimientos.forEach(e => e.seleccionado = false);

      // ✅ AGREGAR: Popup de éxito
      const mensaje = establecimientosNuevos.length === 1
        ? `El establecimiento "${establecimientosNuevos[0].nombre}" ha sido asociado exitosamente.`
        : `${establecimientosNuevos.length} establecimientos han sido asociados exitosamente.`;

      this.mostrarPopupPersonalizado('¡Éxito!', mensaje);
    }
  }

  // ✅ MODIFICAR: Método crearKiosco con popups
  crearKiosco(): void {
    if (this.form.invalid) {
      // ✅ CAMBIAR: Usar popup en lugar de alert
      this.mostrarPopupPersonalizado(
        'Campos incompletos',
        'Por favor, complete todos los campos requeridos.'
      );
      return;
    }

    if (this.establecimientosAsociados.length === 0) {
      // ✅ CAMBIAR: Usar popup en lugar de alert
      this.mostrarPopupPersonalizado(
        'Establecimiento requerido',
        'Debe asociar al menos un establecimiento al kiosco.'
      );
      return;
    }

    this.mostrarDialogConfirmacion();
  }

  private mostrarDialogConfirmacion(): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'kiosco touch',
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
    const kioscoData = {
      nombre: this.form.get('nombreKiosco')?.value,
      token: this.form.get('token')?.value,
      estado: this.form.get('estadoKiosco')?.value,
      establecimientos_asociados: this.establecimientosAsociados.map((e: any) => e.id!)
    };

    this.loading = true;

    if (this.isEditMode && this.kioscoId) {
      this.kioskoTouchService.actualizarKioscoTouch(this.kioscoId, kioscoData).subscribe({
        next: () => {
          this.loading = false;
          // ✅ CAMBIAR: Usar abrirDialogoExito consistente
          this.abrirDialogoExito(
            '¡Éxito!',
            'Kiosco Touch actualizado exitosamente!',
            () => this.router.navigate(['/administrador/gestion-kiosko-touch'])
          );
        },
        error: (error) => {
          console.error('Error actualizando kiosco:', error);
          this.loading = false;
          // ✅ CAMBIAR: Usar popup para errores
          this.mostrarPopupPersonalizado(
            'Error',
            'Error al actualizar el kiosco: ' + (error.error?.error || 'Error desconocido')
          );
        }
      });
    } else {
      this.kioskoTouchService.crearKioscoTouch(kioscoData).subscribe({
        next: () => {
          this.loading = false;
          // ✅ CAMBIAR: Usar abrirDialogoExito consistente
          this.abrirDialogoExito(
            '¡Éxito!',
            'Kiosco Touch creado exitosamente!',
            () => this.router.navigate(['/administrador/gestion-kiosko-touch'])
          );
        },
        error: (error) => {
          console.error('Error creando kiosco:', error);
          this.loading = false;
          // ✅ CAMBIAR: Usar popup para errores
          this.mostrarPopupPersonalizado(
            'Error',
            'Error al crear el kiosco: ' + (error.error?.error || 'Error desconocido')
          );
        }
      });
    }
  }

  // ✅ MANTENER: Solo este método (el que está en las líneas ~244)
  // Ya existe más arriba en el código

  // ✅ MANTENER: Método para remover establecimiento específico
  removerEstablecimientoAsociado(establecimientoARemover: any): void {
    const nombreRemovido = establecimientoARemover.nombre;
    this.establecimientosAsociados = this.establecimientosAsociados.filter((e: any) => e.id !== establecimientoARemover.id);
    this.actualizarCampoEstablecimientoAsociado();

    // Mostrar popup de confirmación
    this.mostrarPopupPersonalizado(
      'Establecimiento removido',
      `"${nombreRemovido}" ha sido desvinculado del kiosco.`
    );
  }


  borrarToken(): void {
    this.form.get('token')?.setValue('');
    console.log('Token borrado');
  }

  copiarToken(): void {
    const token = this.form.get('token')?.value;
    if (token) {
      navigator.clipboard.writeText(token).then(() => {
        console.log('Token copiado al portapapeles:', token);
      }).catch(err => {
        console.error('Error al copiar el token:', err);
      });
    } else {
      console.warn('No hay token para copiar.');
    }
  }
}
