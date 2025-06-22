import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';
import { CatalogoService } from '../../services/catalogo.service';

// ✅ INTERFAZ MÁS ESPECÍFICA
interface ConfiguracionIVA {
  id?: number;
  porcentaje_iva: number;
  activo: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: ConfiguracionIVA;
  message?: string;
}

@Component({
  selector: 'app-gestion-iva',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  templateUrl: './gestion-iva.component.html',
  styleUrls: ['./gestion-iva.component.scss']
})
export class GestionIvaComponent implements OnInit {

  private fb = inject(FormBuilder);
  private catalogoService = inject(CatalogoService);
  private snackBar = inject(MatSnackBar);

  ivaForm: FormGroup;
  ivaActual: ConfiguracionIVA | null = null;
  loading = false;
  isEditMode = false;

  constructor() {
    this.ivaForm = this.fb.group({
      porcentaje_iva: ['', [
        Validators.required,
        Validators.min(0),
        Validators.max(99.99),
        // ✅ MEJORAR: Patrón más flexible que acepta enteros y decimales
        Validators.pattern(/^\d+(\.\d{1,2})?$/)  // Acepta: 15, 15.0, 15.00
      ]]
    });
  }

  ngOnInit(): void {
    this.cargarIvaActual();
  }

  cargarIvaActual(): void {
    this.loading = true;

    this.catalogoService.getIvaActual().subscribe({
      next: (response: ApiResponse) => {
        if (response.success && response.data) {
          this.ivaActual = response.data;
          this.isEditMode = true;

          this.ivaForm.patchValue({
            porcentaje_iva: response.data.porcentaje_iva
          });

          console.log('✅ IVA actual cargado:', this.ivaActual);
        } else {
          this.isEditMode = false;
          console.log('ℹ️ No hay IVA configurado, modo creación');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar IVA:', error);
        this.loading = false;
        this.isEditMode = false;
      }
    });
  }

  // ✅ AGREGAR: Método para normalizar el porcentaje
  private normalizarPorcentaje(valor: any): number {
    if (typeof valor === 'string') {
      // Convertir string a número
      const numeroParseado = parseFloat(valor);
      // Redondear a 2 decimales para asegurar formato correcto
      return Math.round(numeroParseado * 100) / 100;
    }
    if (typeof valor === 'number') {
      // Redondear a 2 decimales
      return Math.round(valor * 100) / 100;
    }
    return valor;
  }

  onSubmit(): void {
    if (this.ivaForm.valid && !this.loading) {
      const formData = this.ivaForm.value;

      // ✅ NORMALIZAR: Asegurar formato decimal correcto
      const datosNormalizados = {
        porcentaje_iva: this.normalizarPorcentaje(formData.porcentaje_iva)
      };

      console.log('📤 Enviando configuración IVA:', datosNormalizados);
      console.log('🔢 Valor original:', formData.porcentaje_iva);
      console.log('🔢 Valor normalizado:', datosNormalizados.porcentaje_iva);

      this.loading = true;

      const request = this.isEditMode
        ? this.catalogoService.actualizarIva(datosNormalizados)
        : this.catalogoService.crearIva(datosNormalizados);

      request.subscribe({
        next: (response) => {
          if (response.success) {
            const mensaje = this.isEditMode
              ? `IVA actualizado al ${datosNormalizados.porcentaje_iva}%`
              : `IVA creado al ${datosNormalizados.porcentaje_iva}%`;

            this.mostrarMensaje(mensaje, 'success');
            this.cargarIvaActual(); // Recargar datos
          } else {
            this.mostrarMensaje('Error al guardar la configuración', 'error');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al guardar IVA:', error);
          this.mostrarMensaje('Error al conectar con el servidor', 'error');
          this.loading = false;
        }
      });
    } else {
      this.marcarCamposComoTocados();
    }
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.ivaForm.controls).forEach(key => {
      this.ivaForm.get(key)?.markAsTouched();
    });
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'success-snackbar' : 'error-snackbar',
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  // Getters para errores
  // ✅ MEJORAR: Getter para errores más específico
  get porcentajeError(): string {
    const control = this.ivaForm.get('porcentaje_iva');
    if (control?.hasError('required') && control?.touched) {
      return 'El porcentaje de IVA es obligatorio';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'El porcentaje no puede ser negativo';
    }
    if (control?.hasError('max') && control?.touched) {
      return 'El porcentaje no puede ser mayor a 99.99%';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'Ingrese un número válido (ejemplos: 15, 15.5, 15.00)';
    }
    return '';
  }

  // Método para resetear el formulario
  resetearFormulario(): void {
    this.ivaForm.reset();
    this.cargarIvaActual();
  }
}
