import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogoService } from '../../services/catalogo.service';
import { PedidoService } from '../../services/pedido.service';
import { PersonalizacionIngrediente } from '../../models/pedido.model';
import { combineLatest } from 'rxjs';

interface IngredientePersonalizacion {
  id: number;
  nombre: string;
  imagenUrl: string;
  seleccionado: boolean;
  esOriginal: boolean; // Si venía originalmente en el producto
  precio?: number; // Por si algunos ingredientes tienen costo adicional
  cantidad: number;
  cantidadBase?: number;
}

@Component({
  selector: 'app-personalizar-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personalizar-producto.component.html',
  styleUrls: ['./personalizar-producto.component.scss']
})
export class PersonalizarProductoComponent implements OnInit {
  ingredientesCargados = signal<boolean>(false);
  cargandoIngredientes = signal<boolean>(false);

  modoEdicion = false;
  carritoIndex: number | null = null;
  datosActuales: any = null;
  personalizacionOriginal: PersonalizacionIngrediente[] = [];
  ingredientesSeleccionados: number[] = [];
  ingredientesAEliminar: number[] = [];
  productoSeleccionado = true;

  procesandoConfirmacion = false;
  tieneIngredientesPersonalizables = computed(() => {
    if (!this.ingredientesCargados()) {
      return true;
    }
    return this.ingredientesDisponibles().length > 0;
  });


  mensajeSinIngredientes = computed(() => {
    // Solo mostrar mensaje si ya se cargaron y no hay ingredientes
    if (this.ingredientesCargados() && this.ingredientesDisponibles().length === 0) {
      return 'Este producto no tiene opciones de personalización disponibles. Se agregará tal como está en el menú.';
    }
    return '';
  });

  mostrandoCarga = computed(() => {
    return this.cargandoIngredientes() || !this.ingredientesCargados();
  });

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogoService = inject(CatalogoService);
  public pedidoService = inject(PedidoService);

  productoId: number | null = null;
  cantidad = signal<number>(1);
  nombreProducto: string = '';
  precioProducto: number = 0;
  categoriaProducto: number | null = null;
  descripcionProducto: string = '';
  imagenProducto: string = '';
  nombreCategoria: string = '';

  ingredientesDisponibles = signal<IngredientePersonalizacion[]>([]);


  precioTotalCalculado = computed(() => {
    const precioBase = this.precioProducto;
    const ingredientes = this.ingredientesDisponibles();

    const costoIngredientesExtra = ingredientes.reduce((total: number, ing) => {
      if (ing.precio && ing.precio > 0) {
        if (ing.esOriginal) {
          // INGREDIENTES BASE: Solo sumar cantidades EXTRA (por encima de la cantidad base)
          const cantidadBase = ing.cantidadBase || 0;
          const cantidadExtra = Math.max(0, ing.cantidad - cantidadBase);
          const costoEste = cantidadExtra * (ing.precio || 0);

          return total + costoEste;
        } else {
          // INGREDIENTES OPCIONALES: Solo sumar cantidad EXTRA si estaba incluido
          const cantidadBase = ing.cantidadBase || 0;
          const cantidadExtra = Math.max(0, ing.cantidad - cantidadBase);
          const costoEste = cantidadExtra * (ing.precio || 0);

          return total + costoEste;
        }
      }
      return total;
    }, 0);

    const precioUnitario = precioBase + costoIngredientesExtra;
    const precioTotal = precioUnitario * this.cantidad();


    return precioTotal;
  });


  precioUnitarioConIngredientes = computed(() => {
    const precioBase = this.precioProducto;
    const costoIngredientesExtra = this.ingredientesDisponibles().reduce((total: number, ing) => {
      if (ing.precio && ing.precio > 0) {
        if (ing.esOriginal) {
          // INGREDIENTES BASE: Solo cantidades extra
          const cantidadBase = ing.cantidadBase || 0;
          const cantidadExtra = Math.max(0, ing.cantidad - cantidadBase);
          return total + (cantidadExtra * (ing.precio || 0));
        } else {
          // INGREDIENTES OPCIONALES: Solo cantidades extra
          const cantidadBase = ing.cantidadBase || 0;
          const cantidadExtra = Math.max(0, ing.cantidad - cantidadBase);
          return total + (cantidadExtra * (ing.precio || 0));
        }
      }
      return total;
    }, 0);

    return precioBase + costoIngredientesExtra;
  });

