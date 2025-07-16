import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PantallaCocinaService } from '../../../services/pantalla-cocina.service';
import { KioskoTouchService } from '../../../services/kiosko-touch.service';
import { CatalogoService } from '../../../services/catalogo.service';
import { MatDialog } from '@angular/material/dialog';
import { SuccessDialogComponent } from '../../../shared/success-dialog/success-dialog.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';


@Component({
  selector: 'app-crear-pantalla-cocina',
  templateUrl: './crear-pantalla-cocina.component.html',
  styleUrls: ['./crear-pantalla-cocina.component.scss'],
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
    HeaderAdminComponent
  ]
})
export class CrearPantallaCocinaComponent implements OnInit {
  form: FormGroup;
  kioscos: any[] = [];
  kioscosFiltrados: any[] = []; // ✅ AGREGAR esta propiedad
  establecimientos: any[] = []; // ✅ AGREGAR esta propiedad
  kioscosAsociados: any[] = [];
  loading = false;
  estados: { id: number, nombre: string }[] = [];
  pantallaId: number | null = null;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private pantallaCocinaService: PantallaCocinaService,
    private kioskoTouchService: KioskoTouchService,
    private catalogoService: CatalogoService,
    private dialog: MatDialog
  ) {
    this.form = this.fb.group({
      nombrePantalla: ['', [Validators.required]],
      estadoPantalla: [''],
      token: ['', [Validators.required]],
      kioscoAsociado: [''],
      establecimientoFiltro: [''] // ✅ AGREGAR este control
    });
  }

  ngOnInit(): void {
    this.cargarEstados();
    this.cargarEstablecimientos(); // ✅ AGREGAR esta llamada
    this.generarToken();

    // Detectar modo edición
    this.pantallaId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.pantallaId && !isNaN(this.pantallaId);

    // ✅ CAMBIAR: Cargar kioskos PRIMERO, luego la pantalla
    this.cargarKioscos().then(() => {
      if (this.isEditMode) {
        this.cargarPantallaParaEditar();
      }
    });
  }

  // ✅ AGREGAR este método
  cargarEstablecimientos(): void {
    this.catalogoService.getEstablecimientos().subscribe({
      next: (establecimientos) => {
        this.establecimientos = establecimientos;
        console.log('✅ Establecimientos cargados:', this.establecimientos);
      },
      error: (error) => {
        console.error('❌ Error cargando establecimientos:', error);
      }
    });
  }

  // ✅ AGREGAR este método
  filtrarPorEstablecimiento(): void {
    const establecimientoSeleccionado = this.form.get('establecimientoFiltro')?.value;

    console.log('🔍 Filtro aplicado:', establecimientoSeleccionado);
    console.log('📱 Kioscos disponibles:', this.kioscos);

    if (!establecimientoSeleccionado || establecimientoSeleccionado === '') {
      this.kioscosFiltrados = [...this.kioscos];
    } else {
      // ✅ USAR kiosco.establecimiento.id porque el establecimiento es un objeto
      this.kioscosFiltrados = this.kioscos.filter(kiosco => {
        const establecimientoId = kiosco.establecimiento?.id;
        console.log(`🔍 Comparando kiosco "${kiosco.nombre}": establecimientoId=${establecimientoId}, seleccionado=${establecimientoSeleccionado}`);
        return establecimientoId === establecimientoSeleccionado;
      });
    }

    console.log('📱 Kioscos filtrados resultado:', this.kioscosFiltrados);
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

  cargarKioscos(): Promise<void> {
    console.log('🔍 INICIANDO carga de kioskos...');
    this.loading = true;

    return new Promise((resolve, reject) => {
      this.kioskoTouchService.obtenerKioscosTouch().subscribe({
        next: (data) => {
          console.log('✅ Kioskos recibidos del backend:', data);

          if (data && Array.isArray(data)) {
            this.kioscos = data.map(k => ({ ...k, seleccionado: false }));
            this.kioscosFiltrados = [...this.kioscos]; // ✅ INICIALIZAR filtrados
            console.log('✅ Kioskos procesados:', this.kioscos);
          } else {
            console.warn('⚠️ Los datos no son un array válido');
            this.kioscos = [];
            this.kioscosFiltrados = []; // ✅ INICIALIZAR filtrados vacío
          }

          this.loading = false;
          resolve(); // ✅ Resolver la promesa cuando termine
        },
        error: (error) => {
          console.error('❌ ERROR cargando kioscos:', error);
          alert('Error al cargar kioscos: ' + (error.message || 'Error desconocido'));
          this.loading = false;
          this.kioscosFiltrados = []; // ✅ INICIALIZAR filtrados vacío en error
          reject(error); // ✅ Rechazar en caso de error
        }
      });
    });
  }

  cargarPantallaParaEditar(): void {
    if (!this.pantallaId) return;

    console.log('🔧 Cargando pantalla para editar, ID:', this.pantallaId);
    console.log('🔧 Kioskos disponibles ANTES de buscar:', this.kioscos); // ✅ DEBUG

    this.pantallaCocinaService.obtenerPantallaCoci‌naPorId(this.pantallaId).subscribe({
      next: (pantalla) => {
        console.log('✅ Datos de pantalla recibidos:', pantalla);

        // Cargar datos básicos de la pantalla
        this.form.patchValue({
          nombrePantalla: pantalla.nombre,
          token: pantalla.token,
          estadoPantalla: pantalla.estado_id
        });

        // ✅ NUEVO: Cargar MÚLTIPLES kioskos asociados
        if (pantalla.kioskos_asociados && Array.isArray(pantalla.kioskos_asociados)) {
          console.log('📱 Kioskos asociados a la pantalla:', pantalla.kioskos_asociados);
          console.log('📱 Kioskos disponibles para buscar:', this.kioscos.length); // ✅ DEBUG

          // Buscar los kioskos en la lista cargada
          const kioscosAsociados = pantalla.kioskos_asociados.map((kioscoId: number) => {
            const kiosco = this.kioscos.find(k => k.id === kioscoId);
            console.log(`🔍 Buscando kiosco ID ${kioscoId}:`, kiosco ? 'ENCONTRADO' : 'NO ENCONTRADO'); // ✅ DEBUG
            if (kiosco) {
              return { ...kiosco, seleccionado: false };
            }
            return null;
          }).filter((k: any) => k !== null);

          console.log('✅ Kioskos encontrados y asociados:', kioscosAsociados);
          this.kioscosAsociados = kioscosAsociados;
          this.actualizarCampoKioscoAsociado();

        } else {
          console.log('⚠️ No hay kioskos asociados a esta pantalla');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar la pantalla:', error);
        alert('Error al cargar la pantalla');
        this.router.navigate(['/administrador/gestion-pantallas-cocina']);
      }
    });
  }

  generarToken(): void {
    const token = Math.random().toString(36).substr(2, 8).toUpperCase();
    this.form.get('token')?.setValue(token);
  }

  onKioscoSeleccionado(kiosco: any, event: any): void {
    kiosco.seleccionado = event.checked;
  }

  agregarKiosco(): void {
    console.log('🔧 AGREGAR KIOSCO - Estado antes:');
    console.log('📱 Kioskos actualmente asociados:', this.kioscosAsociados);
    console.log('📱 Kioskos seleccionados para agregar:', this.kioscos.filter(k => k.seleccionado));

    const kioscosSeleccionados = this.kioscos.filter(k => k.seleccionado);

    if (kioscosSeleccionados.length === 0) {
      alert('Por favor, selecciona al menos un kiosco para agregar.');
      return;
    }

    // ✅ PERMITIR MÚLTIPLES KIOSKOS
    kioscosSeleccionados.forEach(kioscoSeleccionado => {
      const kioscoYaAsociado = this.kioscosAsociados.find(ka => ka.id === kioscoSeleccionado.id);
      console.log(`🔍 Verificando kiosco ${kioscoSeleccionado.nombre} (ID: ${kioscoSeleccionado.id}):`,
                 kioscoYaAsociado ? 'YA ASOCIADO' : 'NUEVO');

      if (!kioscoYaAsociado) {
        this.kioscosAsociados.push(kioscoSeleccionado);
        console.log(`✅ Kiosco agregado: ${kioscoSeleccionado.nombre}`);
      } else {
        alert(`El kiosco "${kioscoSeleccionado.nombre}" ya ha sido asociado.`);
      }
    });

    console.log('📱 Kioskos asociados DESPUÉS de agregar:', this.kioscosAsociados);
    this.actualizarCampoKioscoAsociado();
    this.kioscos.forEach(k => k.seleccionado = false);
  }

  actualizarCampoKioscoAsociado(): void {
    const nombresKioscos = this.kioscosAsociados.map(k => k.nombre).join(', ');
    this.form.get('kioscoAsociado')?.setValue(nombresKioscos);
  }

  eliminarKiosco(): void {
    this.kioscosAsociados = [];
    this.form.get('kioscoAsociado')?.setValue('');
  }

  removerKioscoAsociado(kioscoARemover: any): void {
    this.kioscosAsociados = this.kioscosAsociados.filter(k => k.id !== kioscoARemover.id);
    this.actualizarCampoKioscoAsociado();
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

  borrarToken(): void {
    this.form.get('token')?.setValue('');
    console.log('Token borrado');
  }

  crearPantalla(): void {
    if (this.form.valid) {
      console.log('🔧 GUARDANDO PANTALLA - Verificación:');
      console.log('📱 Kioskos asociados actuales:', this.kioscosAsociados);
      console.log('📱 IDs que se van a enviar:', this.kioscosAsociados.map(k => k.id));

      if (this.kioscosAsociados.length === 0) {
        alert('Debe asociar al menos un kiosco antes de crear la pantalla.');
        return;
      }

      this.mostrarDialogConfirmacion();
    } else {
      alert('Por favor, complete todos los campos requeridos.');
    }
  }

  private mostrarDialogConfirmacion(): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'pantalla de cocina',
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
    this.loading = true;

    const pantallaData = {
      nombre: this.form.get('nombrePantalla')?.value,
      token: this.form.get('token')?.value,
      estado: this.form.get('estadoPantalla')?.value,
      // ✅ IMPORTANTE: Enviar TODOS los kioskos asociados
      kioskos_asociados: this.kioscosAsociados.map(k => k.id)
    };

    console.log('📤 Datos que se envían al backend:', pantallaData);

    if (this.isEditMode && this.pantallaId) {
      // Modo edición
      console.log('🔧 Modo EDICIÓN - Actualizando pantalla ID:', this.pantallaId);

      this.pantallaCocinaService.actualizarPantallaCocina(this.pantallaId, pantallaData).subscribe({
        next: (response) => {
          console.log('✅ Respuesta del backend (edición):', response);
          this.loading = false;
          if (response.success) {
            this.abrirDialogoExito('¡Pantalla Actualizada!', 'La pantalla de cocina se ha actualizado correctamente.', () => {
              this.router.navigate(['/administrador/gestion-pantallas-cocina']);
            });
          } else {
            alert(`Error: ${response.error}`);
          }
        },
        error: (error) => {
          console.error('❌ Error al actualizar pantalla:', error);
          this.loading = false;
          alert('Error al actualizar la pantalla de cocina');
        }
      });
    } else {
      // Modo creación
      this.pantallaCocinaService.crearPantallaCocina(pantallaData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.abrirDialogoExito('¡Pantalla Creada!', 'La pantalla de cocina se ha creado correctamente.', () => {
              this.router.navigate(['/administrador/gestion-pantallas-cocina']);
            });
          } else {
            alert(`Error: ${response.error}`);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al crear pantalla:', error);
          alert('Error al crear la pantalla de cocina');
        }
      });
    }
  }
}