import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { Producto, Categoria } from '../../models/catalogo.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit, OnDestroy {
  
  // ✅ Signals usando los modelos reales
  private categorias = signal<Categoria[]>([
    { 
      id: 1, 
      nombre: 'Hamburguesas', 
      imagen_url: 'img/cliente/hamburguesa1-home.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 2, 
      nombre: 'Postres', 
      imagen_url: 'img/cliente/Sundae.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 3, 
      nombre: 'Bebidas', 
      imagen_url: 'img/cliente/bebida.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
  
  private productos = signal<Producto[]>([
    { 
      id: 1,
      nombre: 'Wendy Burguer', 
      descripcion: 'Deliciosa hamburguesa con carne de res',
      precio: 5.99, 
      categoria: 1,
      estado: 1,
      imagenUrl: 'img/cliente/WendyBurger.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 2,
      nombre: 'Chiken Box', 
      descripcion: 'Box de pollo crujiente con papas',
      precio: 5.99, 
      categoria: 1,
      estado: 1,
      imagenUrl: 'img/cliente/ChikenBox.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 3,
      nombre: 'Cono Triple', 
      descripcion: 'Helado de tres sabores en cono',
      precio: 3.50, 
      categoria: 2,
      estado: 1,
      imagenUrl: 'img/cliente/ConoTriple.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 4,
      nombre: 'Coca Cola', 
      descripcion: 'Refrescante bebida gaseosa',
      precio: 2.00, 
      categoria: 3,
      estado: 1,
      imagenUrl: 'img/cliente/cocacola.png',
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

  agregarProducto(producto: Producto): void {
    console.log('🛒 Agregando producto:', producto.nombre);
    
    this.pedidoService.agregarProducto(
      producto.id,
      producto.precio,
      1
    );
    
    console.log('✅ Producto agregado. Total actual:', this.totalPedidoSeguro);
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

  obtenerImagenProducto(producto: Producto): string {
    return producto.imagenUrl || 'assets/placeholder-producto.png';
  }

  obtenerImagenCategoria(categoria: Categoria): string {
    return categoria.imagen_url || 'assets/placeholder-categoria.png';
  }
}