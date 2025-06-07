import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { Producto, Categoria } from '../../models/catalogo.model';

// ✅ Interfaz extendida para productos con badges promocionales
interface ProductoConBadge extends Producto {
  promoBadge?: string;
  promoBadgeClass?: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit, OnDestroy {
  
  // ✅ Categorías mock expandidas
  private categorias = signal<Categoria[]>([
    { 
      id: 1, 
      nombre: 'Hamburguesas', 
      imagen_url: 'img/cliente/hamburguesa-icon.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 2, 
      nombre: 'Papas', 
      imagen_url: 'img/cliente/papas-icon.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 3, 
      nombre: 'Pizza', 
      imagen_url: 'img/cliente/pizza-icon.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 4, 
      nombre: 'Pollo', 
      imagen_url: 'img/cliente/pollo-icon.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 5, 
      nombre: 'Ensaladas', 
      imagen_url: 'img/cliente/ensalada-icon.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 6, 
      nombre: 'Bebidas', 
      imagen_url: 'img/cliente/bebida-icon.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
  
  // ✅ Productos mock - SOLO con badges de descuento (rojos)
  private productos = signal<ProductoConBadge[]>([
    // HAMBURGUESAS (categoria: 1)
    { 
      id: 1,
      nombre: 'Cheese Burger', 
      descripcion: 'Deliciosa hamburguesa con queso cheddar',
      precio: 4.75, 
      categoria: 1,
      estado: 1,
      imagenUrl: 'img/cliente/cheese-burger.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 2,
      nombre: 'Vegetable Burger', 
      descripcion: 'Hamburguesa 100% vegetariana',
      precio: 3.50, 
      categoria: 1,
      estado: 1,
      imagenUrl: 'img/cliente/vegetable-burger.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 3,
      nombre: 'Meet Burger', 
      descripcion: 'Hamburguesa clásica de carne',
      precio: 3.50, 
      categoria: 1,
      estado: 1,
      imagenUrl: 'img/cliente/meet-burger.png',
      promoBadge: '10%',
      promoBadgeClass: 'discount',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 4,
      nombre: 'Double Cheese Burger', 
      descripcion: 'Doble carne, doble queso',
      precio: 6.25, 
      categoria: 1,
      estado: 1,
      imagenUrl: 'img/cliente/double-cheese-burger.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 5,
      nombre: 'BBQ Burger', 
      descripcion: 'Hamburguesa con salsa BBQ',
      precio: 5.50, 
      categoria: 1,
      estado: 1,
      imagenUrl: 'img/cliente/bbq-burger.png',
      promoBadge: '15%',
      promoBadgeClass: 'discount',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 6,
      nombre: 'Bacon Burger', 
      descripcion: 'Hamburguesa con bacon crujiente',
      precio: 5.75, 
      categoria: 1,
      estado: 1,
      imagenUrl: 'img/cliente/bacon-burger.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // PAPAS (categoria: 2)
    { 
      id: 7,
      nombre: 'Papas Medianas', 
      descripcion: 'Papas fritas doradas y crujientes',
      precio: 2.50, 
      categoria: 2,
      estado: 1,
      imagenUrl: 'img/cliente/papas-medianas.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 8,
      nombre: 'Papas Grandes', 
      descripcion: 'Porción grande de papas fritas',
      precio: 3.25, 
      categoria: 2,
      estado: 1,
      imagenUrl: 'img/cliente/papas-grandes.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 9,
      nombre: 'Papas con Queso', 
      descripcion: 'Papas cubiertas con queso derretido',
      precio: 4.00, 
      categoria: 2,
      estado: 1,
      imagenUrl: 'img/cliente/papas-queso.png',
      promoBadge: '20%',
      promoBadgeClass: 'discount',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 10,
      nombre: 'Papas con Bacon', 
      descripcion: 'Papas con bacon y queso',
      precio: 4.75, 
      categoria: 2,
      estado: 1,
      imagenUrl: 'img/cliente/papas-bacon.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // PIZZAS (categoria: 3)
    { 
      id: 11,
      nombre: 'Pizza Margarita', 
      descripcion: 'Pizza clásica con tomate y mozzarella',
      precio: 8.50, 
      categoria: 3,
      estado: 1,
      imagenUrl: 'img/cliente/pizza-margarita.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 12,
      nombre: 'Pizza Pepperoni', 
      descripcion: 'Pizza con pepperoni y queso',
      precio: 9.75, 
      categoria: 3,
      estado: 1,
      imagenUrl: 'img/cliente/pizza-pepperoni.png',
      promoBadge: '25%',
      promoBadgeClass: 'discount',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 13,
      nombre: 'Pizza Hawaiana', 
      descripcion: 'Pizza con jamón y piña',
      precio: 10.25, 
      categoria: 3,
      estado: 1,
      imagenUrl: 'img/cliente/pizza-hawaiana.png',
      promoBadge: '15%',
      promoBadgeClass: 'discount',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // POLLO (categoria: 4)
    { 
      id: 14,
      nombre: 'Chicken Wings', 
      descripcion: '8 alitas de pollo picantes',
      precio: 6.50, 
      categoria: 4,
      estado: 1,
      imagenUrl: 'img/cliente/chicken-wings.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 15,
      nombre: 'Chicken Strips', 
      descripcion: 'Tiras de pollo empanizadas',
      precio: 5.75, 
      categoria: 4,
      estado: 1,
      imagenUrl: 'img/cliente/chicken-strips.png',
      promoBadge: '30%',
      promoBadgeClass: 'discount',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 16,
      nombre: 'Pollo Entero', 
      descripcion: 'Pollo entero a la parrilla',
      precio: 12.99, 
      categoria: 4,
      estado: 1,
      imagenUrl: 'img/cliente/pollo-entero.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // ENSALADAS (categoria: 5)
    { 
      id: 17,
      nombre: 'Ensalada César', 
      descripcion: 'Lechuga, pollo, crutones y aderezo césar',
      precio: 4.50, 
      categoria: 5,
      estado: 1,
      imagenUrl: 'img/cliente/ensalada-cesar.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 18,
      nombre: 'Ensalada Griega', 
      descripcion: 'Tomate, pepino, aceitunas y queso feta',
      precio: 4.25, 
      categoria: 5,
      estado: 1,
      imagenUrl: 'img/cliente/ensalada-griega.png',
      promoBadge: '10%',
      promoBadgeClass: 'discount',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 19,
      nombre: 'Ensalada Mixta', 
      descripcion: 'Ensalada fresca con vegetales variados',
      precio: 3.75, 
      categoria: 5,
      estado: 1,
      imagenUrl: 'img/cliente/ensalada-mixta.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // BEBIDAS (categoria: 6)
    { 
      id: 20,
      nombre: 'Coca Cola', 
      descripcion: 'Refresco de cola 500ml',
      precio: 2.00, 
      categoria: 6,
      estado: 1,
      imagenUrl: 'img/cliente/coca-cola.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 21,
      nombre: 'Fanta Naranja', 
      descripcion: 'Refresco de naranja 500ml',
      precio: 2.00, 
      categoria: 6,
      estado: 1,
      imagenUrl: 'img/cliente/fanta.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 22,
      nombre: 'Agua Natural', 
      descripcion: 'Agua purificada 500ml',
      precio: 1.50, 
      categoria: 6,
      estado: 1,
      imagenUrl: 'img/cliente/agua.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 23,
      nombre: 'Jugo de Naranja', 
      descripcion: 'Jugo natural de naranja 300ml',
      precio: 2.75, 
      categoria: 6,
      estado: 1,
      imagenUrl: 'img/cliente/jugo-naranja.png',
      promoBadge: '5%',
      promoBadgeClass: 'discount',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 24,
      nombre: 'Café Americano', 
      descripcion: 'Café negro americano caliente',
      precio: 1.75, 
      categoria: 6,
      estado: 1,
      imagenUrl: 'img/cliente/cafe.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  // ✅ Estado del componente con signals
  categoriaSeleccionada = signal<number>(1);
  mostrarPopupLogin = signal<boolean>(false);
  idioma = signal<string>('es');

  // ✅ Inject moderno Angular 19
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private pedidoService = inject(PedidoService);

  // ✅ Computed signals
  categoriaActualObj = computed(() => 
    this.categorias().find(cat => cat.id === this.categoriaSeleccionada())
  );

  productosFiltrados = computed(() => 
    this.productos().filter(p => 
      p.categoria === this.categoriaSeleccionada() && p.estado === 1
    )
  );

  // ✅ Getters para el template
  get categoriasLista() { return this.categorias(); }
  get categoriaActual() { return this.categoriaActualObj(); }
  get productosActuales() { return this.productosFiltrados(); }
  get mostrarLogin() { return this.mostrarPopupLogin(); }
  get idiomaActual() { return this.idioma(); }

  // ✅ Acceso a signals del servicio con valores seguros
  get totalPedidoSeguro(): number {
    return this.pedidoService.total() || 0;
  }

  get cantidadItemsSeguro(): number {
    return this.pedidoService.cantidadItems() || 0;
  }

  get puedeontinuar(): boolean {
    return this.cantidadItemsSeguro > 0;
  }

  // ✅ Acceso directo a signals del servicio
  tipoPedido = this.pedidoService.tipoEntrega;
  resumenPedido = this.pedidoService.resumenPedido;
  totalPedido = this.pedidoService.total;
  cantidadItems = this.pedidoService.cantidadItems;

  ngOnInit() {
    this.renderer.addClass(document.body, 'fondo-home');
    
    const primeraCategoria = this.categorias()[0];
    if (primeraCategoria) {
      this.categoriaSeleccionada.set(primeraCategoria.id);
    }
    
    console.log('🍽️ MenuComponent inicializado');
    console.log('📝 Tipo de pedido:', this.tipoPedido());
    console.log('📄 Resumen:', this.resumenPedido());
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'fondo-home');
  }

  seleccionarCategoria(categoria: Categoria): void {
    this.categoriaSeleccionada.set(categoria.id);
    console.log('📂 Categoría seleccionada:', categoria.nombre);
    console.log('🛍️ Productos filtrados:', this.productosFiltrados().length);
  }

  abrirLoginPopup(): void {
    this.mostrarPopupLogin.set(true);
  }

  cerrarPopupLogin(): void {
    this.mostrarPopupLogin.set(false);
  }

  cambiarIdioma(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.idioma.set(target.value);
    console.log('🌐 Idioma cambiado a:', target.value);
  }

  agregarProducto(producto: ProductoConBadge): void {
    console.log('🛒 Agregando producto:', producto.nombre);
    
    this.pedidoService.agregarProducto(
      producto.id,
      producto.precio,
      1
    );
    
    console.log('✅ Producto agregado. Total actual:', this.totalPedidoSeguro);
  }

  // ✅ MÉTODO AGREGADO: limpiarPedido
  limpiarPedido(): void {
    this.pedidoService.limpiarPedido();
    console.log('🗑️ Pedido cancelado desde MenuComponent');
  }

  continuar(): void {
    const total = this.totalPedidoSeguro;
    const cantidad = this.cantidadItemsSeguro;
    
    if (cantidad > 0) {
      console.log(`🚀 Continuando con ${cantidad} productos, total: $${total}`);
      this.router.navigate(['/cliente/carrito']);
    } else {
      console.log('⚠️ No hay productos en el pedido');
    }
  }

  obtenerImagenProducto(producto: ProductoConBadge): string {
    return producto.imagenUrl || 'assets/placeholder-producto.png';
  }

  obtenerImagenCategoria(categoria: Categoria): string {
    return categoria.imagen_url || 'assets/placeholder-categoria.png';
  }
}