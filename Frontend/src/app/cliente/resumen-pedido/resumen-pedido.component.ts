import { Component, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { CatalogoService } from '../../services/catalogo.service';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
// ✅ AGREGAR: Imports para el diálogo
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-resumen-pedido',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PublicidadSectionComponent,
    MatDialogModule // ✅ AGREGAR
  ],
  templateUrl: './resumen-pedido.component.html',
  styleUrl: './resumen-pedido.component.scss'
})
export class ResumenPedidoComponent implements OnInit, OnDestroy {

  // ✅ Inject de servicios existentes
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private pedidoService = inject(PedidoService);
  private catalogoService = inject(CatalogoService);
  // ✅ AGREGAR: Inject del diálogo
  private dialog = inject(MatDialog);

  // ✅ Propiedades para el template
  private productosInfo: Map<number, any> = new Map();

  // ✅ Propiedades existentes
  metodoPagoSeleccionado: 'tarjeta' | 'efectivo' | null = null;
  mostrarDatosFacturacion: boolean = false;

  // ✅ NUEVO: Datos de facturación
  datosFacturacion = {
    nombreCompleto: '',
    cedula: '',
    telefono: '',
    correo: ''
  };

  // ✅ Getters para el template
  get productosCarrito(): any[] {
    return this.pedidoService.obtenerProductosParaCarrito();
  }

  get cantidadProductos(): number {
    return this.productosCarrito.length;
  }

  get totalPedido(): number {
    return this.pedidoService.total();
  }

  get cantidadItems(): number {
    return this.pedidoService.cantidadItems();
  }

  // ✅ NUEVO: Getter para obtener el turno
  get numeroTurno(): string | null {
    return this.pedidoService.obtenerTurno()?.toString() || null;
  }

