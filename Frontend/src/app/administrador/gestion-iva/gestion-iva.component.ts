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
        
        Validators.pattern(/^\d+(\.\d{1,2})?$/) 
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

          
        } else {
          this.isEditMode = false;
        }
        this.loading = false;
      },
      error: (error) => {
        
        this.loading = false;
        this.isEditMode = false;
      }
    });
  }

  
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

      const datosNormalizados = {
        porcentaje_iva: this.normalizarPorcentaje(formData.porcentaje_iva)
      };

      this.mostrarDialogConfirmacion(datosNormalizados);
    } else {
      this.marcarCamposComoTocados();
    }
  }

  private mostrarDialogConfirmacion(datosNormalizados: any): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'configuración de IVA',
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

    const request = this.isEditMode
      ? this.catalogoService.actualizarIva(datosNormalizados)
      : this.catalogoService.crearIva(datosNormalizados);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          const mensaje = this.isEditMode
            ? `El IVA ha sido actualizado al ${datosNormalizados.porcentaje_iva}%`
            : `El IVA ha sido creado al ${datosNormalizados.porcentaje_iva}%`;

          this.mostrarDialogExito(
            this.isEditMode ? 'IVA Actualizado' : 'IVA Creado',
            mensaje,
            'Continuar'
          );
          this.cargarIvaActual();
        } else {
          this.mostrarDialogError('Error al guardar la configuración de IVA');
        }
        this.loading = false;
      },
      error: (error) => {
        
        this.mostrarDialogError('Error al conectar con el servidor');
        this.loading = false;
      }
    });
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.ivaForm.controls).forEach(key => {
      this.ivaForm.get(key)?.markAsTouched();
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
    });
  }

  
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

  resetearFormulario(): void {
    this.ivaForm.reset();
    this.cargarIvaActual();
  }
}
