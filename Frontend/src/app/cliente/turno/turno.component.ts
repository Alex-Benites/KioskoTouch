import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TurnoConfirmationDialogComponent } from '../../shared/turno-confirmation-dialog/turno-confirmation-dialog.component';
import { PedidoService } from '../../services/pedido.service'; // ✅ AGREGAR

@Component({
  selector: 'app-turno',
  standalone: true,
  imports: [
    CommonModule,
    PublicidadSectionComponent,
    MatDialogModule
  ],
  templateUrl: './turno.component.html',
  styleUrls: ['./turno.component.scss']
})
export class TurnoComponent {
  numeroTurno: string = '';
  readonly MAX_DIGITS = 3;

  // ✅ USAR inject en lugar de constructor
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private pedidoService = inject(PedidoService); // ✅ AGREGAR

  onPublicidadCambio(publicidad: Publicidad): void {
    // Manejar cambio de publicidad si es necesario
  }

  agregarNumero(numero: string): void {
    if (this.numeroTurno.length < this.MAX_DIGITS) {
      this.numeroTurno += numero;
    }
  }

  eliminarNumero(): void {
    this.numeroTurno = this.numeroTurno.slice(0, -1);
  }

  // ✅ MODIFICAR: Método continuar con navegación y guardado de turno
  continuar(): void {
    if (!this.numeroTurno) {
      console.warn('⚠️ No hay número de turno ingresado');
      return;
    }

    const turnoNumerico = parseInt(this.numeroTurno);

    // ✅ VALIDAR: Número de turno válido
    if (isNaN(turnoNumerico) || turnoNumerico <= 0) {
      alert('Por favor ingresa un número de turno válido');
      return;
    }

    // ✅ VALIDAR: Verificar que haya productos en el carrito
    const cantidadProductos = this.pedidoService.cantidadItems();
    if (cantidadProductos === 0) {
      alert('No tienes productos en tu pedido. Agrega productos antes de continuar.');
      console.warn('⚠️ No hay productos en el carrito');
      return;
    }

    console.log('✅ Procesando turno:', this.numeroTurno);
    console.log('📋 Productos en carrito:', cantidadProductos);

    // ✅ GUARDAR: Establecer el turno en el servicio
    this.pedidoService.establecerTurno(this.numeroTurno);

    // ✅ CONFIRMAR: Mostrar mensaje de confirmación
    console.log(`✅ Turno ${this.numeroTurno} confirmado y guardado`);

    // ✅ NAVEGAR: Ir al resumen del pedido
    console.log('🎯 Navegando al resumen del pedido...');
    this.router.navigate(['/cliente/resumen-pedido']);

    // ✅ OPCIONAL: Limpiar el campo local (el turno se mantiene en el servicio)
    this.numeroTurno = '';
  }

  // ✅ MANTENER: Método para abrir el diálogo de prueba
  abrirDialogoPrueba(): void {
    const dialogRef = this.dialog.open(TurnoConfirmationDialogComponent, {
      width: '450px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Usuario seleccionó "Sí" en el diálogo');
      } else {
        console.log('❌ Usuario seleccionó "No" en el diálogo');
      }
    });
  }

  // ✅ NUEVO: Método para verificar el estado del pedido (debug)
  verificarEstadoPedido(): void {
    console.log('🔍 ESTADO ACTUAL DEL PEDIDO:');
    console.log('   - Turno actual:', this.pedidoService.obtenerTurno());
    console.log('   - Tiene turno:', this.pedidoService.tieneTurno());
    console.log('   - Cantidad items:', this.pedidoService.cantidadItems());
    console.log('   - Total pedido:', this.pedidoService.total());
  }
}