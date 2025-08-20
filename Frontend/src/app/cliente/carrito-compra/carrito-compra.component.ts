import { Component, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { PublicidadService } from '../../services/publicidad.service';
import { CatalogoService } from '../../services/catalogo.service';
import { PublicidadSectionComponent } from '../../shared/publicidad-section/publicidad-section.component';
import { Publicidad } from '../../models/marketing.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TurnoConfirmationDialogComponent } from '../../shared/turno-confirmation-dialog/turno-confirmation-dialog.component';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-carrito-compra',
  standalone: true,
  imports: [
    CommonModule,
    PublicidadSectionComponent,
    MatDialogModule, // ✅ AGREGAR
    MatIconModule // ✅ AGREGAR
  ],
  templateUrl: './carrito-compra.component.html',
  styleUrl: './carrito-compra.component.scss'
})
export class CarritoCompraComponent implements OnInit, OnDestroy {

  private router = inject(Router);
  private renderer = inject(Renderer2);
  private pedidoService = inject(PedidoService);
  private publicidadService = inject(PublicidadService);
  private catalogoService = inject(CatalogoService);
  private dialog = inject(MatDialog);
  ingredientes: any[] = [];
  ingredientesCargados: boolean = false; // ✅ AGREGAR flag de estado
  private ingredientesProductos: Map<number, any[]> = new Map(); // ✅ AGREGAR cache de ingredientes base por producto

  get productosCarrito(): any[] {
    const productos = this.pedidoService.obtenerProductosParaCarrito();
    return productos;
  }

  get totalPedido(): number {
    return this.pedidoService.total() || 0;
  }

  get cantidadProductos(): number {
    return this.productosCarrito.length;
  }

