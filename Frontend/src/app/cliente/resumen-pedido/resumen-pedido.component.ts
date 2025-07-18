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
import { Subscription } from 'rxjs'; // ✅ AGREGAR
// ✅ AGREGAR: Importar los nuevos modelos
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
  // ✅ Inject de servicios existentes
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private pedidoService = inject(PedidoService);
  private catalogoService = inject(CatalogoService);
  // ✅ AGREGAR: Inject del diálogo
  private dialog = inject(MatDialog);

  // ✅ Propiedades para el template
  private productosInfo: Map<number, any> = new Map();
  private menusInfo: Map<number, any> = new Map();

  // ✅ Propiedades existentes
  metodoPagoSeleccionado: 'tarjeta' | 'efectivo' | null = null;
  mostrarDatosFacturacion: boolean = false;

  // ✅ NUEVO: Datos de facturación
  datosFacturacion = {
    nombreCompleto: '',
    cedula: '',
    telefono: '',
    correo: '',
  };

  // ✅ AGREGAR: Variables para IVA dinámico
  ivaActual: number = 15.0; // Valor por defecto
  ivaSubscription?: Subscription;
  cargandoIva = true;

  // ✅ AGREGAR: Estado de guardado
  guardandoPedido = false;

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

  // ✅ AGREGAR: Método para obtener el texto del IVA
  getTextoIva(): string {
    if (this.cargandoIva) return 'Cargando...';
    return `IVA ${this.ivaActual}%`;
  }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'fondo-home');
    this.cargarInformacionProductos();
    this.cargarIvaActual(); // ✅ AGREGAR: Cargar IVA dinámico

    console.log('📋 ResumenPedidoComponent inicializado');
    console.log('📋 Productos del pedido:', this.productosCarrito);
    console.log('💰 Total del pedido:', this.totalPedido);
    console.log('🔢 Cantidad items:', this.cantidadItems);
    console.log('🎫 Número de turno:', this.numeroTurno); // ✅ NUEVO
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'fondo-home');
    // ✅ AGREGAR: Limpiar suscripción
    if (this.ivaSubscription) {
      this.ivaSubscription.unsubscribe();
    }
  }

  // ✅ Cargar información de productos
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

  // ✅ Obtener nombre del producto o menú
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

  // ✅ Obtener imagen del producto o menú
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

  // ✅ ARREGLAR: Método calcularSubtotal
  calcularSubtotal(): number {
    if (this.cargandoIva) return 0;

    // ✅ CORRECTO: El subtotal es la suma de subtotales de productos SIN IVA
    // Los precios de productos ya están sin IVA en la base de datos
    return this.productosCarrito.reduce((total, item) => {
      return total + item.precio_unitario * item.cantidad;
    }, 0);
  }

  // ✅ ARREGLAR: Método calcularIVA basado en subtotal correcto
  calcularIVA(): number {
    if (this.cargandoIva) return 0;

    const subtotal = this.calcularSubtotal();
    return subtotal * (this.ivaActual / 100);
  }

  // ✅ NUEVO: Método para calcular total
  calcularTotal(): number {
    const subtotal = this.calcularSubtotal();
    const iva = this.calcularIVA();
    return subtotal + iva;
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
        context: 'pedido', // ✅ Contexto específico para pedido
      },
    });

    // ✅ NUEVO: Manejar la respuesta del diálogo
    dialogRef.afterClosed().subscribe((result) => {
      console.log('🎯 Respuesta del diálogo de cancelación:', result);

      if (result === true) {
        // ✅ Usuario confirmó → Cancelar pedido completo
        console.log('✅ Confirmado: Cancelando pedido completo...');
        console.log('🏠 Regresando al home...');

        // ✅ Regresar al home
        this.router.navigate(['/cliente/home']);
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

    // Solo valida datos de facturación si el checkbox está marcado
    if (this.mostrarDatosFacturacion && !this.validarDatosFacturacion()) {
      return;
    }

    console.log('✅ Iniciando proceso de guardado del pedido...');
    this.guardarPedidoEnBaseDatos();
  }

  // ✅ NUEVO: Método principal para guardar el pedido
  private guardarPedidoEnBaseDatos(): void {
    this.guardandoPedido = true;

    // 1. Preparar la estructura de datos
    const pedidoData = this.prepararDatosPedido();

    console.log('📤 Enviando pedido al backend:', pedidoData);

    // 2. Enviar al backend
    this.catalogoService.crearPedido(pedidoData).subscribe({
      next: (response) => {
        console.log('✅ Pedido guardado exitosamente:', response);
        this.manejarPedidoExitoso(response);
      },
      error: (error) => {
        console.error('❌ Error al guardar pedido:', error);
        this.manejarErrorPedido(error);
      },
      complete: () => {
        this.guardandoPedido = false;
      },
    });
  }

  // ✅ NUEVO: Preparar estructura de datos para enviar
  private prepararDatosPedido(): PedidoRequest {
    // Obtener datos básicos
    const tipoEntrega = this.pedidoService.tipoEntrega() || 'servir';
    const numeroMesa = this.obtenerNumeroMesa();

    // Preparar productos con personalizaciones
    const productos = this.prepararProductosPedido();

    // ✅ USAR LOS MÉTODOS CORREGIDOS
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

    console.log('💰 VALORES CALCULADOS CORREGIDOS:');
    console.log(`   - Subtotal: ${subtotal} (suma de productos sin IVA)`);
    console.log(`   - IVA (${this.ivaActual}%): ${ivaValor}`);
    console.log(`   - Total: ${total} (subtotal + IVA)`);
    console.log(`   - Total del pedido service: ${this.totalPedido}`);

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

  // ✅ MODIFICAR: Método prepararProductosPedido
  private prepararProductosPedido(): ProductoPedidoRequest[] {
    return this.productosCarrito.map((item) => {
      const subtotalProducto = Math.round(item.precio_unitario * item.cantidad * 100) / 100;

      // Preparar personalizaciones (solo para productos, no para menús)
      const personalizaciones: PersonalizacionRequest[] = [];

      // ✅ NUEVO: Solo agregar personalizaciones para productos individuales
      if (item.tipo === 'producto' && item.personalizacion && Array.isArray(item.personalizacion)) {
        item.personalizacion.forEach((p: any) => {
          personalizaciones.push({
            ingrediente_id: p.ingrediente_id,
            accion: p.accion,
            precio_aplicado: p.precio_aplicado || 0,
          });
        });
      }

      // ✅ NUEVO: Estructura base
      const productoBase = {
        cantidad: item.cantidad,
        precio_unitario: Math.round(item.precio_unitario * 100) / 100,
        subtotal: subtotalProducto,
        personalizaciones: personalizaciones,
      };

      // ✅ NUEVO: Agregar producto_id O menu_id según el tipo
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

      // ✅ FALLBACK: Asumir producto si no está especificado
      return {
        ...productoBase,
        producto_id: item.producto_id,
      };
    });
  }

  // ✅ NUEVO: Obtener número de mesa
  private obtenerNumeroMesa(): number {
    const tipoEntrega = this.pedidoService.tipoEntrega() || 'servir';

    console.log('🏠 OBTENIENDO NÚMERO DE MESA:');
    console.log(`   - Tipo de entrega: ${tipoEntrega}`);

    if (tipoEntrega === 'llevar') {
      // ✅ PARA LLEVAR: No necesita mesa
      console.log('   - Para llevar: mesa = 0 (no aplica)');
      return 0;
    }

    if (tipoEntrega === 'servir') {
      // ✅ PARA SERVIR: Verificar si tiene turno
      const turno = this.pedidoService.obtenerTurno();

      if (turno && turno > 0) {
        // ✅ TIENE TURNO: Usar el número de turno como mesa
        console.log(`   - Para servir CON turno: mesa = ${turno}`);
        return turno;
      } else {
        // ✅ SIN TURNO: También usar 0 (NULL en BD)
        console.log('   - Para servir SIN turno: mesa = 0 (NULL en BD)');
        return 0;
      }
    }

    // ✅ FALLBACK: También 0
    console.log('   - Fallback: mesa = 0');
    return 0;
  }

  // ✅ MODIFICAR: Manejar respuesta exitosa SIN LIMPIAR CARRITO
  private manejarPedidoExitoso(response: any): void {
    if (response.success && response.data) {
      console.log('🎉 Pedido creado con ID:', response.data.pedido_id);

      // ✅ CALCULAR VALORES ANTES DE NAVEGACIÓN
      const subtotalCalculado = this.calcularSubtotal();
      const ivaCalculado = this.calcularIVA();
      const totalCalculado = this.calcularTotal();

      console.log('💰 VALORES CALCULADOS PARA PAGO:');
      console.log(`   - Subtotal: ${subtotalCalculado.toFixed(2)}`);
      console.log(`   - IVA: ${ivaCalculado.toFixed(2)}`);
      console.log(`   - Total: ${totalCalculado.toFixed(2)}`);

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

      console.log('📋 Query params preparados:', queryParams);

      // ❌ NO LIMPIAR CARRITO AQUÍ - Solo después de confirmar pago
      // this.pedidoService.limpiarCarrito();

      // ✅ GUARDAR INFO DEL PEDIDO CREADO EN EL SERVICIO PARA REFERENCIA
      this.pedidoService.setPedidoCreado({
        id: response.data.pedido_id,
        numero: response.data.numero_pedido,
        estado: 'pendiente_pago'
      });

      console.log('🚀 Navegando a instrucción de pago (carrito conservado para posible cancelación)');

      this.router.navigate(['/cliente/instruccion-pago'], {
        queryParams,
      });
    } else {
      throw new Error(response.message || 'Error desconocido al crear pedido');
    }
  }

  // ✅ NUEVO: Manejar errores
  private manejarErrorPedido(error: any): void {
    let mensajeError =
      'Error al procesar el pedido. Por favor intenta nuevamente.';

    if (error.error && error.error.message) {
      mensajeError = error.error.message;
    } else if (error.message) {
      mensajeError = error.message;
    }

    alert(mensajeError);
    console.error('❌ Error detallado:', error);
  }

  // ✅ AGREGAR: Generar número de orden
  private generarNumeroOrden(): string {
    return Math.floor(Math.random() * 1000 + 1)
      .toString()
      .padStart(3, '0');
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

  // ✅ NUEVO: Método para cargar el IVA actual
  cargarIvaActual(): void {
    this.cargandoIva = true;

    this.ivaSubscription = this.catalogoService.getIvaActual().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ivaActual = response.data.porcentaje_iva;
          console.log(`✅ IVA dinámico cargado: ${this.ivaActual}%`);
        } else {
          console.warn('⚠️ No se encontró IVA activo, usando 15% por defecto');
          this.ivaActual = 15.0;
        }
        this.cargandoIva = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar IVA:', error);
        console.warn('⚠️ Error cargando IVA, usando 15% por defecto');
        this.ivaActual = 15.0;
        this.cargandoIva = false;
      },
    });
  }

  imprimirFacturaPrueba(): void {
    // Prepara los datos igual que para el pedido real
    const factura = {
      pedido_id: 'PRUEBA-' + Date.now(),
      cliente: this.datosFacturacion.nombreCompleto || 'Consumidor Final',
      productos: this.productosCarrito.map(p => ({
        nombre: this.obtenerNombreProducto(p),
        cantidad: p.cantidad,
        precio: p.precio_unitario
      })),
      subtotal: this.calcularSubtotal(),
      iva: this.calcularIVA(),
      total: this.calcularTotal()
    };

    // ✅ NUEVO: Impresión desde frontend usando window.print()
    this.imprimirFacturaFrontend(factura);

    // ✅ ALTERNATIVO: Impresión vía servicio local (comentado)
    /*
    fetch('http://localhost:8000/api/impresion/factura/imprimir/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(factura)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('🖨️ Factura de prueba enviada a la impresora');
      } else {
        alert('❌ Error imprimiendo: ' + data.error);
      }
    });
    */
  }

  // ✅ NUEVO: Método para imprimir desde frontend
  private imprimirFacturaFrontend(factura: any): void {
    console.log('🖨️ Imprimiendo factura desde frontend...', factura);

    // Crear ventana nueva para impresión (oculta)
    const printWindow = window.open('', '_blank', 'width=1,height=1,scrollbars=no,resizable=no');
    
    if (!printWindow) {
      alert('❌ Error: No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada.');
      return;
    }

    // Generar HTML de la factura
    const facturaHTML = this.generarHTMLFactura(factura);
    
    // Escribir contenido en la ventana
    printWindow.document.write(facturaHTML);
    printWindow.document.close();

    // ✅ MEJORADO: Detectar si es modo kiosco o navegador normal
    const isKioskMode = window.outerHeight === screen.height && window.outerWidth === screen.width;
    
    // Esperar a que cargue completamente y luego imprimir
    printWindow.onload = () => {
      // ✅ AUTOMÁTICO: Imprimir directamente sin mostrar ventana
      console.log('🖨️ Imprimiendo automáticamente...');
      printWindow.print();
      
      // ✅ CERRAR VENTANA INMEDIATAMENTE DESPUÉS DE ENVIAR A IMPRIMIR
      setTimeout(() => {
        printWindow.close();
        console.log('✅ Ventana de impresión cerrada');
      }, 500);
    };
  }

  // ✅ NUEVO: Generar HTML optimizado para impresión térmica
  private generarHTMLFactura(factura: any): string {
    const fecha = new Date().toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Factura - ${factura.pedido_id}</title>
  <style>
    /* ✅ ESTILOS OPTIMIZADOS PARA IMPRESORA TÉRMICA */
    @page {
      size: 80mm auto; /* Ancho típico impresora térmica */
      margin: 2mm;
    }
    
    @media print {
      body { 
        margin: 0;
        padding: 0;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.2;
        color: black;
        background: white;
      }
      
      /* ✅ OCULTAR ELEMENTOS DEL NAVEGADOR */
      .no-print { display: none !important; }
      @page { margin: 0; }
      
      /* ✅ FORZAR IMPRESIÓN INMEDIATA */
      html, body {
        width: 80mm;
        height: auto;
        overflow: hidden;
      }
    }
    
    body {
      width: 80mm;
      margin: 0 auto;
      padding: 5mm;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.2;
    }
    
    .header {
      text-align: center;
      border-bottom: 1px dashed #000;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }
    
    .logo {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 3px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }
    
    .productos {
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 5px 0;
      margin: 8px 0;
    }
    
    .producto {
      margin: 3px 0;
    }
    
    .producto-line {
      display: flex;
      justify-content: space-between;
    }
    
    .totales {
      text-align: right;
      margin-top: 8px;
    }
    
    .total-final {
      font-weight: bold;
      font-size: 13px;
      border-top: 1px solid #000;
      padding-top: 3px;
      margin-top: 3px;
    }
    
    .footer {
      text-align: center;
      font-size: 10px;
      margin-top: 10px;
      border-top: 1px dashed #000;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">KIOSKO TOUCH</div>
    <div>RUC: 1791310199001</div>
    <div>Factura Simplificada</div>
  </div>
  
  <div class="info-row">
    <span>Fecha:</span>
    <span>${fecha}</span>
  </div>
  
  <div class="info-row">
    <span>Orden:</span>
    <span>${factura.pedido_id}</span>
  </div>
  
  <div class="info-row">
    <span>Cliente:</span>
    <span>${factura.cliente}</span>
  </div>
  
  <div class="productos">
    <div style="font-weight: bold; margin-bottom: 5px;">PRODUCTOS:</div>
    ${factura.productos.map((p: any) => `
      <div class="producto">
        <div class="producto-line">
          <span>${p.nombre}</span>
        </div>
        <div class="producto-line">
          <span>${p.cantidad} x $${p.precio.toFixed(2)}</span>
          <span>$${(p.cantidad * p.precio).toFixed(2)}</span>
        </div>
      </div>
    `).join('')}
  </div>
  
  <div class="totales">
    <div class="info-row">
      <span>Subtotal:</span>
      <span>$${factura.subtotal.toFixed(2)}</span>
    </div>
    
    <div class="info-row">
      <span>IVA (${this.ivaActual}%):</span>
      <span>$${factura.iva.toFixed(2)}</span>
    </div>
    
    <div class="info-row total-final">
      <span>TOTAL:</span>
      <span>$${factura.total.toFixed(2)}</span>
    </div>
  </div>
  
  <div class="footer">
    <div>¡Gracias por su compra!</div>
    <div>Kiosco de Autoservicio</div>
    <div>${fecha}</div>
  </div>

  <script>
    // ✅ AUTO-IMPRIMIR AL CARGAR - ACTIVADO PARA MODO AUTOMÁTICO
    window.onload = function() {
      // ✅ IMPRIMIR INMEDIATAMENTE SIN MOSTRAR VISTA PREVIA
      setTimeout(() => {
        window.print();
        // ✅ CERRAR VENTANA DESPUÉS DE ENVIAR A IMPRESORA
        setTimeout(() => {
          window.close();
        }, 100);
      }, 100);
    };
  </script>
</body>
</html>`;
  }

}
