import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
    HeaderAdminComponent
  ]
})
export class CrearKioskoTouchComponent {
  form: FormGroup;
  establecimientos = [
    { nombre: 'Local 1: Sur', imagen: 'assets/admin/ADMIN_23.png', seleccionado: false },
    { nombre: 'Local 2: Norte', imagen: 'assets/admin/ADMIN_23.png', seleccionado: false },
    { nombre: 'Local 3: Centro', imagen: 'assets/admin/ADMIN_23.png', seleccionado: false },
    { nombre: 'Local 4: Sur', imagen: 'assets/admin/ADMIN_23.png', seleccionado: false },
    { nombre: 'Local 5: Centro', imagen: 'assets/admin/ADMIN_23.png', seleccionado: false }
  ];

  establecimientosAsociados: any[] = [];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombreKiosco: [''],
      estadoKiosco: ['activo'],
      token: [''],
      establecimientoAsociado: [''],
      buscarCiudad: ['']
    });
  }

  generarToken(): void {
    const token = Math.random().toString(36).substr(2, 8).toUpperCase();
    this.form.get('token')?.setValue(token);
  }

  // Método para manejar la selección de checkboxes
  onEstablecimientoSeleccionado(establecimiento: any, event: any): void {
    establecimiento.seleccionado = event.checked;
  }

  // Método para agregar establecimientos seleccionados (misma lógica que kioscos)
  agregarEstablecimiento(): void {
    const establecimientosSeleccionados = this.establecimientos.filter(e => e.seleccionado);

    if (establecimientosSeleccionados.length === 0) {
      alert('Por favor, selecciona al menos un establecimiento para agregar.');
      return;
    }

    const establecimientosYaAsociados: string[] = [];
    const establecimientosNuevos: any[] = [];

    establecimientosSeleccionados.forEach(establecimiento => {
      // Verificar si el establecimiento ya está asociado (usando nombre en lugar de id)
      const yaAsociado = this.establecimientosAsociados.find(ea => ea.nombre === establecimiento.nombre);

      if (yaAsociado) {
        establecimientosYaAsociados.push(establecimiento.nombre);
      } else {
        establecimientosNuevos.push(establecimiento);
      }
    });

    // Mostrar mensaje si algunos establecimientos ya estaban asociados
    if (establecimientosYaAsociados.length > 0) {
      const mensaje = establecimientosYaAsociados.length === 1
        ? `El establecimiento "${establecimientosYaAsociados[0]}" ya ha sido asociado.`
        : `Los establecimientos "${establecimientosYaAsociados.join('", "')}" ya han sido asociados.`;

      alert(mensaje);
    }

    // Agregar solo los establecimientos nuevos
    if (establecimientosNuevos.length > 0) {
      this.establecimientosAsociados.push(...establecimientosNuevos);
      this.actualizarCampoEstablecimientoAsociado();

      // Limpiar selecciones
      this.establecimientos.forEach(e => e.seleccionado = false);
    }
  }

  // Método para actualizar el campo de texto con los establecimientos asociados
  actualizarCampoEstablecimientoAsociado(): void {
    const nombresEstablecimientos = this.establecimientosAsociados.map(e => e.nombre).join(', ');
    this.form.get('establecimientoAsociado')?.setValue(nombresEstablecimientos);
  }

  // Método para eliminar todos los establecimientos asociados
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
    this.establecimientosAsociados = this.establecimientosAsociados.filter(e => e.nombre !== establecimientoARemover.nombre);
    this.actualizarCampoEstablecimientoAsociado();
  }

  borrarToken(): void {
    this.form.get('token')?.setValue('');
    console.log('Token borrado');
  }

  crearKiosco(): void {
    // Validar que el nombre no esté vacío
    if (!this.form.get('nombreKiosco')?.value?.trim()) {
      alert('El nombre del kiosco es requerido.');
      return;
    }

    // Validar que haya al menos un establecimiento asociado
    if (this.establecimientosAsociados.length === 0) {
      alert('Debe asociar al menos un establecimiento al kiosco.');
      return;
    }

    // Si pasa todas las validaciones, proceder con la creación
    const formData = {
      nombreKiosco: this.form.get('nombreKiosco')?.value,
      estadoKiosco: this.form.get('estadoKiosco')?.value,
      token: this.form.get('token')?.value,
      establecimientosAsociados: this.establecimientosAsociados
    };

    console.log('Kiosco creado:', formData);
    alert('Kiosco Touch creado exitosamente!');
  }
}
