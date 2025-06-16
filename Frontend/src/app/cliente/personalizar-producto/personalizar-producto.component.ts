import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogoService } from '../../services/catalogo.service';

@Component({
  selector: 'app-personalizar-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personalizar-producto.component.html',
  styleUrls: ['./personalizar-producto.component.scss']
})
export class PersonalizarProductoComponent implements OnInit {

  // ✅ Inject services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogoService = inject(CatalogoService);

  // ✅ Propiedades del componente con signals
  productoId: number | null = null;
  cantidad = signal<number>(1); // ✅ CAMBIAR a signal
  nombreProducto: string = '';
  precioProducto: number = 0;
  categoriaProducto: number | null = null;
  descripcionProducto: string = '';
  imagenProducto: string = '';
  nombreCategoria: string = '';

  // ✅ NUEVO: Computed para precio total
  precioTotalCalculado = computed(() => {
    return this.precioProducto * this.cantidad();
  });

  // ✅ Datos adicionales del producto
  productoDatos: any = null;
  categoriaDatos: any = null;

  ngOnInit(): void {
    // ✅ Obtener ID del producto desde la URL
    this.productoId = Number(this.route.snapshot.paramMap.get('id'));

    // ✅ Obtener parámetros adicionales desde queryParams
    this.route.queryParams.subscribe(params => {
      const cantidadInicial = Number(params['cantidad']) || 1;
      this.cantidad.set(cantidadInicial); // ✅ USAR signal
      this.nombreProducto = params['nombre'] || '';
      this.precioProducto = Number(params['precio']) || 0;
      this.categoriaProducto = Number(params['categoria']) || null;

      console.log('🎨 Datos recibidos para personalización:', {
        id: this.productoId,
        cantidad: this.cantidad(),
        nombre: this.nombreProducto,
        precio: this.precioProducto,
        categoria: this.categoriaProducto,
        precioTotal: this.precioTotalCalculado()
      });

      // ✅ Cargar datos completos del producto
      this.cargarDatosCompletos();
    });
  }

  // ✅ NUEVO: Método para aumentar cantidad
  aumentarCantidad(): void {
    this.cantidad.update(value => value + 1);
    console.log('➕ Cantidad aumentada a:', this.cantidad(), '- Total:', this.precioTotalCalculado());
  }

  // ✅ NUEVO: Método para disminuir cantidad
  disminuirCantidad(): void {
    if (this.cantidad() > 1) {
      this.cantidad.update(value => value - 1);
      console.log('➖ Cantidad disminuida a:', this.cantidad(), '- Total:', this.precioTotalCalculado());
    }
  }

  // ✅ NUEVO: Cargar datos completos del producto y categoría
  private cargarDatosCompletos(): void {
    if (!this.productoId) {
      console.error('❌ No se proporcionó ID de producto');
      this.volverAlMenu();
      return;
    }

    // Cargar datos del producto y categoría
    Promise.all([
      this.cargarProductoDetalle(),
      this.cargarCategoriaDetalle()
    ]).then(() => {
      console.log('✅ Datos completos cargados');
    }).catch(error => {
      console.error('❌ Error cargando datos:', error);
    });
  }

  // ✅ NUEVO: Cargar detalles del producto desde la API
  private async cargarProductoDetalle(): Promise<void> {
    try {
      // Si ya tenemos algunos datos básicos, usarlos mientras cargamos los completos
      this.establecerDatosIniciales();

      // Intentar cargar datos completos del producto
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
          // Mantener datos básicos si falla la carga
        }
      });
    } catch (error) {
      console.error('❌ Error en cargarProductoDetalle:', error);
    }
  }

  // ✅ NUEVO: Cargar detalles de la categoría
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

  // ✅ NUEVO: Establecer datos iniciales desde queryParams
  private establecerDatosIniciales(): void {
    // Establecer imagen placeholder por ahora
    this.imagenProducto = 'assets/placeholder-producto.png';

    // Si no tenemos descripción, poner placeholder
    if (!this.descripcionProducto) {
      this.descripcionProducto = 'Delicioso producto preparado con ingredientes frescos y de alta calidad.';
    }
  }

  // ✅ NUEVO: Actualizar datos del producto con info completa
  private actualizarDatosProducto(producto: any): void {
    this.nombreProducto = producto.nombre || this.nombreProducto;
    this.descripcionProducto = producto.descripcion || this.descripcionProducto;
    this.precioProducto = Number(producto.precio) || this.precioProducto;

    // Actualizar imagen del producto
    if (producto.imagenUrl || producto.imagen_url) {
      this.imagenProducto = this.catalogoService.getFullImageUrl(
        producto.imagenUrl || producto.imagen_url
      );
    }

    console.log('✅ Datos del producto actualizados:', {
      nombre: this.nombreProducto,
      precio: this.precioProducto,
      descripcion: this.descripcionProducto,
      imagen: this.imagenProducto,
      cantidadActual: this.cantidad(),
      precioTotal: this.precioTotalCalculado()
    });
  }

  // ✅ ACTUALIZAR: Método para agregar producto personalizado al carrito
  agregarAlCarrito(): void {
    const cantidadFinal = this.cantidad();
    const precioTotal = this.precioTotalCalculado();

    console.log('🛒 Agregando producto personalizado al carrito:', {
      id: this.productoId,
      nombre: this.nombreProducto,
      cantidad: cantidadFinal,
      precioUnitario: this.precioProducto,
      precioTotal: precioTotal,
      personalizaciones: 'aquí irían las personalizaciones'
    });

    // Mostrar confirmación temporal
    alert(`✅ ${this.nombreProducto} agregado al carrito!\nCantidad: ${cantidadFinal}\nPrecio total: $${precioTotal.toFixed(2)}`);

    // Aquí implementarías la lógica real para agregar al carrito
    // this.pedidoService.agregarProductoPersonalizado(this.productoId, this.precioProducto, cantidadFinal, personalizaciones...)

    // Regresar al menú después de agregar
    this.volverAlMenu();
  }

  // ✅ Método para volver al menú
  volverAlMenu(): void {
    this.router.navigate(['/cliente/menu']);
  }

  // ✅ Método para cancelar pedido
  cancelarPedido(): void {
    console.log('🛒 Cancelando pedido...');
    this.volverAlMenu();
  }

  // ✅ Método para continuar
  continuar(): void {
    console.log('🚀 Continuando...');
    this.volverAlMenu();
  }
}
