import { Component, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { CatalogoService } from '../../services/catalogo.service';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { Subscription } from 'rxjs';
import {
  PedidoRequest,
  ProductoPedidoRequest,
  PersonalizacionRequest,
  DatosFacturacion,
} from '../../models/pedido-request.models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-resumen-pedido',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PublicidadSectionComponent,
    MatDialogModule,
    MatIconModule,
  ],
  templateUrl: './resumen-pedido.component.html',
  styleUrl: './resumen-pedido.component.scss',
})
export class ResumenPedidoComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private pedidoService = inject(PedidoService);
  private catalogoService = inject(CatalogoService);
  private dialog = inject(MatDialog);

  private productosInfo: Map<number, any> = new Map();
  private menusInfo: Map<number, any> = new Map();

  metodoPagoSeleccionado: 'tarjeta' | 'efectivo' | null = null;
  mostrarDatosFacturacion: boolean = false;

  datosFacturacion = {
    nombreCompleto: '',
    cedula: '',
    telefono: '',
    correo: '',
  };

  ivaActual: number = 15.0; // Valor por defecto
  ivaSubscription?: Subscription;
  cargandoIva = true;

  guardandoPedido = false;

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

  get numeroTurno(): string | null {
    return this.pedidoService.obtenerTurno()?.toString() || null;
  }

  get tieneTurno(): boolean {
    return this.pedidoService.tieneTurno();
  }

  getTextoIva(): string {
    if (this.cargandoIva) return 'Cargando...';
    return `IVA ${this.ivaActual}%`;
  }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'fondo-home');
    this.cargarInformacionProductos();
    this.cargarIvaActual();

  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'fondo-home');
    if (this.ivaSubscription) {
      this.ivaSubscription.unsubscribe();
    }
  }

  private cargarInformacionProductos(): void {
    const productos = this.productosCarrito;
    const idsProductos = [...new Set(productos.filter(p => p.tipo === 'producto').map(p => p.producto_id).filter(id => id))];
    const idsMenus = [...new Set(productos.filter(p => p.tipo === 'menu').map(p => p.menu_id).filter(id => id))];

    // Cargar productos
    idsProductos.forEach(id => {
      const numeroId = Number(id);
      if (numeroId && !this.productosInfo.has(numeroId)) {
        this.catalogoService.obtenerProductoPorId(numeroId).subscribe({
          next: (producto) => {
            this.productosInfo.set(numeroId, producto);
          },
          error: (error) => {
            this.productosInfo.set(numeroId, {
              nombre: `Producto ${numeroId}`,
              imagen_url: null
            });
          }
        });
      }
    });

    // Cargar menús
    idsMenus.forEach(id => {
      const numeroId = Number(id);
      if (numeroId && !this.menusInfo.has(numeroId)) {
        this.catalogoService.obtenerMenuPorId(numeroId).subscribe({
          next: (menu) => {
            this.menusInfo.set(numeroId, menu);
          },
          error: (error) => {
            this.menusInfo.set(numeroId, {
              nombre: `Menú ${numeroId}`,
              imagen_url: null
            });
          }
        });
      }
    });
  }

  obtenerNombreProducto(item: any): string {
    if (item.tipo === 'menu') {
      const id = item.menu_id;
      const menuInfo = this.menusInfo.get(id);
      if (menuInfo && menuInfo.nombre) {
        return menuInfo.nombre;
      }
      return `Menú ${id}`;
    } else {
      const id = item.producto_id;
      const productoInfo = this.productosInfo.get(id);
      if (productoInfo && productoInfo.nombre) {
        return productoInfo.nombre;
      }
      return `Producto ${id}`;
    }
  }

  obtenerImagenProducto(item: any): string | null {
    if (item.tipo === 'menu') {
      const id = item.menu_id;
      const menuInfo = this.menusInfo.get(id);
      if (menuInfo && menuInfo.imagen_url) {
        return this.catalogoService.getFullImageUrl(menuInfo.imagen_url);
      }
      return null;
    } else {
      const id = item.producto_id;
      const productoInfo = this.productosInfo.get(id);
      if (productoInfo && productoInfo.imagen_url) {
        return this.catalogoService.getFullImageUrl(productoInfo.imagen_url);
      }
      return null;
    }
  }

  tienePersonalizaciones(item: any): boolean {
    return item.personalizacion && item.personalizacion.length > 0;
  }

  obtenerIngredientesAgregados(item: any): any[] {
    if (!this.tienePersonalizaciones(item)) return [];

    return item.personalizacion.filter((p: any) => p.accion === 'agregar');
  }

  obtenerIngredientesRemovidos(item: any): any[] {
    if (!this.tienePersonalizaciones(item)) return [];

    return item.personalizacion.filter((p: any) => p.accion === 'quitar');
  }

  obtenerIngredientePorId(ingredienteId: number): any {
    // Implementar lógica para obtener nombre del ingrediente
    return { nombre: `Ingrediente ${ingredienteId}` };
  }

  irAlMenu(): void {
    this.router.navigate(['/cliente/menu']);
  }

  onPublicidadCambio(publicidad: any): void {
  }

  calcularSubtotal(): number {
    if (this.cargandoIva) return 0;

    // El subtotal es la suma de subtotales de productos SIN IVA
    // Los precios de productos ya están sin IVA en la base de datos
    return this.productosCarrito.reduce((total, item) => {
      return total + item.precio_unitario * item.cantidad;
    }, 0);
  }

  calcularIVA(): number {
    if (this.cargandoIva) return 0;

    const subtotal = this.calcularSubtotal();
    return subtotal * (this.ivaActual / 100);
  }

  calcularTotal(): number {
    const subtotal = this.calcularSubtotal();
    const iva = this.calcularIVA();
    return subtotal + iva;
  }

  seleccionarMetodoPago(metodo: 'tarjeta' | 'efectivo'): void {
    this.metodoPagoSeleccionado = metodo;
  }

  toggleDatosFacturacion(): void {
    this.mostrarDatosFacturacion = !this.mostrarDatosFacturacion;
  }

  cancelarPedido(): void {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: 'PEDIDO COMPLETO',
        action: 'delete',
        context: 'pedido',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {

      if (result === true) {
        // Usuario confirmó → Cancelar pedido completo

        this.router.navigate(['/cliente/home']);
      } else {
      }
    });
  }

  editarPedido(): void {

    this.router.navigate(['/cliente/carrito']);
  }

  confirmarPedido(): void {
    if (!this.metodoPagoSeleccionado) {
      alert('Por favor selecciona un método de pago');
      return;
    }

    // Solo valida datos de facturación si el checkbox está marcado
    if (this.mostrarDatosFacturacion && !this.validarDatosFacturacion()) {
      return;
    }

    this.guardarPedidoEnBaseDatos();
  }

  private guardarPedidoEnBaseDatos(): void {
    this.guardandoPedido = true;

    // 1. Preparar la estructura de datos
    const pedidoData = this.prepararDatosPedido();


    // 2. Enviar al backend
    this.catalogoService.crearPedido(pedidoData).subscribe({
      next: (response) => {
        this.manejarPedidoExitoso(response);
      },
      error: (error) => {
        this.manejarErrorPedido(error);
      },
      complete: () => {
        this.guardandoPedido = false;
      },
    });
  }

  private prepararDatosPedido(): PedidoRequest {
    // Obtener datos básicos
    const tipoEntrega = this.pedidoService.tipoEntrega() || 'servir';
    const numeroMesa = this.obtenerNumeroMesa();

    // Preparar productos con personalizaciones
    const productos = this.prepararProductosPedido();

    const subtotal = Math.round(this.calcularSubtotal() * 100) / 100;
    const ivaValor = Math.round(this.calcularIVA() * 100) / 100;
    const total = Math.round(this.calcularTotal() * 100) / 100;

    const pedidoData: PedidoRequest = {
      numero_mesa: numeroMesa,
      tipo_entrega: tipoEntrega,
      tipo_pago: this.metodoPagoSeleccionado as 'efectivo' | 'tarjeta',
      productos: productos,
      subtotal: subtotal,
      iva_porcentaje: Math.round(this.ivaActual * 100) / 100,
      iva_valor: ivaValor,
      total: total,
    };


    // Agregar turno si existe
    if (this.tieneTurno && this.numeroTurno) {
      pedidoData.turno = parseInt(this.numeroTurno);
    }

    // Agregar datos de facturación si están completos
    if (
      this.mostrarDatosFacturacion &&
      this.datosFacturacion.nombreCompleto.trim()
    ) {
      pedidoData.datos_facturacion = {
        nombre_completo: this.datosFacturacion.nombreCompleto.trim(),
        cedula: this.datosFacturacion.cedula.trim(),
        telefono: this.datosFacturacion.telefono.trim(),
        correo: this.datosFacturacion.correo.trim(),
      };
    }

    return pedidoData;
  }

  private prepararProductosPedido(): ProductoPedidoRequest[] {
    return this.productosCarrito.map((item) => {
      const subtotalProducto = Math.round(item.precio_unitario * item.cantidad * 100) / 100;

      // Preparar personalizaciones (solo para productos, no para menús)
      const personalizaciones: PersonalizacionRequest[] = [];

      if (item.tipo === 'producto' && item.personalizacion && Array.isArray(item.personalizacion)) {
        item.personalizacion.forEach((p: any) => {
          personalizaciones.push({
            ingrediente_id: p.ingrediente_id,
            accion: p.accion,
            precio_aplicado: p.precio_aplicado || 0,
          });
        });
      }

      const productoBase = {
        cantidad: item.cantidad,
        precio_unitario: Math.round(item.precio_unitario * 100) / 100,
        subtotal: subtotalProducto,
        personalizaciones: personalizaciones,
      };

      if (item.tipo === 'producto') {
        return {
          ...productoBase,
          producto_id: item.producto_id,
        };
      } else if (item.tipo === 'menu') {
        return {
          ...productoBase,
          menu_id: item.menu_id,
        };
      }

      return {
        ...productoBase,
        producto_id: item.producto_id,
      };
    });
  }

  private obtenerNumeroMesa(): number {
    const tipoEntrega = this.pedidoService.tipoEntrega() || 'servir';


    if (tipoEntrega === 'llevar') {
      return 0;
    }

    if (tipoEntrega === 'servir') {
      const turno = this.pedidoService.obtenerTurno();

      if (turno && turno > 0) {
        return turno;
      } else {
        return 0;
      }
    }

    return 0;
  }

  private manejarPedidoExitoso(response: any): void {
    if (response.success && response.data) {

      const subtotalCalculado = this.calcularSubtotal();
      const ivaCalculado = this.calcularIVA();
      const totalCalculado = this.calcularTotal();


      // Preparar parámetros para navegación
      const queryParams: any = {
        tipo: this.metodoPagoSeleccionado,
        monto: totalCalculado.toFixed(2),
        orden: response.data.numero_pedido || this.generarNumeroOrden(),
        productos: this.cantidadItems,
        subtotal: subtotalCalculado.toFixed(2),
        iva: ivaCalculado.toFixed(2),
        pedido_id: response.data.pedido_id,
      };

      // Agregar datos de turno si existe
      if (this.tieneTurno) {
        queryParams.turno = this.numeroTurno;
      }

      // Agregar datos de facturación si están completos
      if (this.mostrarDatosFacturacion) {
        queryParams.facturacion = JSON.stringify(this.datosFacturacion);
        if (response.data.factura_id) {
          queryParams.factura_id = response.data.factura_id;
        }
      }


      // ❌ NO LIMPIAR CARRITO AQUÍ - Solo después de confirmar pago
      // this.pedidoService.limpiarCarrito();

      this.pedidoService.setPedidoCreado({
        id: response.data.pedido_id,
        numero: response.data.numero_pedido,
        estado: 'pendiente_pago'
      });


      this.router.navigate(['/cliente/instruccion-pago'], {
        queryParams,
      });
    } else {
      throw new Error(response.message || 'Error desconocido al crear pedido');
    }
  }

  private manejarErrorPedido(error: any): void {
    let mensajeError =
      'Error al procesar el pedido. Por favor intenta nuevamente.';

    if (error.error && error.error.message) {
      mensajeError = error.error.message;
    } else if (error.message) {
      mensajeError = error.message;
    }

    alert(mensajeError);
  }

  private generarNumeroOrden(): string {
    // Usar crypto seguro en lugar de Math.random()
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const numeroAleatorio = (array[0] % 1000) + 1;

    return numeroAleatorio.toString().padStart(3, '0');
  }

  verificarDatos(): void {
  }

  validarDatosFacturacion(): boolean {
    const { nombreCompleto, cedula, telefono, correo } = this.datosFacturacion;

    if (
      !nombreCompleto.trim() ||
      !cedula.trim() ||
      !telefono.trim() ||
      !correo.trim()
    ) {
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

  cargarIvaActual(): void {
    this.cargandoIva = true;

    this.ivaSubscription = this.catalogoService.getIvaActual().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ivaActual = response.data.porcentaje_iva;
        } else {
          this.ivaActual = 15.0;
        }
        this.cargandoIva = false;
      },
      error: (error) => {
        this.ivaActual = 15.0;
        this.cargandoIva = false;
      },
    });
  }

}
