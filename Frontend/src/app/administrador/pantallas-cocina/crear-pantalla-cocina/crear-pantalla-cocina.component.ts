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

@Component({
  selector: 'app-crear-pantalla-cocina',
  templateUrl: './crear-pantalla-cocina.component.html',
  styleUrls: ['./crear-pantalla-cocina.component.scss'],
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
    HeaderAdminComponent
  ]
})
export class CrearPantallaCocinaComponent implements OnInit {
  form: FormGroup;
  kioscos: any[] = [];
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
    private catalogoService: CatalogoService
  ) {
    this.form = this.fb.group({
      nombrePantalla: ['', [Validators.required]],
      estadoPantalla: [''],
      token: ['', [Validators.required]],
      kioscoAsociado: [''],
      buscarCiudad: [''],
      buscarEstablecimiento: ['']
    });
  }

  ngOnInit(): void {
    this.cargarEstados();
    this.cargarKioscos();
    this.generarToken();

    // Detectar modo edición
    this.pantallaId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.pantallaId && !isNaN(this.pantallaId);

    if (this.isEditMode) {
      this.cargarPantallaParaEditar();
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

  cargarKioscos(): void {
    this.loading = true;
    this.kioskoTouchService.obtenerKioscosTouch().subscribe({
      next: (data) => {
        this.kioscos = data.map(k => ({ ...k, seleccionado: false }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando kioscos:', error);
        alert('Error al cargar kioscos');
        this.loading = false;
      }
    });
  }

  cargarPantallaParaEditar(): void {
    if (!this.pantallaId) return;
    this.pantallaCocinaService.obtenerPantallaCoci‌naPorId(this.pantallaId).subscribe({
      next: (pantalla) => {
        this.form.patchValue({
          nombrePantalla: pantalla.nombre,
          token: pantalla.token,
          estadoPantalla: pantalla.estado_id
        });

        // Si hay kiosco asociado, agregarlo a la lista
        if (pantalla.kiosco_touch) {
          const kiosco = this.kioscos.find(k => k.id === pantalla.kiosco_touch_id);
          if (kiosco) {
            this.kioscosAsociados = [{ ...kiosco, seleccionado: false }];
            this.actualizarCampoKioscoAsociado();
          }
        }
      },
      error: (error) => {
        alert('Error al cargar la pantalla');
        this.router.navigate(['/administrador/pantallas-cocina']);
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
    const kioscosSeleccionados = this.kioscos.filter(k => k.seleccionado);

    if (kioscosSeleccionados.length === 0) {
      alert('Por favor, selecciona al menos un kiosco para agregar.');
      return;
    }

    // Solo permitir un kiosco asociado (según tu modelo original)
    if (kioscosSeleccionados.length > 1) {
      alert('Solo se puede asociar un kiosco por pantalla.');
      return;
    }

    const kioscoYaAsociado = this.kioscosAsociados.find(ka => ka.id === kioscosSeleccionados[0].id);

    if (kioscoYaAsociado) {
      alert(`El kiosco "${kioscosSeleccionados[0].nombre}" ya ha sido asociado.`);
      return;
    }

    this.kioscosAsociados = [kioscosSeleccionados[0]];
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
    if (this.form.invalid) {
      alert('Por favor, complete todos los campos requeridos.');
      return;
    }

    if (this.kioscosAsociados.length === 0) {
      alert('Debe asociar un kiosco a la pantalla.');
      return;
    }

    const pantallaData = {
      nombre: this.form.get('nombrePantalla')?.value,
      token: this.form.get('token')?.value,
      estado: this.form.get('estadoPantalla')?.value,
      kiosco_touch_asociado: this.kioscosAsociados[0].id
    };

    this.loading = true;

    if (this.isEditMode && this.pantallaId) {
      this.pantallaCocinaService.actualizarPantallaCocina(this.pantallaId, pantallaData).subscribe({
        next: () => {
          alert('Pantalla de Cocina actualizada exitosamente!');
          this.router.navigate(['/administrador/pantallas-cocina']);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error actualizando pantalla:', error);
          alert('Error al actualizar la pantalla: ' + (error.error?.error || 'Error desconocido'));
          this.loading = false;
        }
      });
    } else {
      this.pantallaCocinaService.crearPantallaCocina(pantallaData).subscribe({
        next: () => {
          alert('Pantalla de Cocina creada exitosamente!');
          this.router.navigate(['/administrador/pantallas-cocina']);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creando pantalla:', error);
          alert('Error al crear la pantalla: ' + (error.error?.error || 'Error desconocido'));
          this.loading = false;
        }
      });
    }
  }
}