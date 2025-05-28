import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker'; // Importa MatDatepickerModule
import { MatNativeDateModule } from '@angular/material/core'; // Importa MatNativeDateModule
import { CommonModule } from '@angular/common';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';

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
    MatDatepickerModule, // Agrega MatDatepickerModule
    MatNativeDateModule, // Agrega MatNativeDateModule
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  templateUrl: './crear-usuario.component.html',
  styleUrls: ['./crear-usuario.component.scss']
})
export class CrearUsuarioComponent implements OnInit {
  usuarioForm: FormGroup;
  establecimientos = [
    { id: 1, nombre: 'Establecimiento 1' },
    { id: 2, nombre: 'Establecimiento 2' }
  ];
  roles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Supervisor' }
  ];

  constructor(private fb: FormBuilder) {
    this.usuarioForm = this.fb.group({
      nombreCompleto: ['', Validators.required],
      correoElectronico: ['', [Validators.required, Validators.email]],
      numeroTelefono: [''],
      fechaNacimiento: [''],
      usuario: ['', Validators.required],
      contrasena: ['', Validators.required],
      fechaCreacion: [''],
      establecimientoAsignado: [''],
      turnoTrabajo: [''],
      rolAsignado: [''],
      estadoCuenta: ['activa']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.usuarioForm.valid) {
      console.log('Formulario válido:', this.usuarioForm.value);
      // Aquí puedes enviar los datos al backend
    } else {
      console.log('Formulario inválido');
      this.usuarioForm.markAllAsTouched();
    }
  }

  cancelar(): void {
    console.log('Creación de usuario cancelada');
  }
}