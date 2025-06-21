import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { User, Empleado } from '../../models/usuarios.model';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule,
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.scss']
})
export class PerfilUsuarioComponent implements OnInit {
  
  private authService = inject(AuthService);
  private usuariosService = inject(UsuariosService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  currentUser: User | null = null;
  empleado: Empleado | null = null;
  
  passwordForm!: FormGroup;
  
  loading = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  ngOnInit(): void {
    this.initializePasswordForm();
    this.loadUserData();
  }

  private initializePasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.empleado = this.authService.getCurrentEmpleado();
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    
    group.get('confirmPassword')?.setErrors(null);
    return null;
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.loading = true;
      
      const passwordData = {
        current_password: this.passwordForm.get('currentPassword')?.value,
        new_password: this.passwordForm.get('newPassword')?.value
      };

      console.log('🔐 Cambiando contraseña...');
      
      this.usuariosService.cambiarPassword(passwordData).subscribe({
        next: (response) => {
          console.log('✅ Contraseña cambiada exitosamente');
          this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          this.passwordForm.reset();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error cambiando contraseña:', error);
          
          let mensaje = 'Error al cambiar la contraseña';
          if (error.error?.error) {
            mensaje = error.error.error;
          } else if (error.error?.current_password) {
            mensaje = 'La contraseña actual es incorrecta';
          }
          
          this.snackBar.open(mensaje, 'Cerrar', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    }
  }

  get currentPassword() { return this.passwordForm.get('currentPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }

  get nombreCompleto(): string {
    if (this.empleado) {
      return `${this.empleado.nombres} ${this.empleado.apellidos}`;
    }
    return this.currentUser?.username || 'Usuario';
  }

  get nombreUsuario(): string {
    return this.currentUser?.first_name && this.currentUser?.last_name 
      ? `${this.currentUser.first_name} ${this.currentUser.last_name}`
      : this.currentUser?.username || 'Usuario';
  }

  get rolUsuario(): string {
    if (this.currentUser?.groups && this.currentUser.groups.length > 0) {
      return this.currentUser.groups[0];
    }
    return 'Sin rol asignado';
  }

  get sexoEmpleado(): string {
    if (this.empleado?.sexo) {
      return this.empleado.sexo;
    }
    return 'No especificado';
  }
}