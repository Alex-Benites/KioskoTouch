import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';
import { CatalogoService } from '../../services/catalogo.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../shared/success-dialog/success-dialog.component';

// ✅ EXPANDIDA: Interfaz completa para configuración empresarial
interface ConfiguracionEmpresarial {
  id?: number;
  // Configuración tributaria
  porcentaje_iva: number;
  activo: boolean;
  // Datos empresariales
  ruc?: string;
  razon_social?: string;
  nombre_comercial?: string;
  // Ubicación
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  // Contacto
  telefono?: string;
  email?: string;
}

interface ApiResponse {
  success: boolean;
  data?: ConfiguracionEmpresarial;
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
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  templateUrl: './gestion-iva.component.html',
  styleUrls: ['./gestion-iva.component.scss']
})
export class GestionIvaComponent implements OnInit {

  private fb = inject(FormBuilder);
  private catalogoService = inject(CatalogoService);
  private dialog = inject(MatDialog);

  // ✅ RENOMBRADO: De ivaForm a empresaForm
  empresaForm: FormGroup;
  configActual: ConfiguracionEmpresarial | null = null;
  loading = false;
  isEditMode = false;

  constructor() {
    // ✅ EXPANDIDO: Formulario completo con validaciones
    this.empresaForm = this.fb.group({
      // Configuración tributaria
      porcentaje_iva: ['', [
        Validators.required,
        Validators.min(0),
        Validators.max(99.99),
        Validators.pattern(/^\d+(\.\d{1,2})?$/) 
      ]],
      
      // Datos empresariales (OBLIGATORIOS)
      ruc: ['', [
        Validators.required,
        Validators.pattern(/^\d{13}$/), // Exactamente 13 dígitos
        Validators.minLength(13),
        Validators.maxLength(13)
      ]],
      razon_social: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(300)
      ]],
      nombre_comercial: ['', [
        Validators.maxLength(300)
      ]],
      
      // Ubicación (OBLIGATORIA)
      direccion: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(500)
      ]],
      ciudad: ['', [
        Validators.maxLength(100)
      ]],
      provincia: ['', [
        Validators.maxLength(100)
      ]],
      codigo_postal: ['', [
        Validators.maxLength(10)
      ]],
      
      // Contacto (OPCIONAL)
      telefono: ['', [
        Validators.pattern(/^[\d\+\-\(\)\s]+$/), // Solo números, +, -, (, ), espacios
        Validators.maxLength(20)
      ]],
      email: ['', [
        Validators.email,
        Validators.maxLength(254)
      ]]
    });
  }

  ngOnInit(): void {
    this.cargarConfiguracionActual();
  }

  // ✅ RENOMBRADO Y ACTUALIZADO: Cargar configuración completa
  cargarConfiguracionActual(): void {
    this.loading = true;

    // ✅ TODO: Actualizar este método en CatalogoService para usar el nuevo endpoint
    this.catalogoService.getConfiguracionEmpresa().subscribe({
      next: (response: ApiResponse) => {
        if (response.success && response.data) {
          this.configActual = response.data;
          this.isEditMode = true;

          // ✅ EXPANDIDO: Llenar todos los campos del formulario
          this.empresaForm.patchValue({
            porcentaje_iva: response.data.porcentaje_iva,
            ruc: response.data.ruc || '',
            razon_social: response.data.razon_social || '',
            nombre_comercial: response.data.nombre_comercial || '',
            direccion: response.data.direccion || '',
            ciudad: response.data.ciudad || '',
            provincia: response.data.provincia || '',
            codigo_postal: response.data.codigo_postal || '',
            telefono: response.data.telefono || '',
            email: response.data.email || ''
          });
        } else {
          this.isEditMode = false;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar configuración:', error);
        this.loading = false;
        this.isEditMode = false;
      }
    });
  }

  private normalizarPorcentaje(valor: any): number {
    if (typeof valor === 'string') {
      const numeroParseado = parseFloat(valor);
      return Math.round(numeroParseado * 100) / 100;
    }
    if (typeof valor === 'number') {
      return Math.round(valor * 100) / 100;
    }
    return valor;
  }

  onSubmit(): void {
    if (this.empresaForm.valid && !this.loading) {
      const formData = this.empresaForm.value;

      // ✅ EXPANDIDO: Normalizar todos los datos
      const datosNormalizados = {
        porcentaje_iva: this.normalizarPorcentaje(formData.porcentaje_iva),
        ruc: formData.ruc?.trim(),
        razon_social: formData.razon_social?.trim(),
        nombre_comercial: formData.nombre_comercial?.trim(),
        direccion: formData.direccion?.trim(),
        ciudad: formData.ciudad?.trim(),
        provincia: formData.provincia?.trim(),
        codigo_postal: formData.codigo_postal?.trim(),
        telefono: formData.telefono?.trim(),
        email: formData.email?.trim()
      };

      this.mostrarDialogConfirmacion(datosNormalizados);
    } else {
      this.marcarCamposComoTocados();
    }
  }

  private mostrarDialogConfirmacion(datosNormalizados: any): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'configuración empresarial', // ✅ ACTUALIZADO
      action: this.isEditMode ? 'update' : 'create'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.procesarFormulario(datosNormalizados);
      }
    });
  }

  private procesarFormulario(datosNormalizados: any): void {
    this.loading = true;

    // ✅ TODO: Actualizar estos métodos en CatalogoService
    const request = this.isEditMode
      ? this.catalogoService.actualizarConfiguracionEmpresa(datosNormalizados)
      : this.catalogoService.crearConfiguracionEmpresa(datosNormalizados);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          const mensaje = this.isEditMode
            ? 'La configuración empresarial ha sido actualizada correctamente'
            : 'La configuración empresarial ha sido creada correctamente';

          this.mostrarDialogExito(
            this.isEditMode ? 'Configuración Actualizada' : 'Configuración Creada',
            mensaje,
            'Continuar'
          );
          this.cargarConfiguracionActual();
        } else {
          this.mostrarDialogError('Error al guardar la configuración empresarial');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al procesar formulario:', error);
        this.mostrarDialogError('Error al conectar con el servidor');
        this.loading = false;
      }
    });
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.empresaForm.controls).forEach(key => {
      this.empresaForm.get(key)?.markAsTouched();
    });
  }

  private mostrarDialogExito(title: string, message: string, buttonText: string = 'Continuar'): void {
    const dialogData: SuccessDialogData = {
      title,
      message,
      buttonText
    };

    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(() => {
      // Opcional: Redirigir o hacer algo después del éxito
    });
  }

  private mostrarDialogError(mensaje: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: 'ERROR',
        action: 'error',
        context: 'admin',
        extraInfo: {
          mensaje: mensaje,
          soloConfirmar: true
        }
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      // No hacer nada adicional
    });
  }

  // ✅ EXPANDIDO: Getters para errores de todos los campos
  get porcentajeError(): string {
    const control = this.empresaForm.get('porcentaje_iva');
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

  get rucError(): string {
    const control = this.empresaForm.get('ruc');
    if (control?.hasError('required') && control?.touched) {
      return 'El RUC es obligatorio';
    }
    if (control?.hasError('pattern') && control?.touched) {
      return 'El RUC debe tener exactamente 13 dígitos';
    }
    if ((control?.hasError('minlength') || control?.hasError('maxlength')) && control?.touched) {
      return 'El RUC debe tener exactamente 13 dígitos';
    }
    return '';
  }

  get razonSocialError(): string {
    const control = this.empresaForm.get('razon_social');
    if (control?.hasError('required') && control?.touched) {
      return 'La razón social es obligatoria';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'La razón social debe tener al menos 3 caracteres';
    }
    if (control?.hasError('maxlength') && control?.touched) {
      return 'La razón social no puede exceder 300 caracteres';
    }
    return '';
  }

  get direccionError(): string {
    const control = this.empresaForm.get('direccion');
    if (control?.hasError('required') && control?.touched) {
      return 'La dirección es obligatoria';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'La dirección debe tener al menos 5 caracteres';
    }
    if (control?.hasError('maxlength') && control?.touched) {
      return 'La dirección no puede exceder 500 caracteres';
    }
    return '';
  }

  get telefonoError(): string {
    const control = this.empresaForm.get('telefono');
    if (control?.hasError('pattern') && control?.touched) {
      return 'Ingrese un teléfono válido (solo números, +, -, (, ), espacios)';
    }
    if (control?.hasError('maxlength') && control?.touched) {
      return 'El teléfono no puede exceder 20 caracteres';
    }
    return '';
  }

  get emailError(): string {
    const control = this.empresaForm.get('email');
    if (control?.hasError('email') && control?.touched) {
      return 'Ingrese un email válido';
    }
    if (control?.hasError('maxlength') && control?.touched) {
      return 'El email no puede exceder 254 caracteres';
    }
    return '';
  }

  resetearFormulario(): void {
    this.empresaForm.reset();
    this.cargarConfiguracionActual();
  }
}
