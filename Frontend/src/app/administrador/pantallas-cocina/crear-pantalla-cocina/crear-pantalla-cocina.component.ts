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
export class CrearPantallaCocinaComponent {
  form: FormGroup;
  kioscos = [
    { nombre: 'Kiosco 1', id: 'ID.0001', imagen: 'assets/admin/ADMIN_29_1.png', seleccionado: false },
    { nombre: 'Kiosco 2', id: 'ID.0002', imagen: 'assets/admin/ADMIN_29_1.png', seleccionado: false },
    { nombre: 'Kiosco 3', id: 'ID.0003', imagen: 'assets/admin/ADMIN_29_1.png', seleccionado: false },
    { nombre: 'Kiosco 4', id: 'ID.0004', imagen: 'assets/admin/ADMIN_29_1.png', seleccionado: false },
    { nombre: 'Kiosco 5', id: 'ID.0005', imagen: 'assets/admin/ADMIN_29_1.png', seleccionado: false }
  ];

  kioscosAsociados: any[] = [];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombrePantalla: [''],
      estadoPantalla: ['disponible'],
      token: [''],
      kioscoAsociado: [''],
      buscarCiudad: [''],
      buscarEstablecimiento: ['']
    });
  }

  generarToken(): void {
    const token = Math.random().toString(36).substr(2, 8).toUpperCase();
    this.form.get('token')?.setValue(token);
  }

  // Método para manejar la selección de checkboxes
  onKioscoSeleccionado(kiosco: any, event: any): void {
    kiosco.seleccionado = event.checked;
  }

  // Método para agregar kioscos seleccionados
  agregarKiosco(): void {
    const kioscosSeleccionados = this.kioscos.filter(k => k.seleccionado);

    if (kioscosSeleccionados.length === 0) {
      alert('Por favor, selecciona al menos un kiosco para agregar.');
      return;
    }

    const kioscosYaAsociados: string[] = [];
    const kioscosNuevos: any[] = [];

    kioscosSeleccionados.forEach(kiosco => {
      // Verificar si el kiosco ya está asociado
      const yaAsociado = this.kioscosAsociados.find(ka => ka.id === kiosco.id);

      if (yaAsociado) {
        kioscosYaAsociados.push(kiosco.nombre);
      } else {
        kioscosNuevos.push(kiosco);
      }
    });

    // Mostrar mensaje si algunos kioscos ya estaban asociados
    if (kioscosYaAsociados.length > 0) {
      const mensaje = kioscosYaAsociados.length === 1
        ? `El kiosco "${kioscosYaAsociados[0]}" ya ha sido asociado.`
        : `Los kioscos "${kioscosYaAsociados.join('", "')}" ya han sido asociados.`;

      alert(mensaje);
    }

    // Agregar solo los kioscos nuevos
    if (kioscosNuevos.length > 0) {
      this.kioscosAsociados.push(...kioscosNuevos);
      this.actualizarCampoKioscoAsociado();

      // Limpiar selecciones
      this.kioscos.forEach(k => k.seleccionado = false);
    }
  }

  // Método para actualizar el campo de texto con los kioscos asociados
  actualizarCampoKioscoAsociado(): void {
    const nombresKioscos = this.kioscosAsociados.map(k => k.nombre).join(', ');
    this.form.get('kioscoAsociado')?.setValue(nombresKioscos);
  }

  // Método para eliminar todos los kioscos asociados
  eliminarKiosco(): void {
    this.kioscosAsociados = [];
    this.form.get('kioscoAsociado')?.setValue('');
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

  // Método para remover un kiosco específico
  removerKioscoAsociado(kioscoARemover: any): void {
    this.kioscosAsociados = this.kioscosAsociados.filter(k => k.id !== kioscoARemover.id);
    this.actualizarCampoKioscoAsociado();
  }

  borrarToken(): void {
    this.form.get('token')?.setValue('');
    console.log('Token borrado');
  }

  crearPantalla(): void {
    // Validar que el nombre no esté vacío
    if (!this.form.get('nombrePantalla')?.value?.trim()) {
      alert('El nombre de la pantalla es requerido.');
      return;
    }

    // Validar que haya al menos un kiosco asociado
    if (this.kioscosAsociados.length === 0) {
      alert('Debe asociar al menos un kiosco a la pantalla.');
      return;
    }

    // Si pasa todas las validaciones, proceder con la creación
    const formData = {
      nombrePantalla: this.form.get('nombrePantalla')?.value,
      estadoPantalla: this.form.get('estadoPantalla')?.value,
      token: this.form.get('token')?.value,
      kioscosAsociados: this.kioscosAsociados
    };

    console.log('Pantalla creada:', formData);
    alert('Pantalla creada exitosamente!');
  }
}