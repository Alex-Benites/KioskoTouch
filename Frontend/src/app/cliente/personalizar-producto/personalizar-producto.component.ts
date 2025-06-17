import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogoService } from '../../services/catalogo.service';
import { PedidoService } from '../../services/pedido.service'; // ✅ AGREGAR

// ✅ Interface para ingredientes
interface IngredientePersonalizacion {
  id: number;
  nombre: string;
  imagenUrl: string;
  seleccionado: boolean;
  esOriginal: boolean; // Si venía originalmente en el producto
  precio?: number; // Por si algunos ingredientes tienen costo adicional
  cantidad: number; 
}

@Component({
  selector: 'app-personalizar-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personalizar-producto.component.html',
  styleUrls: ['./personalizar-producto.component.scss']
})
export class PersonalizarProductoComponent implements OnInit {
  // ✅ AGREGAR: Signal para controlar el estado de carga
  ingredientesCargados = signal<boolean>(false);
  cargandoIngredientes = signal<boolean>(false);

  // ✅ CORREGIR: Computed más inteligente
  tieneIngredientesPersonalizables = computed(() => {
    // Solo evaluar si ya se cargaron los ingredientes
    if (!this.ingredientesCargados()) {
      return true; // Mostrar como si tuviera ingredientes mientras carga
    }
    return this.ingredientesDisponibles.length > 0;
  });

  // ✅ CORREGIR: Computed para el mensaje
  mensajeSinIngredientes = computed(() => {
    // Solo mostrar mensaje si ya se cargaron y no hay ingredientes
    if (this.ingredientesCargados() && this.ingredientesDisponibles.length === 0) {
      return 'Este producto no tiene opciones de personalización disponibles. Se agregará tal como está en el menú.';
    }
    return '';
  });

  // ✅ NUEVO: Computed para saber si mostrar el loader
  mostrandoCarga = computed(() => {
    return this.cargandoIngredientes() || !this.ingredientesCargados();
  });

  // ✅ AGREGAR inject del PedidoService existente
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogoService = inject(CatalogoService);
  public pedidoService = inject(PedidoService); // ✅ NUEVO: usar el servicio que ya funciona

  // ✅ Propiedades del componente con signals
  productoId: number | null = null;
  cantidad = signal<number>(1);
  nombreProducto: string = '';
  precioProducto: number = 0;
  categoriaProducto: number | null = null;
  descripcionProducto: string = '';
  imagenProducto: string = '';
  nombreCategoria: string = '';

  // ✅ Ingredientes disponibles
  ingredientesDisponibles: IngredientePersonalizacion[] = [];

  // ✅ ACTUALIZAR precioTotalCalculado (línea ~75):
  precioTotalCalculado = computed(() => {
    // Precio base del producto
    const precioBase = this.precioProducto;

    // ✅ NUEVO: Calcular costo de ingredientes EXTRA (cantidades adicionales)
    const costoIngredientesExtra = this.ingredientesDisponibles.reduce((total, ing) => {
      if (ing.precio && ing.precio > 0) {
        if (ing.esOriginal) {
          // Para ingredientes originales, cobrar solo las cantidades EXTRA (más de 1)
          const cantidadExtra = Math.max(0, ing.cantidad - 1);
          return total + (cantidadExtra * ing.precio);
        } else {
          // Para ingredientes no originales, cobrar toda la cantidad
          return total + (ing.cantidad * ing.precio);
        }
      }
      return total;
    }, 0);

    // Precio unitario con ingredientes adicionales
    const precioUnitario = precioBase + costoIngredientesExtra;
    
    // Total considerando la cantidad del producto
    const precioTotal = precioUnitario * this.cantidad();

    console.log('💰 Cálculo de precio:', {
      precioBase: precioBase,
      costoIngredientesExtra: costoIngredientesExtra,
      precioUnitario: precioUnitario,
      cantidad: this.cantidad(),
      precioTotal: precioTotal
    });

    return precioTotal;
  });

