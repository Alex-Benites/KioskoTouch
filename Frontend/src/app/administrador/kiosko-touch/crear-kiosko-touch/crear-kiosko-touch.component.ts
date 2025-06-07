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

  ]
})
export class CrearKioskoTouchComponent {
  form: FormGroup;
  establecimientos: (Establecimiento & { seleccionado: boolean })[] = [];
  establecimientosAsociados: (Establecimiento & { seleccionado: boolean })[] = [];
  loading = false;
  estados: { id: number, nombre: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private establecimientosService: EstablecimientosService,
    private kioskoTouchService: KioskoTouchService,
    private router: Router,
    private route: ActivatedRoute,
    private catalogoService: CatalogoService,

  ) {
    this.form = this.fb.group({
      nombreKiosco: ['', [Validators.required]],
      estadoKiosco: [''],
      token: ['', [Validators.required]],
      establecimientoAsociado: [''],
      buscarCiudad: ['']
    });
  }
  kioscoId: number | null = null;
  isEditMode = false;

  ngOnInit(): void {
    this.cargarEstados();
    this.cargarEstablecimientos();
    this.generarToken(); // Generar token automáticamente al cargar

    // Detectar modo edición
    this.kioscoId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.kioscoId && !isNaN(this.kioscoId);

    if (this.isEditMode) {
      this.cargarKioscoParaEditar();
    }
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

  cargarKioscoParaEditar(): void {
    if (!this.kioscoId) return;
    this.kioskoTouchService.obtenerKioscoTouchPorId(this.kioscoId).subscribe({
      next: (kiosco) => {
        this.form.patchValue({
          nombreKiosco: kiosco.nombre,
          token: kiosco.token,
          estadoKiosco: kiosco.estado_id
        });

        // Si hay establecimiento asociado, agregarlo a la lista
        if (kiosco.establecimiento) {
          const establecimiento = this.establecimientos.find(e => e.id === kiosco.establecimiento_id);
          if (establecimiento) {
            this.establecimientosAsociados = [{ ...establecimiento, seleccionado: false }];
            this.actualizarCampoEstablecimientoAsociado();
          }
        }
      },
      error: (error) => {
        alert('Error al cargar el kiosco');
        this.router.navigate(['/administrador/kiosko-touch']);
      }
    });
  }


  cargarEstablecimientos(): void {
    this.loading = true;
    this.establecimientosService.obtenerEstablecimientos().subscribe({
      next: (data) => {
        this.establecimientos = data.map(e => ({ ...e, seleccionado: false }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando establecimientos:', error);
        alert('Error al cargar establecimientos');
        this.loading = false;
      }
    });
  }

  generarToken(): void {
    const token = Math.random().toString(36).substr(2, 12).toUpperCase();
    this.form.get('token')?.setValue(token);
  }

  onEstablecimientoSeleccionado(establecimiento: any, event: any): void {
    establecimiento.seleccionado = event.checked;
  }

  agregarEstablecimiento(): void {
    const establecimientosSeleccionados = this.establecimientos.filter(e => e.seleccionado);

    if (establecimientosSeleccionados.length === 0) {
      alert('Por favor, selecciona al menos un establecimiento para agregar.');
      return;
    }

    const establecimientosYaAsociados: string[] = [];
    const establecimientosNuevos: any[] = [];

    establecimientosSeleccionados.forEach(establecimiento => {
      const yaAsociado = this.establecimientosAsociados.find(ea => ea.id === establecimiento.id);

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
      alert(mensaje);
    }

    if (establecimientosNuevos.length > 0) {
      this.establecimientosAsociados.push(...establecimientosNuevos);
      this.actualizarCampoEstablecimientoAsociado();
      this.establecimientos.forEach(e => e.seleccionado = false);
    }
  }


  actualizarCampoEstablecimientoAsociado(): void {
    const nombresEstablecimientos = this.establecimientosAsociados.map(e => e.nombre).join(', ');
    this.form.get('establecimientoAsociado')?.setValue(nombresEstablecimientos);
  }

  eliminarEstablecimiento(): void {
    this.establecimientosAsociados = [];
    this.form.get('establecimientoAsociado')?.setValue('');
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

  // Método para remover un establecimiento específico (también corregir aquí)
  removerEstablecimientoAsociado(establecimientoARemover: any): void {
    this.establecimientosAsociados = this.establecimientosAsociados.filter(e => e.id !== establecimientoARemover.id);
    this.actualizarCampoEstablecimientoAsociado();
  }


  borrarToken(): void {
    this.form.get('token')?.setValue('');
    console.log('Token borrado');
  }

  crearKiosco(): void {
    if (this.form.invalid) {
      alert('Por favor, complete todos los campos requeridos.');
      return;
    }

    if (this.establecimientosAsociados.length === 0) {
      alert('Debe asociar al menos un establecimiento al kiosco.');
      return;
    }

    const kioscoData = {
      nombre: this.form.get('nombreKiosco')?.value,
      token: this.form.get('token')?.value,
      estado: this.form.get('estadoKiosco')?.value,
      establecimientos_asociados: this.establecimientosAsociados.map(e => e.id!)
    };

    this.loading = true;

    if (this.isEditMode && this.kioscoId) {
      this.kioskoTouchService.actualizarKioscoTouch(this.kioscoId, kioscoData).subscribe({
        next: () => {
          alert('Kiosco Touch actualizado exitosamente!');
          this.router.navigate(['/administrador/kiosko-touch']);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error actualizando kiosco:', error);
          alert('Error al actualizar el kiosco: ' + (error.error?.error || 'Error desconocido'));
          this.loading = false;
        }
      });
    } else {
      this.kioskoTouchService.crearKioscoTouch(kioscoData).subscribe({
        next: () => {
          alert('Kiosco Touch creado exitosamente!');
          this.router.navigate(['/administrador/kiosko-touch']);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creando kiosco:', error);
          alert('Error al crear el kiosco: ' + (error.error?.error || 'Error desconocido'));
          this.loading = false;
        }
      });
    }
  }
}
