import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogoService } from '../../services/catalogo.service';
import { PedidoService } from '../../services/pedido.service'; // ✅ AGREGAR
import { PersonalizacionIngrediente } from '../../models/pedido.model';

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

   // ✅ NUEVAS propiedades para edición
  modoEdicion = false;
  carritoIndex: number | null = null;
  datosActuales: any = null;
  personalizacionOriginal: PersonalizacionIngrediente[] = [];
  ingredientesSeleccionados: number[] = [];
  ingredientesAEliminar: number[] = [];
  productoSeleccionado = true; 

  // ✅ AGREGAR flag para evitar ejecución múltiple
  procesandoConfirmacion = false;
  // ✅ CORREGIR: Computed más inteligente
  tieneIngredientesPersonalizables = computed(() => {
    if (!this.ingredientesCargados()) {
      return true;
    }
    return this.ingredientesDisponibles().length > 0; // ✅ USAR ()
  });


  // ✅ CORREGIR: Computed para el mensaje
  mensajeSinIngredientes = computed(() => {
    // Solo mostrar mensaje si ya se cargaron y no hay ingredientes
    if (this.ingredientesCargados() && this.ingredientesDisponibles().length === 0) {
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
  ingredientesDisponibles = signal<IngredientePersonalizacion[]>([]);


  // ✅ REEMPLAZAR el computed precioTotalCalculado (línea ~82)
  precioTotalCalculado = computed(() => {
    const precioBase = this.precioProducto;
    const ingredientes = this.ingredientesDisponibles(); // ✅ USAR ()

    const costoIngredientesExtra = ingredientes.reduce((total: number, ing) => {
      if (ing.precio && ing.precio > 0) {
        if (ing.esOriginal) {
          const cantidadExtra = Math.max(0, ing.cantidad - 1);
          const costoEste = cantidadExtra * (ing.precio || 0);
          if (cantidadExtra > 0) {
            console.log(`🧀 ${ing.nombre} (original extra): +$${costoEste}`);
          }
          return total + costoEste;
        } else {
          const costoEste = ing.cantidad * (ing.precio || 0);
          if (ing.cantidad > 0) {
            console.log(`🥬 ${ing.nombre} (agregado): +$${costoEste}`);
          }
          return total + costoEste;
        }
      }
      return total;
    }, 0);

    const precioUnitario = precioBase + costoIngredientesExtra;
    const precioTotal = precioUnitario * this.cantidad();

    console.log('💰 === CÁLCULO SIGNAL ===');
    console.log('Ingredientes:', ingredientes.length);
    console.log('Costo extra:', costoIngredientesExtra);
    console.log('PRECIO TOTAL:', precioTotal);
    console.log('💰 === FIN CÁLCULO ===');

    return precioTotal;
  });


  // ✅ ACTUALIZAR precioUnitarioConIngredientes (línea ~95):
  precioUnitarioConIngredientes = computed(() => {
    const precioBase = this.precioProducto;
    const costoIngredientesExtra = this.ingredientesDisponibles().reduce((total: number, ing) => {
      if (ing.precio && ing.precio > 0) {
        if (ing.esOriginal) {
          const cantidadExtra = Math.max(0, ing.cantidad - 1);
          return total + (cantidadExtra * (ing.precio || 0));
        } else {
          return total + (ing.cantidad * (ing.precio || 0));
        }
      }
      return total;
    }, 0);

    return precioBase + costoIngredientesExtra;
  });

  // ✅ ACTUALIZAR costoIngredientesAdicionales (línea ~105):
  costoIngredientesAdicionales = computed(() => {
    return this.ingredientesDisponibles().reduce((total: number, ing) => {
      if (ing.precio && ing.precio > 0) {
        if (ing.esOriginal) {
          const cantidadExtra = Math.max(0, ing.cantidad - 1);
          return total + (cantidadExtra * (ing.precio || 0));
        } else {
          return total + (ing.cantidad * (ing.precio || 0));
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

    this.route.queryParams.subscribe(params => {
      this.modoEdicion = params['modo'] === 'editar';
      
      if (this.modoEdicion) {
        this.carritoIndex = params['carritoIndex'] ? +params['carritoIndex'] : null;
        this.datosActuales = history.state?.datosActuales;
        
        console.log('🔧 Modo edición activado:', {
          carritoIndex: this.carritoIndex,
          datosActuales: this.datosActuales
        });
        
        this.precargarPersonalizaciones();
      }
    });

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

  // ✅ NUEVO método para precargar personalizaciones
  private precargarPersonalizaciones(): void {
    if (this.datosActuales?.personalizacion) {
      this.personalizacionOriginal = [...this.datosActuales.personalizacion];
      
      console.log('📋 Precargando personalizaciones:', this.personalizacionOriginal);
      
      // ✅ ESPERAR a que se carguen los ingredientes y luego aplicar personalizaciones
      setTimeout(() => {
        this.aplicarPersonalizacionesAIngredientes();
      }, 500);
    }
  }


  // ✅ REEMPLAZAR método aplicarPersonalizacionesAIngredientes
  private aplicarPersonalizacionesAIngredientes(): void {
    if (this.personalizacionOriginal.length === 0) return;
    
    const ingredientes = this.ingredientesDisponibles();
    
    console.log('🔧 === APLICANDO PERSONALIZACIONES ===');
    console.log('📋 Personalizaciones a aplicar:', this.personalizacionOriginal);
    
    // ✅ CONTAR cuántas veces aparece cada ingrediente con cada acción
    const conteoIngredientes = new Map<number, { agregar: number, quitar: number }>();
    
    this.personalizacionOriginal.forEach(p => {
      if (!conteoIngredientes.has(p.ingrediente_id)) {
        conteoIngredientes.set(p.ingrediente_id, { agregar: 0, quitar: 0 });
      }
      
      const conteo = conteoIngredientes.get(p.ingrediente_id)!;
      if (p.accion === 'agregar') {
        conteo.agregar++;
      } else if (p.accion === 'quitar') {
        conteo.quitar++;
      }
    });
    
    console.log('📊 Conteo de ingredientes:', [...conteoIngredientes.entries()].map(([id, conteo]) => ({
      ingrediente_id: id,
      agregar: conteo.agregar,
      quitar: conteo.quitar
    })));
    
    // ✅ APLICAR los conteos a cada ingrediente
    conteoIngredientes.forEach((conteo, ingrediente_id) => {
      const ingrediente = ingredientes.find(ing => ing.id === ingrediente_id);
      if (ingrediente) {
        console.log(`🔧 Procesando ${ingrediente.nombre} (ID: ${ingrediente_id}):`);
        console.log(`   - Es original: ${ingrediente.esOriginal}`);
        console.log(`   - Cantidad inicial: ${ingrediente.cantidad}`);
        console.log(`   - Agregar: ${conteo.agregar}`);
        console.log(`   - Quitar: ${conteo.quitar}`);
        
        if (ingrediente.esOriginal) {
          // ✅ INGREDIENTES ORIGINALES
          if (conteo.quitar > 0) {
            // Si se quitó, cantidad = 0
            ingrediente.cantidad = 0;
            ingrediente.seleccionado = false;
            console.log(`   ➖ RESULTADO: Quitado (cantidad = 0)`);
          } else {
            // Si no se quitó, cantidad base (1) + agregados extra
            ingrediente.cantidad = 1 + conteo.agregar;
            ingrediente.seleccionado = true;
            console.log(`   ➕ RESULTADO: Original + ${conteo.agregar} extra (cantidad = ${ingrediente.cantidad})`);
          }
        } else {
          // ✅ INGREDIENTES NO ORIGINALES
          ingrediente.cantidad = conteo.agregar;
          ingrediente.seleccionado = ingrediente.cantidad > 0;
          console.log(`   ➕ RESULTADO: Agregado ${conteo.agregar} veces (cantidad = ${ingrediente.cantidad})`);
        }
      } else {
        console.warn(`⚠️ No se encontró ingrediente con ID ${ingrediente_id}`);
      }
    });
    
    // ✅ ACTUALIZAR el signal después de modificar
    this.ingredientesDisponibles.set([...ingredientes]);
    
    console.log('✅ Estado final de ingredientes:', 
      this.ingredientesDisponibles().map(ing => ({
        id: ing.id,
        nombre: ing.nombre,
        esOriginal: ing.esOriginal,
        cantidad: ing.cantidad,
        seleccionado: ing.seleccionado,
        precio: ing.precio
      })).filter(ing => ing.cantidad !== (ing.esOriginal ? 1 : 0))
    );
    console.log('🔧 === FIN APLICACIÓN ===');
  }



  // ✅ MODIFICAR el método confirmarPersonalizacion
  confirmarPersonalizacion(): void {
    // ✅ PREVENIR ejecución múltiple
    if (this.procesandoConfirmacion) {
      console.log('⚠️ Ya se está procesando la confirmación - IGNORANDO');
      return;
    }

    this.procesandoConfirmacion = true;
    console.log('🔧 === INICIANDO CONFIRMACIÓN ÚNICA ===');
    console.log('🔧 Modo edición:', this.modoEdicion);
    console.log('🔧 Timestamp:', Date.now());

    try {
      if (this.modoEdicion) {
        console.log('✏️ MODO EDICIÓN - Actualizando producto existente');
        this.actualizarProductoEnCarrito();
        // ✅ NO resetear flag aquí - se hace en actualizarProductoEnCarrito
      } else {
        console.log('➕ MODO NUEVO - Agregando producto al carrito');
        this.agregarAlCarrito();
        // ✅ Resetear flag para modo agregar
        setTimeout(() => {
          this.procesandoConfirmacion = false;
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error en confirmación:', error);
      this.procesandoConfirmacion = false; // ✅ Resetear flag en caso de error
    }
    
    console.log('🔧 === FIN CONFIRMACIÓN ===');
  }


  // ✅ NUEVO método para actualizar producto existente
  private actualizarProductoEnCarrito(): void {
    console.log('🔄 === INICIANDO ACTUALIZACIÓN ÚNICA ===');
    
    if (!this.datosActuales || this.carritoIndex === null) {
      console.error('❌ Datos insuficientes para actualizar');
      this.procesandoConfirmacion = false;
      return;
    }

    const nuevaPersonalizacion = this.generarPersonalizacionFinal();
    const nuevoPrecio = this.calcularPrecioFinal();

    // ✅ AGREGAR logs detallados del cálculo
    console.log('🔄 === DETALLE DE ACTUALIZACIÓN ===');
    console.log('Precio base del producto:', this.precioProducto);
    console.log('Cantidad actual:', this.cantidad());
    console.log('Costo ingredientes adicionales:', this.costoIngredientesAdicionales());
    console.log('Precio unitario con ingredientes:', this.precioUnitarioConIngredientes());
    console.log('NUEVO PRECIO TOTAL:', nuevoPrecio);
    console.log('Personalización original:', this.personalizacionOriginal);
    console.log('Nueva personalización:', nuevaPersonalizacion);
    console.log('🔄 === FIN DETALLE ===');

    // ✅ VERIFICAR que el precio sea correcto antes de actualizar
    if (nuevoPrecio <= 0) {
      console.error('❌ Precio calculado inválido:', nuevoPrecio);
      this.procesandoConfirmacion = false;
      return;
    }

    const resultado = this.pedidoService.actualizarProductoEnCarrito(
      this.datosActuales.producto_id,
      this.personalizacionOriginal,
      nuevaPersonalizacion,
      nuevoPrecio
    );

    if (resultado !== false) {
      console.log('✅ Actualización exitosa - Navegando al carrito');
      this.router.navigateByUrl('/cliente/carrito', { 
        replaceUrl: true
      });
    } else {
      console.error('❌ Falló la actualización');
      this.procesandoConfirmacion = false;
    }
  }

  private generarPersonalizacionFinal(): PersonalizacionIngrediente[] {
    const personalizaciones: PersonalizacionIngrediente[] = [];
    const ingredientes = this.ingredientesDisponibles(); // ✅ USAR signal

    console.log('🔧 === GENERANDO PERSONALIZACIONES FINALES ===');
    console.log('📋 Estado actual de ingredientes:', ingredientes.map(ing => ({
      id: ing.id,
      nombre: ing.nombre,
      esOriginal: ing.esOriginal,
      cantidad: ing.cantidad,
      seleccionado: ing.seleccionado
    })));

    // ✅ USAR los ingredientes del signal
    ingredientes.forEach(ingrediente => {
      // Ingredientes NO originales agregados
      if (!ingrediente.esOriginal && ingrediente.cantidad > 0) {
        for (let i = 0; i < ingrediente.cantidad; i++) {
          personalizaciones.push({
            ingrediente_id: ingrediente.id,
            accion: 'agregar',
            precio_aplicado: ingrediente.precio || 0
          });
        }
        console.log(`➕ Agregando ${ingrediente.cantidad}x ${ingrediente.nombre}`);
      }
      // Ingredientes originales removidos
      else if (ingrediente.esOriginal && ingrediente.cantidad === 0) {
        personalizaciones.push({
          ingrediente_id: ingrediente.id,
          accion: 'quitar',
          precio_aplicado: 0
        });
        console.log(`➖ Quitando ${ingrediente.nombre}`);
      }
      
      // Ingredientes originales con cantidad extra
      else if (ingrediente.esOriginal && ingrediente.cantidad > 1) {
        const cantidadExtra = ingrediente.cantidad - 1;
        for (let i = 0; i < cantidadExtra; i++) {
          personalizaciones.push({
            ingrediente_id: ingrediente.id,
            accion: 'agregar',
            precio_aplicado: ingrediente.precio || 0
          });
        }
        console.log(`➕ Agregando ${cantidadExtra}x extra de ${ingrediente.nombre}`);
      }
    });

    console.log('🔧 Personalizaciones generadas:', personalizaciones);
    console.log('🔧 === FIN GENERACIÓN PERSONALIZACIONES ===');
    
    return personalizaciones;
  }


  // ✅ Método para volver al carrito (modo edición)
  volverAlCarrito(): void {
    console.log('🔙 Volviendo al carrito sin guardar cambios');
    this.router.navigate(['/cliente/carrito'], { replaceUrl: true });
  }

  // ✅ Método para volver al menú (modo agregar)
  volverAlMenu(): void {
    console.log('🔙 Volviendo al menú');
    this.router.navigate(['/cliente/menu'], { replaceUrl: true });
  }



  // ✅ MÉTODO para obtener texto del botón
  obtenerTextoBoton(): string {
    if (this.modoEdicion) {
      return `Actualizar Producto $${this.calcularPrecioFinal().toFixed(2)}`;
    } else {
      return `Agregar al Pedido $${this.calcularPrecioFinal().toFixed(2)}`;
    }
  }

  calcularPrecioFinal(): number {
    // ✅ USAR el computed que YA calcula correctamente
    const precioCalculado = this.precioTotalCalculado();
    
    console.log('💰 === CÁLCULO PRECIO FINAL ===');
    console.log('Precio base producto:', this.precioProducto);
    console.log('Cantidad:', this.cantidad());
    console.log('Costo ingredientes extra:', this.costoIngredientesAdicionales());
    console.log('Precio unitario con extras:', this.precioUnitarioConIngredientes());
    console.log('PRECIO FINAL TOTAL:', precioCalculado);
    console.log('💰 === FIN CÁLCULO ===');
    
    return precioCalculado;
  }

  // Método para cancelar
  cancelar(): void {
    this.volverAlMenu();
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
            this.ingredientesDisponibles.set(response.ingredientes.map((ing: any) => {
              // Manejo de imagen del ingrediente
              let imagenUrl = 'assets/placeholder-ingrediente.png';

              if (ing.imagen_url) {
                if (ing.imagen_url.startsWith('http')) {
                  imagenUrl = ing.imagen_url;
                } else {
                  imagenUrl = this.catalogoService.getFullImageUrl(ing.imagen_url);
                }
              }

              console.log(`🖼️ Ingrediente: ${ing.nombre} - Es original: ${ing.es_original} - Precio: $${ing.precio}`);

                return {
                  id: ing.id,
                  nombre: ing.nombre,
                  imagenUrl: imagenUrl,
                  seleccionado: ing.es_original,
                  esOriginal: ing.es_original,
                  precio: Number(ing.precio) || 0,
                  cantidad: ing.es_original ? 1 : 0
                };
            }));

            console.log(`🎉 ${this.ingredientesDisponibles.length} ingredientes reales cargados`);
          } else {
            console.log('ℹ️ Este producto no tiene ingredientes personalizables');
            this.ingredientesDisponibles.set([]);

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
          this.ingredientesDisponibles.set([]);

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
      this.ingredientesDisponibles.set([]);

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
    const ingredientesExtra = this.ingredientesDisponibles().filter(ing =>
      ing.seleccionado && !ing.esOriginal && ing.precio && ing.precio > 0
    );

    const precioIngredientesExtra = ingredientesExtra.reduce((total, ing) => total + (ing.precio || 0), 0);

    console.log('🍔 Ingredientes extra seleccionados:', ingredientesExtra.map(ing => `${ing.nombre} (+$${ing.precio})`));
    console.log('💰 Costo adicional por ingredientes:', precioIngredientesExtra);
  }

  // ✅ CORREGIR obtenerResumenPersonalizaciones
  private obtenerResumenPersonalizaciones(): any {
    const ingredientes = this.ingredientesDisponibles(); // ✅ USAR ()
    const ingredientesOriginales = ingredientes.filter(ing => ing.esOriginal);
    const ingredientesAgregados = ingredientes.filter(ing => !ing.esOriginal && ing.seleccionado);
    const ingredientesRemovidos = ingredientes.filter(ing => ing.esOriginal && !ing.seleccionado);

    return {
      ingredientesOriginales: ingredientesOriginales.map(ing => ing.nombre),
      ingredientesAgregados: ingredientesAgregados.map(ing => ({
        nombre: ing.nombre,
        precio: ing.precio
      })),
      ingredientesRemovidos: ingredientesRemovidos.map(ing => ing.nombre),
      costoAdicional: ingredientesAgregados.reduce((total: number, ing) => total + (ing.precio || 0), 0)
    };
  }



  // ✅ ACTUALIZAR toggleIngrediente para trabajar con cantidades:
  toggleIngrediente(ingrediente: IngredientePersonalizacion): void {
    if (ingrediente.cantidad === 0) {
      ingrediente.cantidad = 1;
      ingrediente.seleccionado = true;
    } else {
      ingrediente.cantidad = 0;
      ingrediente.seleccionado = false;
    }

    // ✅ ACTUALIZAR signal
    this.ingredientesDisponibles.update(ingredients => [...ingredients]);

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
    const precioTotal = this.precioTotalCalculado();
    const precioUnitarioConExtras = this.precioUnitarioConIngredientes();
    const resumenPersonalizaciones = this.obtenerResumenPersonalizaciones();

    // NUEVO: Obtén las personalizaciones
    const personalizaciones = this.obtenerPersonalizacionesParaPedido();

    this.pedidoService.agregarProducto(
      this.productoId!,
      precioUnitarioConExtras,
      cantidadFinal,
      personalizaciones // <-- Aquí pasas las personalizaciones
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

    this.volverAlMenu();
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

    // ✅ ACTUALIZAR el signal para forzar reactividad
    this.ingredientesDisponibles.update(ingredientes => [...ingredientes]);

    console.log(`➕ ${ingrediente.nombre}:`);
    console.log(`   - Cantidad: ${ingrediente.cantidad}`);
    console.log(`   - Es original: ${ingrediente.esOriginal}`);
    console.log(`   - Precio: $${ingrediente.precio || 0}`);
    console.log(`   - Seleccionado: ${ingrediente.seleccionado}`);
    
    console.log('💰 === DEBUG DESPUÉS DE AGREGAR ===');
    console.log('Precio total calculado:', this.precioTotalCalculado());
    console.log('💰 === FIN DEBUG ===');
  }

  disminuirIngrediente(ingrediente: IngredientePersonalizacion): void {
    if (ingrediente.cantidad > 0) {
      ingrediente.cantidad--;
      ingrediente.seleccionado = ingrediente.cantidad > 0;

      // ✅ ACTUALIZAR signal
      this.ingredientesDisponibles.update(ingredients => [...ingredients]);

      console.log(`➖ ${ingrediente.nombre}: cantidad = ${ingrediente.cantidad}`);
      console.log(`💰 Precio total actualizado: $${this.precioTotalCalculado().toFixed(2)}`);
    }
  }



  private obtenerPersonalizacionesParaPedido(): PersonalizacionIngrediente[] {
    const personalizaciones: PersonalizacionIngrediente[] = [];
    const ingredientes = this.ingredientesDisponibles(); // ✅ USAR ()

    console.log('🔧 === GENERANDO PERSONALIZACIONES PARA PEDIDO ===');
    console.log('📋 Estado de ingredientes:', ingredientes.map(ing => ({
      id: ing.id,
      nombre: ing.nombre,
      esOriginal: ing.esOriginal,
      cantidad: ing.cantidad,
      seleccionado: ing.seleccionado,
      precio: ing.precio
    })));

    ingredientes.forEach(ing => {
      // ✅ INGREDIENTES NO ORIGINALES AGREGADOS
      if (!ing.esOriginal && ing.cantidad > 0) {
        for (let i = 0; i < ing.cantidad; i++) {
          personalizaciones.push({
            ingrediente_id: ing.id,
            accion: 'agregar',
            precio_aplicado: ing.precio || 0
          });
        }
        console.log(`➕ Agregando ${ing.cantidad}x ${ing.nombre} (+$${(ing.precio || 0).toFixed(2)} c/u)`);
      }
        // ✅ INGREDIENTES ORIGINALES REMOVIDOS
      else if (ing.esOriginal && ing.cantidad === 0) {
        personalizaciones.push({
          ingrediente_id: ing.id,
          accion: 'quitar',
          precio_aplicado: 0
        });
        console.log(`➖ Quitando ${ing.nombre}`);
      }
      
      // ✅ INGREDIENTES ORIGINALES CON CANTIDAD EXTRA
      else if (ing.esOriginal && ing.cantidad > 1) {
        const cantidadExtra = ing.cantidad - 1;
        for (let i = 0; i < cantidadExtra; i++) {
          personalizaciones.push({
            ingrediente_id: ing.id,
            accion: 'agregar',
            precio_aplicado: ing.precio || 0
          });
        }
        console.log(`➕ Extra ${cantidadExtra}x ${ing.nombre} (+$${(ing.precio || 0).toFixed(2)} c/u)`);
      }
    });

    console.log('🔧 Personalizaciones generadas:', personalizaciones);
    console.log('🔧 === FIN GENERACIÓN ===');
    
    return personalizaciones;
  }
}