  costoIngredientesAdicionales = computed(() => {
    return this.ingredientesDisponibles().reduce((total: number, ing) => {
      if (ing.precio && ing.precio > 0) {
        if (ing.esOriginal) {
          // INGREDIENTES BASE: Solo cantidades extra
          const cantidadBase = ing.cantidadBase || 0;
          const cantidadExtra = Math.max(0, ing.cantidad - cantidadBase);
          return total + (cantidadExtra * (ing.precio || 0));
        } else {
          // INGREDIENTES OPCIONALES: Solo cantidades extra
          const cantidadBase = ing.cantidadBase || 0;
          const cantidadExtra = Math.max(0, ing.cantidad - cantidadBase);
          return total + (cantidadExtra * (ing.precio || 0));
        }
      }
      return total;
    }, 0);
  });

  productoDatos: any = null;
  categoriaDatos: any = null;

  ngOnInit(): void {
  combineLatest([
    this.route.paramMap,
    this.route.queryParams
  ]).subscribe(([paramMap, params]) => {
    // 🔧 RESETEO COMPLETO DEL ESTADO AL CAMBIAR DE PRODUCTO
    this.modoEdicion = false;
    this.procesandoConfirmacion = false;
    this.carritoIndex = null;
    this.datosActuales = null;
    this.personalizacionOriginal = [];
    this.ingredientesSeleccionados = [];
    this.ingredientesAEliminar = [];
    this.productoSeleccionado = true;
    
    // 🔧 RESETEAR SIGNALS DE CARGA
    this.ingredientesCargados.set(false);
    this.cargandoIngredientes.set(false);
    this.ingredientesDisponibles.set([]);
    
    // Ahora procesa los parámetros
    this.productoId = Number(paramMap.get('id'));
    this.modoEdicion = params['modo'] === 'editar';
    this.carritoIndex = this.modoEdicion && params['carritoIndex'] ? +params['carritoIndex'] : null;
    this.datosActuales = this.modoEdicion ? history.state?.datosActuales : null;
    this.personalizacionOriginal = [];
    this.ingredientesSeleccionados = [];
    this.ingredientesAEliminar = [];
    this.productoSeleccionado = true;
    this.procesandoConfirmacion = false;
    this.cantidad.set(Number(params['cantidad']) || 1);
    this.nombreProducto = params['nombre'] || '';
    this.categoriaProducto = Number(params['categoria']) || null;
    this.descripcionProducto = '';
    this.imagenProducto = 'assets/placeholder-producto.png';
    this.precioProducto = params['tamano_precio']
      ? Number(params['tamano_precio']) || 0
      : Number(params['precio']) || 0;

    if (this.modoEdicion) {
      this.precargarPersonalizaciones();
    }

    // Cargar datos completos del producto
    this.cargarDatosCompletos();
  });
}

  private precargarPersonalizaciones(): void {
    if (this.datosActuales?.personalizacion) {
      this.personalizacionOriginal = [...this.datosActuales.personalizacion];


      setTimeout(() => {
        this.aplicarPersonalizacionesAIngredientes();
      }, 500);
    }
  }


  private aplicarPersonalizacionesAIngredientes(): void {
    if (this.personalizacionOriginal.length === 0) return;

    const ingredientes = this.ingredientesDisponibles();


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


    conteoIngredientes.forEach((conteo, ingrediente_id) => {
      const ingrediente = ingredientes.find(ing => ing.id === ingrediente_id);
      if (ingrediente) {
        if (ingrediente.esOriginal) {
          // INGREDIENTES ORIGINALES
          if (conteo.quitar > 0) {
            // Si se quitó, cantidad = 0
            ingrediente.cantidad = 0;
            ingrediente.seleccionado = false;
          } else {
            // Si no se quitó, cantidad base (1) + agregados extra
            ingrediente.cantidad = 1 + conteo.agregar;
            ingrediente.seleccionado = true;
          }
        } else {
          // INGREDIENTES NO ORIGINALES
          ingrediente.cantidad = conteo.agregar;
          ingrediente.seleccionado = ingrediente.cantidad > 0;
        }
      } else {
      }
    });

    this.ingredientesDisponibles.set([...ingredientes]);

  }