  private productosInfo: Map<number, any> = new Map();
  private menusInfo: Map<number, any> = new Map();

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'fondo-home');

    this.cargarInformacionProductos();
    this.cargarIngredientes(); // <-- Cargar ingredientes al iniciar

  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'fondo-home');
  }

  volverAlMenu(): void {
    this.router.navigate(['/cliente/menu']);
  }

  finalizarPedido(): void {
    if (this.cantidadProductos === 0) {
      return;
    }


    const tipoEntrega = this.pedidoService.tipoEntrega();

    if (tipoEntrega === 'servir') {
      this.mostrarPopupTurno();
    } else if (tipoEntrega === 'llevar') {
      this.irDirectoAlResumen();
    } else {
      this.mostrarPopupTurno();
    }
  }

  private mostrarPopupTurno(): void {

    const dialogRef = this.dialog.open(TurnoConfirmationDialogComponent, {
      width: '450px',
      disableClose: true,
      panelClass: 'turno-dialog-panel',
      hasBackdrop: true,
      autoFocus: true,
      restoreFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result === true) {
        this.router.navigate(['/cliente/turno']);
      } else if (result === false) {
        this.router.navigate(['/cliente/resumen-pedido']);
      } else {
      }
    });
  }

  private irDirectoAlResumen(): void {
    this.router.navigate(['/cliente/resumen-pedido']);
  }

  onPublicidadCambio(publicidad: Publicidad): void {
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

  tienePersonalizaciones(item: any): boolean {
    return (item.personalizacion && item.personalizacion.length > 0) ||
           (item.productos && item.productos.length > 0); // Para menús
  }


  calcularPrecioTotalProducto(item: any): number {
    return item.subtotal || (item.precio_unitario * item.cantidad);
  }

  aumentarCantidad(index: number): void {
    this.pedidoService.aumentarCantidadProducto(index);
  }

  disminuirCantidad(index: number): void {
    const item = this.productosCarrito[index];
    if (item && item.cantidad > 1) {
      this.pedidoService.disminuirCantidadProducto(index);
    }
  }

  eliminarProducto(index: number): void {
    const productos = this.productosCarrito;
    const item = productos[index];

    if (!item) {
      return;
    }

    const nombreProducto = this.obtenerNombreProducto(item);

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: 'producto',
        action: 'delete',
        context: 'carrito',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {

      if (result === true) {
        this.pedidoService.eliminarProducto(index);
      } else {
      }
    });
  }

  get cantidadProductosFooter(): number {
    return this.pedidoService.cantidadItems() || 0;
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
            // ✅ CARGAR ingredientes base del producto
            this.cargarIngredientesBaseProducto(numeroId);
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


  private cargarIngredientes(): void {
    this.catalogoService.getIngredientes().subscribe({
      next: (ingredientes) => {
        this.ingredientes = ingredientes;
        this.ingredientesCargados = true; // ✅ MARCAR como cargados
      },
      error: (error) => {
        this.ingredientes = [];
        this.ingredientesCargados = true; // ✅ MARCAR como cargados aunque haya error
      }
    });
  }

  // Obtener ingrediente por ID real
  obtenerIngredientePorId(ingredienteId: number): any {
    // Si los ingredientes aún no se han cargado, mostrar placeholder
    if (!this.ingredientesCargados) {
      return { nombre: '...' }; // ✅ PLACEHOLDER mientras se cargan
    }
    
    const ingrediente = this.ingredientes.find(i => Number(i.id) === Number(ingredienteId));
    if (!ingrediente) {
      return { nombre: `ingrediente desconocido (${ingredienteId})` };
    }
    return ingrediente;
  }

  // Agrupa las personalizaciones por ingrediente y cuenta las cantidades (solo ingredientes agregados)
  obtenerPersonalizacionesAgrupadas(personalizaciones: any[]): any[] {
    const agrupadas = new Map();
    
    // Solo procesar ingredientes agregados
    personalizaciones
      .filter(p => p.accion === 'agregar')
      .forEach(p => {
        const key = p.ingrediente_id;
        
        if (agrupadas.has(key)) {
          agrupadas.get(key).cantidad += 1;
        } else {
          agrupadas.set(key, {
            ingrediente_id: p.ingrediente_id,
            accion: p.accion,
            cantidad: 1,
            precio_aplicado: p.precio_aplicado
          });
        }
      });
    
    return Array.from(agrupadas.values());
  }

  // ✅ NUEVO MÉTODO: Obtener solo ingredientes completamente nuevos (no incluidos originalmente)
  obtenerIngredientesExtrasReales(personalizaciones: any[], productoId: number): any[] {
    if (!this.ingredientesCargados || !productoId) {
      console.log('🚫 Ingredientes no cargados o productoId inválido');
      return [];
    }

    const ingredientesBase = this.ingredientesProductos.get(productoId) || [];
    const idsIngredientesBase = new Set(ingredientesBase.map(ing => Number(ing.id)));
    
    console.log(`🔍 Producto ${productoId}:`, {
      ingredientesBase,
      idsIngredientesBase: Array.from(idsIngredientesBase),
      personalizaciones
    });
    
    const agrupadas = new Map();
    
    // Solo procesar ingredientes agregados que NO están en los ingredientes base
    personalizaciones
      .filter(p => {
        const esAgregar = p.accion === 'agregar';
        const noEsBase = !idsIngredientesBase.has(Number(p.ingrediente_id));
        console.log(`🔍 Ingrediente ${p.ingrediente_id}: accion=${p.accion}, esAgregar=${esAgregar}, noEsBase=${noEsBase}`);
        return esAgregar && noEsBase;
      })
      .forEach(p => {
        const key = p.ingrediente_id;
        
        if (agrupadas.has(key)) {
          agrupadas.get(key).cantidad += 1;
        } else {
          agrupadas.set(key, {
            ingrediente_id: p.ingrediente_id,
            accion: p.accion,
            cantidad: 1,
            precio_aplicado: p.precio_aplicado
          });
        }
      });
    
    const resultado = Array.from(agrupadas.values());
    console.log(`✅ Ingredientes extras reales para producto ${productoId}:`, resultado);
    return resultado;
  }

  // ✅ NUEVO MÉTODO: Cargar ingredientes base de un producto
  private cargarIngredientesBaseProducto(productoId: number): void {
    if (this.ingredientesProductos.has(productoId)) {
      return; // Ya cargado
    }

    this.catalogoService.getIngredientesPorProducto(productoId).subscribe({
      next: (response) => {
        console.log(`🔍 Ingredientes cargados para producto ${productoId}:`, response);
        // Extraer solo ingredientes base (seleccionados) del response
        const ingredientesBase = (response.ingredientes || []).filter((ing: any) => ing.seleccionado);
        console.log(`📦 Ingredientes base del producto ${productoId}:`, ingredientesBase);
        this.ingredientesProductos.set(productoId, ingredientesBase);
      },
      error: (error) => {
        console.warn(`Error cargando ingredientes base del producto ${productoId}:`, error);
        this.ingredientesProductos.set(productoId, []);
      }
    });
  }

  // Obtener información del tamaño si existe
  obtenerInfoTamano(item: any): string | null {
    if (item.tamano_codigo) {
      // Convertir código de tamaño a descripción legible
      const codigo = item.tamano_codigo.toLowerCase();
      
      switch (codigo) {
        case 'p': case 'pequeno': case 'pequeño': return 'Pequeño';
        case 'm': case 'mediano': return 'Mediano';
        case 'g': case 'grande': return 'Grande';
        case 'xl': case 'extragrand': case 'extra_grande': return 'Extra Grande';
        default: return item.tamano_codigo.toUpperCase();
      }
    }
    return null;
  }

  personalizarProducto(item: any, index: number): void {
    if (!item.producto_id) {
      alert('Los menús no se pueden personalizar individualmente');
      return;
    }


    const productosCarrito = this.pedidoService.obtenerProductosParaCarrito();
    const productoReal = productosCarrito[index];

    if (!productoReal) {
      return;
    }

    // Guardar datos del producto actual para comparación
    const datosActuales = {
      producto_id: productoReal.producto_id,
      personalizacion: productoReal.personalizacion || [],
      precio_unitario: productoReal.precio_unitario,
      precio_base: productoReal.precio_base || productoReal.precio_unitario, // ✅ AGREGAR precio base sin personalizaciones
      cantidad: productoReal.cantidad,
      carritoIndex: index,
      subtotal: productoReal.subtotal,
      tamano_codigo: productoReal.tamano_codigo // ✅ AGREGAR código de tamaño
    };

    console.log('Navegando a personalización con modo edición:', {
      productoId: productoReal.producto_id,
      carritoIndex: index,
      cantidad: productoReal.cantidad,
      precio_unitario: productoReal.precio_unitario,
      precio_base: productoReal.precio_base || productoReal.precio_unitario,
      tamano_codigo: productoReal.tamano_codigo
    });

    this.router.navigate(['/cliente/personalizar-producto', productoReal.producto_id], {
      queryParams: {
        modo: 'editar',
        carritoIndex: index,
        cantidad: productoReal.cantidad,
        precio: productoReal.precio_base || productoReal.precio_unitario, // ✅ USAR precio base sin personalizaciones
        precio_personalizado: productoReal.precio_unitario, // ✅ AGREGAR precio personalizado actual
        nombre: this.obtenerNombreProducto(productoReal),
        tamano_codigo: productoReal.tamano_codigo // ✅ AGREGAR código de tamaño
      },
      state: {
        datosActuales: datosActuales
      }
    });
  }



}