  // ✅ ACTUALIZAR precioUnitarioConIngredientes (línea ~95):
  precioUnitarioConIngredientes = computed(() => {
    const precioBase = this.precioProducto;
    const costoIngredientesExtra = this.ingredientesDisponibles.reduce((total, ing) => {
      if (ing.precio && ing.precio > 0) {
        if (ing.esOriginal) {
          const cantidadExtra = Math.max(0, ing.cantidad - 1);
          return total + (cantidadExtra * ing.precio);
        } else {
          return total + (ing.cantidad * ing.precio);
        }
      }
      return total;
    }, 0);

    return precioBase + costoIngredientesExtra;
  });

  // ✅ ACTUALIZAR costoIngredientesAdicionales (línea ~105):
  costoIngredientesAdicionales = computed(() => {
    return this.ingredientesDisponibles.reduce((total, ing) => {
      if (ing.precio && ing.precio > 0) {
        if (ing.esOriginal) {
          const cantidadExtra = Math.max(0, ing.cantidad - 1);
          return total + (cantidadExtra * ing.precio);
        } else {
          return total + (ing.cantidad * ing.precio);
        }
      }
      return total;
    }, 0);
  });

  // ✅ Datos adicionales del producto
  productoDatos: any = null;
  categoriaDatos: any = null;

  ngOnInit(): void {
    // ✅ Obtener ID del producto desde la URL
    this.productoId = Number(this.route.snapshot.paramMap.get('id'));

    // ✅ MODIFICAR: Obtener parámetros adicionales incluyendo información de tamaño
    this.route.queryParams.subscribe(params => {
      const cantidadInicial = Number(params['cantidad']) || 1;
      this.cantidad.set(cantidadInicial);
      this.nombreProducto = params['nombre'] || '';
      this.categoriaProducto = Number(params['categoria']) || null;

      // ✅ NUEVO: Procesar precio según si tiene tamaño seleccionado
      if (params['tamano_precio']) {
        // Si viene con tamaño seleccionado, usar ese precio
        this.precioProducto = Number(params['tamano_precio']) || 0;
        console.log(`📏 Producto con tamaño seleccionado: ${params['tamano_codigo']} - $${this.precioProducto}`);
      } else {
        // Si no tiene tamaño, usar precio base
        this.precioProducto = Number(params['precio']) || 0;
        console.log(`💰 Producto sin tamaño, precio base: $${this.precioProducto}`);
      }

      console.log('🎨 Datos recibidos para personalización:', {
        id: this.productoId,
        cantidad: this.cantidad(),
        nombre: this.nombreProducto,
        precio: this.precioProducto,
        categoria: this.categoriaProducto,
        // ✅ NUEVO: Log de información de tamaño
        tamano_id: params['tamano_id'] || 'N/A',
        tamano_codigo: params['tamano_codigo'] || 'N/A',
        tamano_precio: params['tamano_precio'] || 'N/A',
        precioTotal: this.precioTotalCalculado()
      });

      // ✅ Cargar datos completos del producto
      this.cargarDatosCompletos();
    });
  }

  // ✅ MÉTODOS PRIVADOS
  private cargarDatosCompletos(): void {
    if (!this.productoId) {
      console.error('❌ No se proporcionó ID de producto');
      this.volverAlMenu();
      return;
    }

    // Cargar datos del producto, categoría e ingredientes
    Promise.all([
      this.cargarProductoDetalle(),
      this.cargarCategoriaDetalle(),
      this.cargarIngredientesDisponibles()
    ]).then(() => {
      console.log('✅ Datos completos cargados');
    }).catch(error => {
      console.error('❌ Error cargando datos:', error);
    });
  }