  confirmarPersonalizacion(): void {
    if (!this.hayAlMenosUnIngredienteSeleccionado()) {
      alert('Debes seleccionar al menos un ingrediente para agregar este producto.');
      return;
    }

    if (this.procesandoConfirmacion) {
      return;
    }

    this.procesandoConfirmacion = true;

    try {
      if (this.modoEdicion) {
        this.actualizarProductoEnCarrito();
      } else {
        this.agregarAlCarrito();
        setTimeout(() => {
          this.procesandoConfirmacion = false;
        }, 1000);
      }
    } catch (error) {
      this.procesandoConfirmacion = false;
    }

  }


  private actualizarProductoEnCarrito(): void {

    if (!this.datosActuales || this.carritoIndex === null) {
      this.procesandoConfirmacion = false;
      return;
    }

    const nuevaPersonalizacion = this.generarPersonalizacionFinal();
    const nuevoPrecio = this.calcularPrecioFinal();


    if (nuevoPrecio <= 0) {
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
      this.router.navigateByUrl('/cliente/carrito', {
        replaceUrl: true
      });
    } else {
      this.procesandoConfirmacion = false;
    }
  }

  private generarPersonalizacionFinal(): PersonalizacionIngrediente[] {
    const personalizaciones: PersonalizacionIngrediente[] = [];
    const ingredientes = this.ingredientesDisponibles();


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
      }
      // Ingredientes originales removidos
      else if (ingrediente.esOriginal && ingrediente.cantidad === 0) {
        personalizaciones.push({
          ingrediente_id: ingrediente.id,
          accion: 'quitar',
          precio_aplicado: 0
        });
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
      }
    });


    return personalizaciones;
  }


  volverAlCarrito(): void {
    this.router.navigate(['/cliente/carrito'], { replaceUrl: true });
  }

  volverAlMenu(): void {
    
    // 🔧 RESETEAR COMPLETAMENTE todo el estado del componente
    this.modoEdicion = false;
    this.procesandoConfirmacion = false;
    this.carritoIndex = null;
    this.datosActuales = null;
    this.personalizacionOriginal = [];
    this.ingredientesSeleccionados = [];
    this.ingredientesAEliminar = [];
    this.productoSeleccionado = true;
    
    // 🔧 RESETEAR signals
    this.ingredientesCargados.set(false);
    this.cargandoIngredientes.set(false);
    this.ingredientesDisponibles.set([]);
    this.cantidad.set(1);
    
    // 🔧 RESETEAR datos del producto
    this.productoId = null;
    this.nombreProducto = '';
    this.precioProducto = 0;
    this.categoriaProducto = null;
    this.descripcionProducto = '';
    this.imagenProducto = '';
    this.nombreCategoria = '';
    this.productoDatos = null;
    this.categoriaDatos = null;
    
    
    this.router.navigate(['/cliente/menu'], { replaceUrl: true });
  }



  obtenerTextoBoton(): string {
    if (this.modoEdicion) {
      return `Actualizar Producto $${this.calcularPrecioFinal().toFixed(2)}`;
    } else {
      return `Agregar al Pedido $${this.calcularPrecioFinal().toFixed(2)}`;
    }
  }

  calcularPrecioFinal(): number {
    const precioCalculado = this.precioTotalCalculado();


    return precioCalculado;
  }

  // Método para cancelar
  cancelar(): void {
    
    // 🔧 RESETEAR estado antes de volver
    this.procesandoConfirmacion = false;
    this.modoEdicion = false;
    
    this.volverAlMenu();
  }

  private cargarDatosCompletos(): void {
    if (!this.productoId) {
      this.volverAlMenu();
      return;
    }

    // Cargar datos del producto, categoría e ingredientes
    Promise.all([
      this.cargarProductoDetalle(),
      this.cargarCategoriaDetalle(),
      this.cargarIngredientesDisponibles()
    ]).then(() => {
    }).catch(error => {
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
        }
      });
    } catch (error) {
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
          }
        },
        error: (error) => {
        }
      });
    } catch (error) {
    }
  }

  // ACTUALIZAR el método cargarIngredientesDisponibles (líneas ~240-290):
  private async cargarIngredientesDisponibles(): Promise<void> {
    try {
      if (!this.productoId) {
        return;
      }


      this.cargandoIngredientes.set(true);
      this.ingredientesCargados.set(false);

      // Obtener información de tamaño de los query params
      const queryParams = this.route.snapshot.queryParams;
      const tamano_codigo = queryParams['tamano_codigo'];

      this.catalogoService.getIngredientesPorProducto(this.productoId, tamano_codigo).subscribe({
        next: (response) => {

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


              return {
                id: ing.id,
                nombre: ing.nombre,
                imagenUrl: imagenUrl,
                seleccionado: ing.seleccionado,
                esOriginal: ing.es_base,
                precio: Number(ing.precio) || 0,
                cantidad: ing.seleccionado ? (ing.cantidad || 1) : 0,
                cantidadBase: ing.seleccionado ? (ing.cantidad || 1) : 0
              };
            }));



          } else {
            this.ingredientesDisponibles.set([]);

            if (response.mensaje) {
            }
          }

          this.cargandoIngredientes.set(false);
          this.ingredientesCargados.set(true);
        },
        error: (error) => {
          this.ingredientesDisponibles.set([]);

          this.cargandoIngredientes.set(false);
          this.ingredientesCargados.set(true);

          if (error.status === 404) {
          } else if (error.status === 500) {
          }
        }
      });

    } catch (error) {
      this.ingredientesDisponibles.set([]);

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

    const tienePrecionTamano = this.route.snapshot.queryParams['tamano_precio'];
    if (!tienePrecionTamano) {
      this.precioProducto = Number(producto.precio) || this.precioProducto;
    } else {
    }

    if (producto.imagenUrl || producto.imagen_url) {
      this.imagenProducto = this.catalogoService.getFullImageUrl(
        producto.imagenUrl || producto.imagen_url
      );
    }

  }

  private actualizarPrecioConIngredientes(): void {
    const ingredientesExtra = this.ingredientesDisponibles().filter(ing =>
      ing.seleccionado && !ing.esOriginal && ing.precio && ing.precio > 0
    );

    const precioIngredientesExtra = ingredientesExtra.reduce((total, ing) => total + (ing.precio || 0), 0);

  }

  private obtenerResumenPersonalizaciones(): any {
    const ingredientes = this.ingredientesDisponibles();
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



  toggleIngrediente(ingrediente: IngredientePersonalizacion): void {
    if (ingrediente.cantidad === 0) {
      ingrediente.cantidad = 1;
      ingrediente.seleccionado = true;
    } else {
      ingrediente.cantidad = 0;
      ingrediente.seleccionado = false;
    }

    this.ingredientesDisponibles.update(ingredients => [...ingredients]);

  }


  aumentarCantidad(): void {
    this.cantidad.update(value => value + 1);
  }

  disminuirCantidad(): void {
    if (this.cantidad() > 1) {
      this.cantidad.update(value => value - 1);
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
      personalizaciones
    );

    let mensaje = `✅ ${this.nombreProducto} agregado al carrito!\n`;
    mensaje += `Cantidad: ${cantidadFinal}\n`;
    mensaje += `Precio total: $${precioTotal.toFixed(2)}`;


    // 🔧 RESETEAR estado INMEDIATAMENTE después de agregar
    this.procesandoConfirmacion = false;
    this.modoEdicion = false;
    
    // 🔧 NAVEGAR con un pequeño delay para asegurar que el estado se resetea
    setTimeout(() => {
      this.volverAlMenu();
    }, 100);
  }


  cancelarPedido(): void {
    this.volverAlMenu();
  }

  continuar(): void {
    // Aquí podrías navegar a la siguiente página del flujo de pedido
    this.volverAlMenu();
  }

  aumentarIngrediente(ingrediente: IngredientePersonalizacion): void {
    ingrediente.cantidad++;
    ingrediente.seleccionado = ingrediente.cantidad > 0;

    this.ingredientesDisponibles.update(ingredientes => [...ingredientes]);

  }


  disminuirIngrediente(ingrediente: IngredientePersonalizacion): void {
  if (ingrediente.esOriginal) {
    if (ingrediente.cantidad > 1) {
      ingrediente.cantidad--;
      ingrediente.seleccionado = ingrediente.cantidad > 0;
    }
  } else {
    if (ingrediente.cantidad > 0) {
      ingrediente.cantidad--;
      ingrediente.seleccionado = ingrediente.cantidad > 0;
    }
  }
  this.ingredientesDisponibles.update(ingredients => [...ingredients]);
}



  private obtenerPersonalizacionesParaPedido(): PersonalizacionIngrediente[] {
    const personalizaciones: PersonalizacionIngrediente[] = [];
    const ingredientes = this.ingredientesDisponibles();


    ingredientes.forEach(ing => {
      if (ing.esOriginal) {
        // INGREDIENTES BASE (ORIGINALES)
        if (ing.cantidad === 0) {
          // Ingrediente base removido completamente
          personalizaciones.push({
            ingrediente_id: ing.id,
            accion: 'quitar',
            precio_aplicado: 0
          });
        } else if (ing.cantidad > (ing.cantidadBase || 1)) {
          // Ingrediente base con cantidad extra
          const cantidadBase = ing.cantidadBase || 1;
          const cantidadExtra = ing.cantidad - cantidadBase;
          for (let i = 0; i < cantidadExtra; i++) {
            personalizaciones.push({
              ingrediente_id: ing.id,
              accion: 'agregar',
              precio_aplicado: ing.precio || 0
            });
          }
        }
        // Si cantidad === cantidadBase, no se agrega nada (está como viene por defecto)
      } else {
        // INGREDIENTES NO ORIGINALES (OPCIONALES)
        const cantidadBase = ing.cantidadBase || 0; // Cantidad incluida en el producto

        if (ing.cantidad === 0 && cantidadBase > 0) {
          // Ingrediente incluido que fue removido
          for (let i = 0; i < cantidadBase; i++) {
            personalizaciones.push({
              ingrediente_id: ing.id,
              accion: 'quitar',
              precio_aplicado: 0
            });
          }
        } else if (ing.cantidad > cantidadBase) {
          // Solo agregar la cantidad EXTRA por encima de lo incluido
          const cantidadExtra = ing.cantidad - cantidadBase;
          for (let i = 0; i < cantidadExtra; i++) {
            personalizaciones.push({
              ingrediente_id: ing.id,
              accion: 'agregar',
              precio_aplicado: ing.precio || 0
            });
          }

          if (cantidadBase > 0) {
          } else {
          }
        }
        // Si cantidad === cantidadBase, no se agrega nada (está como viene incluido)
      }
    });


    return personalizaciones;
  }

  public hayAlMenosUnIngredienteSeleccionado(): boolean {
    return this.ingredientesDisponibles().some(ing => ing.cantidad > 0);
  }

  obtenerTooltipDisminuir(ingrediente: IngredientePersonalizacion): string {
    if (ingrediente.esOriginal) {
      if (ingrediente.cantidad <= 1) {
        return `${ingrediente.nombre} es un ingrediente base y no se puede quitar completamente`;
      } else {
        return `Disminuir cantidad de ${ingrediente.nombre} (mínimo 1)`;
      }
    } else {
      if (ingrediente.cantidad <= 0) {
        return `${ingrediente.nombre} ya está en cantidad 0`;
      } else {
        return `Disminuir cantidad de ${ingrediente.nombre}`;
      }
    }
  }

}