  // ✅ NUEVO: Verificar si tiene turno
  get tieneTurno(): boolean {
    return this.pedidoService.tieneTurno();
  }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'fondo-home');
    this.cargarInformacionProductos();

    console.log('📋 ResumenPedidoComponent inicializado');
    console.log('📋 Productos del pedido:', this.productosCarrito);
    console.log('💰 Total del pedido:', this.totalPedido);
    console.log('🔢 Cantidad items:', this.cantidadItems);
    console.log('🎫 Número de turno:', this.numeroTurno); // ✅ NUEVO
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'fondo-home');
  }

  // ✅ Cargar información de productos
  private cargarInformacionProductos(): void {
    const productos = this.productosCarrito;
    const idsUnicos = [...new Set(productos.map(p => p.producto_id || p.menu_id).filter(id => id))];

    console.log('📥 Cargando información de productos:', idsUnicos);

    idsUnicos.forEach(id => {
      const numeroId = Number(id);

      if (numeroId && !this.productosInfo.has(numeroId)) {
        console.log(`🔍 Cargando producto ID: ${numeroId}`);

        this.catalogoService.obtenerProductoPorId(numeroId).subscribe({
          next: (producto) => {
            console.log(`✅ Información cargada para producto ${numeroId}:`, producto);
            this.productosInfo.set(numeroId, producto);
          },
          error: (error) => {
            console.error(`❌ Error cargando producto ${numeroId}:`, error);
            this.productosInfo.set(numeroId, {
              nombre: `Producto ${numeroId}`,
              imagen_url: null
            });
          }
        });
      }
    });
  }

  // ✅ Obtener nombre del producto
  obtenerNombreProducto(item: any): string {
    const id = item.producto_id || item.menu_id;
    const productoInfo = this.productosInfo.get(id);

    if (productoInfo && productoInfo.nombre) {
      return productoInfo.nombre;
    }

    return `Producto ${id}`;
  }

  // ✅ Obtener imagen del producto
  obtenerImagenProducto(item: any): string | null {
    const id = item.producto_id || item.menu_id;
    const productoInfo = this.productosInfo.get(id);

    if (productoInfo && productoInfo.imagen_url) {
      return this.catalogoService.getFullImageUrl(productoInfo.imagen_url);
    }

    return null;
  }

  // ✅ Verificar si tiene personalizaciones
  tienePersonalizaciones(item: any): boolean {
    return item.personalizacion && item.personalizacion.length > 0;
  }

  // ✅ Obtener ingredientes agregados
  obtenerIngredientesAgregados(item: any): any[] {
    if (!this.tienePersonalizaciones(item)) return [];

    return item.personalizacion.filter((p: any) => p.accion === 'agregar');
  }

  // ✅ Obtener ingredientes removidos
  obtenerIngredientesRemovidos(item: any): any[] {
    if (!this.tienePersonalizaciones(item)) return [];

    return item.personalizacion.filter((p: any) => p.accion === 'quitar');
  }

  // ✅ Obtener ingrediente por ID
  obtenerIngredientePorId(ingredienteId: number): any {
    // Implementar lógica para obtener nombre del ingrediente
    return { nombre: `Ingrediente ${ingredienteId}` };
  }

  // ✅ AGREGAR: Método faltante - irAlMenu
  irAlMenu(): void {
    console.log('🏠 Navegando al menú principal...');
    this.router.navigate(['/cliente/menu']);
  }

  // ✅ AGREGAR: Método para manejar publicidad
  onPublicidadCambio(publicidad: any): void {
    console.log('📢 Publicidad cambiada:', publicidad);
  }

  // ✅ AGREGAR: Calcular subtotal
  calcularSubtotal(): number {
    return this.totalPedido / 1.15; // Quitar el 15% de IVA
  }

  // ✅ AGREGAR: Calcular IVA
  calcularIVA(): number {
    return this.calcularSubtotal() * 0.15;
  }

  // ✅ AGREGAR: Seleccionar método de pago
  seleccionarMetodoPago(metodo: 'tarjeta' | 'efectivo'): void {
    this.metodoPagoSeleccionado = metodo;
    console.log('💳 Método de pago seleccionado:', metodo);
  }

  // ✅ AGREGAR: Toggle datos de facturación
  toggleDatosFacturacion(): void {
    this.mostrarDatosFacturacion = !this.mostrarDatosFacturacion;
  }

  // ✅ NUEVO: Cancelar pedido completamente (limpiar carrito)
  cancelarPedido(): void {
    console.log('🗑️ Solicitando confirmación para cancelar pedido completo...');

    // ✅ NUEVO: Abrir diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: 'PEDIDO COMPLETO',
        action: 'delete',
        context: 'pedido' // ✅ Contexto específico para pedido
      }
    });

    // ✅ NUEVO: Manejar la respuesta del diálogo
    dialogRef.afterClosed().subscribe(result => {
      console.log('🎯 Respuesta del diálogo de cancelación:', result);

      if (result === true) {
        // ✅ Usuario confirmó → Cancelar pedido completo
        console.log('✅ Confirmado: Cancelando pedido completo...');

        // ✅ LIMPIAR completamente el carrito
        this.pedidoService.limpiarCarrito();

        console.log('🗑️ Carrito limpiado completamente');
        console.log('🏠 Regresando al menú principal...');

        // ✅ Regresar al menú principal
        this.router.navigate(['/cliente/menu']);

      } else {
        // ✅ Usuario canceló → No hacer nada
        console.log('❌ Cancelado: El pedido permanece activo');
      }
    });
  }

  // ✅ NUEVO: Editar pedido (ir al carrito para modificar)
  editarPedido(): void {
    console.log('✏️ Editando pedido...');
    console.log('🔙 Volviendo al carrito para modificar...');

    // ✅ Regresar al carrito para editar
    this.router.navigate(['/cliente/carrito']);
  }

  // ✅ MODIFICAR: Confirmar pedido con método de pago
  confirmarPedido(): void {
    if (!this.metodoPagoSeleccionado) {
      alert('Por favor selecciona un método de pago');
      return;
    }

    // ✅ VALIDAR datos de facturación si están habilitados
    if (!this.validarDatosFacturacion()) {
      return;
    }

    console.log('✅ Confirmando pedido...');
    console.log('💳 Método de pago:', this.metodoPagoSeleccionado);
    console.log('💰 Total a cobrar:', this.totalPedido);

    // ✅ PREPARAR queryParams con el MONTO REAL del carrito
    const queryParams: any = {
      tipo: this.metodoPagoSeleccionado,
      monto: this.totalPedido.toFixed(2), // ✅ MONTO REAL DEL CARRITO
      orden: this.generarNumeroOrden(),
      productos: this.cantidadItems,
      subtotal: this.calcularSubtotal().toFixed(2),
      iva: this.calcularIVA().toFixed(2)
    };

    // ✅ AGREGAR datos de turno si existe
    if (this.tieneTurno) {
      queryParams.turno = this.numeroTurno;
      console.log('🎫 Incluye turno:', this.numeroTurno);
    }

    // ✅ AGREGAR datos de facturación si están completos
    if (this.mostrarDatosFacturacion) {
      queryParams.facturacion = JSON.stringify(this.datosFacturacion);
      console.log('📄 Datos de facturación:', this.datosFacturacion);
    }

    console.log('📋 Enviando a InstruccionPago con parámetros:', queryParams);

    // ✅ NAVEGAR a instrucción de pago CON TODOS LOS DATOS
    this.router.navigate(['/cliente/instruccion-pago'], {
      queryParams
    });
  }

  // ✅ AGREGAR: Generar número de orden
  private generarNumeroOrden(): string {
    return Math.floor(Math.random() * 1000 + 1).toString().padStart(3, '0');
  }

  // ✅ Método para debug
  verificarDatos(): void {
    console.log('🔍 VERIFICACIÓN RESUMEN PEDIDO:');
    console.log('   - Productos:', this.productosCarrito);
    console.log('   - Cantidad productos:', this.cantidadProductos);
    console.log('   - Total pedido:', this.totalPedido);
    console.log('   - Cantidad items:', this.cantidadItems);
    console.log('   - Detalles raw:', this.pedidoService.detalles());
  }

  // ✅ AGREGAR: Método para validar datos de facturación
  validarDatosFacturacion(): boolean {
    if (!this.mostrarDatosFacturacion) {
      return true; // Si no requiere facturación, es válido
    }

    const { nombreCompleto, cedula, telefono, correo } = this.datosFacturacion;

    if (!nombreCompleto.trim() || !cedula.trim() || !telefono.trim() || !correo.trim()) {
      alert('Por favor completa todos los campos de facturación');
      return false;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      alert('Por favor ingresa un correo electrónico válido');
      return false;
    }

    return true;
  }
}