  private async cargarProductoDetalle(): Promise<void> {
    try {
      this.establecerDatosIniciales();

      this.catalogoService.getProductos().subscribe({
        next: (productos: any[]) => {
          const producto = productos.find(p => p.id === this.productoId);
          if (producto) {
            this.productoDatos = producto;
            this.actualizarDatosProducto(producto);
          }
        },
        error: (error) => {
          console.error('❌ Error cargando producto:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error en cargarProductoDetalle:', error);
    }
  }

  private async cargarCategoriaDetalle(): Promise<void> {
    if (!this.categoriaProducto) return;

    try {
      this.catalogoService.getCategorias().subscribe({
        next: (categorias: any[]) => {
          const categoria = categorias.find(c => c.id === this.categoriaProducto);
          if (categoria) {
            this.categoriaDatos = categoria;
            this.nombreCategoria = categoria.nombre || '';
            console.log('📂 Categoría cargada:', this.nombreCategoria);
          }
        },
        error: (error) => {
          console.error('❌ Error cargando categoría:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error en cargarCategoriaDetalle:', error);
    }
  }

  // ACTUALIZAR el método cargarIngredientesDisponibles (líneas ~240-290):

  private async cargarIngredientesDisponibles(): Promise<void> {
    try {
      if (!this.productoId) {
        console.error('❌ No hay ID de producto para cargar ingredientes');
        return;
      }

      console.log('🥗 Cargando ingredientes reales para producto ID:', this.productoId);

      // ✅ MARCAR que estamos cargando
      this.cargandoIngredientes.set(true);
      this.ingredientesCargados.set(false);

      // Obtener información de tamaño de los query params
      const queryParams = this.route.snapshot.queryParams;
      const tamano_codigo = queryParams['tamano_codigo'];
      
      this.catalogoService.getIngredientesPorProducto(this.productoId, tamano_codigo).subscribe({
        next: (response) => {
          console.log('✅ Respuesta completa de ingredientes:', response);

          // ✅ PROCESAR ingredientes
          if (response.ingredientes && response.ingredientes.length > 0) {
            this.ingredientesDisponibles = response.ingredientes.map((ing: any) => {
              // Manejo de imagen del ingrediente
              let imagenUrl = 'assets/placeholder-ingrediente.png';

              if (ing.imagen_url) {
                if (ing.imagen_url.startsWith('http')) {
                  imagenUrl = ing.imagen_url;
                } else {
                  imagenUrl = this.catalogoService.getFullImageUrl(ing.imagen_url);
                }
              }

              console.log(`🖼️ Ingrediente: ${ing.nombre} - Seleccionado: ${ing.seleccionado} - Precio: $${ing.precio}`);

              return {
                id: ing.id,
                nombre: ing.nombre,
                imagenUrl: imagenUrl,
                seleccionado: ing.seleccionado,
                esOriginal: ing.es_original,
                precio: Number(ing.precio) || 0,
                cantidad: ing.es_original ? 1 : 0 // ✅ NUEVO: Cantidad inicial
              };
            });

            console.log(`🎉 ${this.ingredientesDisponibles.length} ingredientes reales cargados`);
          } else {
            console.log('ℹ️ Este producto no tiene ingredientes personalizables');
            this.ingredientesDisponibles = [];
            
            if (response.mensaje) {
              console.log(`💬 Mensaje del servidor: ${response.mensaje}`);
            }
          }

          // ✅ MARCAR que terminamos de cargar
          this.cargandoIngredientes.set(false);
          this.ingredientesCargados.set(true);
        },
        error: (error) => {
          console.error('❌ Error cargando ingredientes del producto:', error);
          this.ingredientesDisponibles = [];
          
          // ✅ MARCAR que terminamos (aunque con error)
          this.cargandoIngredientes.set(false);
          this.ingredientesCargados.set(true);
          
          if (error.status === 404) {
            console.log('🔍 Producto no encontrado');
          } else if (error.status === 500) {
            console.log('⚠️ Error del servidor al cargar ingredientes');
          }
        }
      });

    } catch (error) {
      console.error('❌ Error en cargarIngredientesDisponibles:', error);
      this.ingredientesDisponibles = [];
      
      // ✅ MARCAR que terminamos (aunque con error)
      this.cargandoIngredientes.set(false);
      this.ingredientesCargados.set(true);
    }
  }

  private establecerDatosIniciales(): void {
    this.imagenProducto = 'assets/placeholder-producto.png';

    if (!this.descripcionProducto) {
      this.descripcionProducto = 'Delicioso producto preparado con ingredientes frescos y de alta calidad.';
    }
  }

  private actualizarDatosProducto(producto: any): void {
    this.nombreProducto = producto.nombre || this.nombreProducto;
    this.descripcionProducto = producto.descripcion || this.descripcionProducto;
    
    // ✅ MODIFICAR: NO sobrescribir precio si ya viene con tamaño seleccionado
    // Solo actualizar precio si no se recibió un precio de tamaño
    const tienePrecionTamano = this.route.snapshot.queryParams['tamano_precio'];
    if (!tienePrecionTamano) {
      this.precioProducto = Number(producto.precio) || this.precioProducto;
      console.log('💰 Precio actualizado desde producto base:', this.precioProducto);
    } else {
      console.log('📏 Manteniendo precio de tamaño seleccionado:', this.precioProducto);
    }

    if (producto.imagenUrl || producto.imagen_url) {
      this.imagenProducto = this.catalogoService.getFullImageUrl(
        producto.imagenUrl || producto.imagen_url
      );
    }

    console.log('✅ Datos del producto actualizados desde la base de datos:', {
      nombre: this.nombreProducto,
      precio: this.precioProducto,
      descripcion: this.descripcionProducto,
      imagen: this.imagenProducto,
      cantidadActual: this.cantidad(),
      precioTotal: this.precioTotalCalculado()
    });
  }

  private actualizarPrecioConIngredientes(): void {
    // Calcular precio de ingredientes extra (reales desde la base de datos)
    const ingredientesExtra = this.ingredientesDisponibles.filter(ing =>
      ing.seleccionado && !ing.esOriginal && ing.precio && ing.precio > 0
    );

    const precioIngredientesExtra = ingredientesExtra.reduce((total, ing) => total + (ing.precio || 0), 0);

    console.log('🍔 Ingredientes extra seleccionados:', ingredientesExtra.map(ing => `${ing.nombre} (+$${ing.precio})`));
    console.log('💰 Costo adicional por ingredientes:', precioIngredientesExtra);

    // ✅ FUTURO: Aquí podrías actualizar el precio total del producto
    // this.precioProducto = this.precioProductoBase + precioIngredientesExtra;
  }

  private obtenerResumenPersonalizaciones(): any {
    const ingredientesOriginales = this.ingredientesDisponibles.filter(ing => ing.esOriginal);
    const ingredientesAgregados = this.ingredientesDisponibles.filter(ing => !ing.esOriginal && ing.seleccionado);
    const ingredientesRemovidos = this.ingredientesDisponibles.filter(ing => ing.esOriginal && !ing.seleccionado);

    return {
      ingredientesOriginales: ingredientesOriginales.map(ing => ing.nombre),
      ingredientesAgregados: ingredientesAgregados.map(ing => ({
        nombre: ing.nombre,
        precio: ing.precio
      })),
      ingredientesRemovidos: ingredientesRemovidos.map(ing => ing.nombre),
      costoAdicional: ingredientesAgregados.reduce((total, ing) => total + (ing.precio || 0), 0)
    };
  }

  // ✅ ACTUALIZAR toggleIngrediente para trabajar con cantidades:
  toggleIngrediente(ingrediente: IngredientePersonalizacion): void {
    if (ingrediente.cantidad === 0) {
      // Si está en 0, ponerlo en 1
      ingrediente.cantidad = 1;
      ingrediente.seleccionado = true;
    } else {
      // Si tiene cantidad, ponerlo en 0
      ingrediente.cantidad = 0;
      ingrediente.seleccionado = false;
    }

    console.log(`🥬 ${ingrediente.nombre}: cantidad = ${ingrediente.cantidad}`);
    console.log(`💰 Precio total actualizado: $${this.precioTotalCalculado().toFixed(2)}`);
  }

  aumentarCantidad(): void {
    this.cantidad.update(value => value + 1);
    console.log('➕ Cantidad aumentada a:', this.cantidad(), '- Total:', this.precioTotalCalculado());
  }

  disminuirCantidad(): void {
    if (this.cantidad() > 1) {
      this.cantidad.update(value => value - 1);
      console.log('➖ Cantidad disminuida a:', this.cantidad(), '- Total:', this.precioTotalCalculado());
    }
  }

  agregarAlCarrito(): void {
    const cantidadFinal = this.cantidad();
    const precioTotal = this.precioTotalCalculado(); // ✅ YA incluye ingredientes adicionales
    const precioUnitarioConExtras = this.precioUnitarioConIngredientes();
    const resumenPersonalizaciones = this.obtenerResumenPersonalizaciones();

    console.log('🛒 Agregando producto personalizado al carrito:', {
      id: this.productoId,
      nombre: this.nombreProducto,
      cantidad: cantidadFinal,
      precioBaseUnitario: this.precioProducto,
      precioUnitarioConExtras: precioUnitarioConExtras,
      precioTotal: precioTotal,
      costoIngredientesExtra: this.costoIngredientesAdicionales(),
      personalizaciones: resumenPersonalizaciones
    });

    // ✅ USAR el precio unitario que YA incluye los ingredientes adicionales
    this.pedidoService.agregarProducto(
      this.productoId!,
      precioUnitarioConExtras, // ✅ PRECIO UNITARIO CON INGREDIENTES INCLUIDOS
      cantidadFinal
    );

    // ✅ MANTENER: Log detallado para el usuario
    let mensaje = `✅ ${this.nombreProducto} agregado al carrito!\n`;
    mensaje += `Cantidad: ${cantidadFinal}\n`;

    // ✅ MEJORAR: Mostrar desglose de precio
    if (this.costoIngredientesAdicionales() > 0) {
      mensaje += `Precio base: $${this.precioProducto.toFixed(2)}\n`;
      mensaje += `Ingredientes extra: +$${this.costoIngredientesAdicionales().toFixed(2)}\n`;
      mensaje += `Precio unitario: $${precioUnitarioConExtras.toFixed(2)}\n`;
    }

    mensaje += `Precio total: $${precioTotal.toFixed(2)}`;

    if (resumenPersonalizaciones.ingredientesAgregados.length > 0) {
      mensaje += `\n\n➕ Ingredientes agregados:`;
      resumenPersonalizaciones.ingredientesAgregados.forEach((ing: any) => {
        mensaje += `\n• ${ing.nombre} (+$${ing.precio.toFixed(2)})`;
      });
    }

    if (resumenPersonalizaciones.ingredientesRemovidos.length > 0) {
      mensaje += `\n\n➖ Ingredientes removidos:`;
      resumenPersonalizaciones.ingredientesRemovidos.forEach((nombre: string) => {
        mensaje += `\n• ${nombre}`;
      });
    }

    alert(mensaje);
    this.volverAlMenu();
  }

  volverAlMenu(): void {
    this.router.navigate(['/cliente/menu']);
  }

  cancelarPedido(): void {
    console.log('🛒 Cancelando pedido...');
    this.volverAlMenu();
  }

  continuar(): void {
    console.log('🚀 Continuando con el pedido...');
    // Aquí podrías navegar a la siguiente página del flujo de pedido
    this.volverAlMenu();
  }

  aumentarIngrediente(ingrediente: IngredientePersonalizacion): void {
    ingrediente.cantidad++;
    ingrediente.seleccionado = ingrediente.cantidad > 0;
    
    console.log(`➕ ${ingrediente.nombre}: cantidad = ${ingrediente.cantidad}`);
    console.log(`💰 Precio total actualizado: $${this.precioTotalCalculado().toFixed(2)}`);
  }

  disminuirIngrediente(ingrediente: IngredientePersonalizacion): void {
    if (ingrediente.cantidad > 0) {
      ingrediente.cantidad--;
      ingrediente.seleccionado = ingrediente.cantidad > 0;
      
      console.log(`➖ ${ingrediente.nombre}: cantidad = ${ingrediente.cantidad}`);
      console.log(`💰 Precio total actualizado: $${this.precioTotalCalculado().toFixed(2)}`);
    }
  }

}
