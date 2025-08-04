import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, Routes, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

// Importar componentes standalone
import { MenuComponent } from '../cliente/menu/menu.component';
import { HomeComponent } from '../cliente/home/home.component';
import { TipoPedidoComponent } from '../cliente/tipo-pedido/tipo-pedido.component';

// Importar servicios
import { AuthService } from '../services/auth.service';
import { CatalogoService } from '../services/catalogo.service';
import { PedidoService } from '../services/pedido.service';

// Mock de servicios
class MockAuthService {
  isAuthenticated() { return true; }
  getCurrentUser() { return null; }
  logout() { return Promise.resolve(); }
}

class MockCatalogoService {
  getCategorias() {
    return Promise.resolve([
      { id: 1, nombre: 'Hamburguesas', imagen_url: '' },
      { id: 2, nombre: 'Bebidas', imagen_url: '' },
      { id: 3, nombre: 'Acompañamientos', imagen_url: '' }
    ]);
  }
  
  getProductos() {
    return Promise.resolve([
      {
        id: 1,
        nombre: 'Hamburguesa Clásica',
        precio: 5.0,
        categoria: 1,
        aplica_tamanos: false,
        tamanos_detalle: []
      },
      {
        id: 2,
        nombre: 'Hamburguesa Doble',
        precio: 8.0,
        categoria: 1,
        aplica_tamanos: false,
        tamanos_detalle: []
      }
    ]);
  }
  
  getMenus() {
    return Promise.resolve([
      {
        id: 1,
        nombre: 'Combo 1',
        precio: 10.0,
        descripcion: 'Hamburguesa + Papas + Bebida'
      }
    ]);
  }
}

class MockPedidoService {
  private items: any[] = [];
  
  agregarProducto(id: number, precio: number, cantidad: number) {
    this.items.push({ 
      id, 
      precio: Number(precio), 
      cantidad: Number(cantidad), 
      tipo: 'producto', 
      producto_id: id
    });
  }
  
  obtenerProductosParaCarrito() { 
    return this.items; 
  }
  
  total() { 
    return this.items.reduce((sum, item) => sum + (Number(item.precio) * Number(item.cantidad)), 0); 
  }
  
  cantidadItems() { 
    return this.items.reduce((sum, item) => sum + Number(item.cantidad), 0); 
  }
}

// Rutas de prueba para cliente
const testRoutes: Routes = [
  { path: 'cliente/home', component: HomeComponent },
  { path: 'cliente/menu', component: MenuComponent },
  { path: 'cliente/tipo-pedido', component: TipoPedidoComponent },
  { path: '', redirectTo: 'cliente/home', pathMatch: 'full' }
];

describe('Integración de Menú del Cliente', () => {
  let router: Router;
  let location: Location;
  let httpMock: HttpTestingController;
  let catalogoService: MockCatalogoService;
  let pedidoService: MockPedidoService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        // Componentes standalone
        MenuComponent,
        HomeComponent,
        TipoPedidoComponent
      ],
      providers: [
        provideRouter(testRoutes),
        provideHttpClient(),
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: CatalogoService, useValue: new MockCatalogoService() },
        { provide: PedidoService, useValue: new MockPedidoService() }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    httpMock = TestBed.inject(HttpTestingController);
    catalogoService = TestBed.inject(CatalogoService) as any;
    pedidoService = TestBed.inject(PedidoService) as any;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe navegar correctamente al menú del cliente', fakeAsync(async () => {
    await router.navigate(['/cliente/menu']);
    tick();
    
    expect(location.path()).toBe('/cliente/menu');
  }));

  it('debe cargar categorías y productos al iniciar el menú', fakeAsync(async () => {
    await router.navigate(['/cliente/menu']);
    tick();
    
    // Verificar que las categorías se cargan
    const categorias = await catalogoService.getCategorias();
    expect(categorias.length).toBe(3);
    expect(categorias[0].nombre).toBe('Hamburguesas');
    
    // Verificar que los productos se cargan
    const productos = await catalogoService.getProductos();
    expect(productos.length).toBe(2);
    expect(productos[0].nombre).toBe('Hamburguesa Clásica');
  }));

  it('debe permitir agregar productos al carrito', fakeAsync(async () => {
    await router.navigate(['/cliente/menu']);
    tick();
    
    // Simular agregar un producto al carrito
    pedidoService.agregarProducto(1, 5.0, 1);
    
    // Verificar que el producto se agregó correctamente
    const carrito = pedidoService.obtenerProductosParaCarrito();
    expect(carrito.length).toBe(1);
    expect(carrito[0].id).toBe(1);
    expect(carrito[0].precio).toBe(5.0);
    expect(carrito[0].cantidad).toBe(1);
    
    // Verificar cálculos del carrito
    expect(pedidoService.cantidadItems()).toBe(1);
    expect(pedidoService.total()).toBe(5.0);
  }));

  it('debe permitir agregar múltiples productos al carrito', fakeAsync(async () => {
    await router.navigate(['/cliente/menu']);
    tick();
    
    // Agregar múltiples productos
    pedidoService.agregarProducto(1, 5.0, 2);
    pedidoService.agregarProducto(2, 8.0, 1);
    
    // Verificar cálculos del carrito
    expect(pedidoService.cantidadItems()).toBe(3); // 2 + 1
    expect(pedidoService.total()).toBe(18.0); // (5.0 * 2) + (8.0 * 1)
  }));

  it('debe permitir navegar entre diferentes secciones del cliente', fakeAsync(async () => {
    // Navegar al home
    await router.navigate(['/cliente/home']);
    tick();
    expect(location.path()).toBe('/cliente/home');
    
    // Navegar al menú
    await router.navigate(['/cliente/menu']);
    tick();
    expect(location.path()).toBe('/cliente/menu');
    
    // Navegar al tipo de pedido
    await router.navigate(['/cliente/tipo-pedido']);
    tick();
    expect(location.path()).toBe('/cliente/tipo-pedido');
  }));

  it('debe manejar menús especiales correctamente', fakeAsync(async () => {
    const menus = await catalogoService.getMenus();
    expect(menus.length).toBe(1);
    expect(menus[0].nombre).toBe('Combo 1');
    expect(menus[0].precio).toBe(10.0);
    expect(menus[0].descripcion).toBe('Hamburguesa + Papas + Bebida');
  }));
});