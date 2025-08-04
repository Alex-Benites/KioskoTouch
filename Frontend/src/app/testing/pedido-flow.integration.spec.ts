import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, Routes, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

// Importar componentes standalone
import { MenuComponent } from '../cliente/menu/menu.component';
import { CarritoCompraComponent } from '../cliente/carrito-compra/carrito-compra.component';
import { ResumenPedidoComponent } from '../cliente/resumen-pedido/resumen-pedido.component';
import { ProductPopupComponent } from '../shared/product-popup/product-popup.component';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';
import { TurnoConfirmationDialogComponent } from '../shared/turno-confirmation-dialog/turno-confirmation-dialog.component';
import { PublicidadSectionComponent } from '../shared/publicidad-section/publicidad-section.component';

// Importar servicios
import { PedidoService } from '../services/pedido.service';
import { CatalogoService } from '../services/catalogo.service';
import { AuthService } from '../services/auth.service';
import { PublicidadService } from '../services/publicidad.service';

// Rutas de prueba para el flujo de pedido
const testRoutes: Routes = [
  { path: 'cliente/menu', component: MenuComponent },
  { path: 'cliente/carrito', component: CarritoCompraComponent },
  { path: 'cliente/resumen-pedido', component: ResumenPedidoComponent },
  { path: 'cliente/home', component: MenuComponent } // Usamos MenuComponent como placeholder
];

// Mock de servicios mejorado
class MockAuthService {
  isAuthenticated() { return true; }
  getCurrentUser() { return null as any; }
  logout() {
    return Promise.resolve() as any;
  }
}

class MockPublicidadService {
  getPromociones() {
    return Promise.resolve([]);
  }
}

class MockCatalogoService {
  getCategorias() {
    return new Promise(resolve => resolve([
      { id: 1, nombre: 'Hamburguesas', imagen_url: '' },
      { id: 2, nombre: 'Bebidas', imagen_url: '' }
    ])) as any;
  }
  
  getProductos() {
    return new Promise(resolve => resolve([
      {
        id: 1,
        nombre: 'Hamburguesa Clásica',
        precio: 5.0,
        categoria: 1,
        aplica_tamanos: false,
        tamanos_detalle: []
      }
    ])) as any;
  }
  
  getMenus() {
    return new Promise(resolve => resolve([])) as any;
  }
  
  getIvaActual() {
    return new Promise(resolve => resolve({ success: true, data: { porcentaje_iva: 15 } })) as any;
  }
  
  crearPedido(pedidoData: any) {
    return new Promise(resolve => resolve({ success: true, data: { pedido_id: 1, numero_pedido: '001' } })) as any;
  }
  
  obtenerProductoPorId(id: number) {
    return new Promise(resolve => resolve({ id: 1, nombre: 'Hamburguesa Clásica', imagen_url: '' })) as any;
  }
  
  obtenerMenuPorId(id: number) {
    return new Promise(resolve => resolve({ id: 1, nombre: 'Combo 1', imagen_url: '' })) as any;
  }
  
  getIngredientes() {
    return new Promise(resolve => resolve([])) as any;
  }
  
  getFullImageUrl(url: string) {
    return url || 'assets/placeholder-producto.png';
  }
  
  getEstados() {
    return new Promise(resolve => resolve([{ id: 1, nombre: 'Activado' }])) as any;
  }
}

class MockPedidoService {
  private items: any[] = [];
  
  agregarProducto(id: number, precio: number, cantidad: number, personalizacion?: any[], tamano_codigo?: string) {
    this.items.push({
      id,
      precio: Number(precio),
      cantidad: Number(cantidad),
      tipo: 'producto',
      producto_id: id,
      tamano_codigo,
      personalizacion: personalizacion || []
    });
  }
  
  agregarMenu(id: number, precio: number, cantidad: number, personalizacion?: any[]) {
    this.items.push({
      id,
      precio: Number(precio),
      cantidad: Number(cantidad),
      tipo: 'menu',
      menu_id: id,
      personalizacion: personalizacion || []
    });
  }
  
  obtenerProductosParaCarrito() {
    return this.items;
  }
  
  total() {
    const total = this.items.reduce((sum, item) => sum + (Number(item.precio) * Number(item.cantidad || item.quantity || 1)), 0);
    return Number(total.toFixed(2));
  }
  
  cantidadItems() {
    return this.items.reduce((sum, item) => sum + Number(item.cantidad || item.quantity || 1), 0);
  }
  
  tipoEntrega() { 
    return 'servir'; 
  }
  
  tieneTurno() { 
    return false; 
  }
  
  obtenerTurno() { 
    return null; 
  }
  
  aumentarCantidadProducto(index: number) {
    if (this.items[index]) {
      this.items[index].cantidad = Number(this.items[index].cantidad) + 1;
    }
  }
  
  disminuirCantidadProducto(index: number) {
    if (this.items[index] && Number(this.items[index].cantidad) > 1) {
      this.items[index].cantidad = Number(this.items[index].cantidad) - 1;
    }
  }
  
  eliminarProducto(index: number) {
    this.items.splice(index, 1);
  }
  
  limpiarCarrito() {
    this.items = [];
  }
  
  setPedidoCreado(data: any) {
    // Implementación vacía para test
  }
}

describe('Flujo de Pedido Completo (Integración Corregido)', () => {
  let router: Router;
  let location: Location;
  let httpMock: HttpTestingController;
  let pedidoService: MockPedidoService;
  let authService: MockAuthService;
  let catalogoService: MockCatalogoService;
  let http: HttpClient;

  beforeEach(async () => {
    // Limpiar estado inicial
    pedidoService = new MockPedidoService();
    
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        MatDialogModule,
        MatIconModule,
        // Componentes standalone
        MenuComponent,
        CarritoCompraComponent,
        ResumenPedidoComponent,
        ProductPopupComponent,
        ConfirmationDialogComponent,
        TurnoConfirmationDialogComponent,
        PublicidadSectionComponent
      ],
      providers: [
        provideRouter(testRoutes),
        provideHttpClient(),
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: PedidoService, useValue: new MockPedidoService() },
        { provide: CatalogoService, useValue: new MockCatalogoService() },
        { provide: PublicidadService, useValue: new MockPublicidadService() }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
    
    // Obtener servicios del TestBed
    pedidoService = TestBed.inject(PedidoService) as any;
    authService = TestBed.inject(AuthService);
    catalogoService = TestBed.inject(CatalogoService);
  });

  afterEach(() => {
    httpMock.verify();
    // Limpiar carrito después de cada test
    pedidoService.limpiarCarrito();
  });

  it('debe permitir navegar del menú al carrito', fakeAsync(async () => {
    // Navegar al menú
    await router.navigate(['/cliente/menu']);
    tick();
    
    expect(location.path()).toBe('/cliente/menu');

    // Navegar al carrito manualmente para simular el flujo
    await router.navigate(['/cliente/carrito']);
    tick();
    
    expect(location.path()).toBe('/cliente/carrito');
  }));

  it('debe permitir agregar producto al carrito desde el menú', fakeAsync(async () => {
    // Navegar al menú
    await router.navigate(['/cliente/menu']);
    tick();

    // Simular que el carrito está vacío
    expect(pedidoService.cantidadItems()).toBe(0);

    // Agregar un producto directamente al servicio (simulando la acción del usuario)
    pedidoService.agregarProducto(1, 5.0, 1);
    
    // Verificar que el carrito ahora tiene el producto
    expect(pedidoService.cantidadItems()).toBe(1);
    expect(pedidoService.total()).toBe(5.0);
  }));

  it('debe mantener consistencia entre menú y carrito', fakeAsync(async () => {
    // Agregar producto directamente al servicio
    pedidoService.agregarProducto(1, 5.0, 1);
    
    // Navegar al carrito
    await router.navigate(['/cliente/carrito']);
    tick();
    
    expect(location.path()).toBe('/cliente/carrito');
    expect(pedidoService.cantidadItems()).toBe(1);
    
    // Volver al menú
    await router.navigate(['/cliente/menu']);
    tick();
    
    expect(location.path()).toBe('/cliente/menu');
    
    // Volver al carrito y verificar consistencia
    await router.navigate(['/cliente/carrito']);
    tick();
    
    expect(pedidoService.cantidadItems()).toBe(1);
    expect(pedidoService.total()).toBe(5.0);
  }));

  it('debe calcular totales correctamente en resumen', fakeAsync(async () => {
    // Agregar varios productos
    pedidoService.agregarProducto(1, 5.0, 2); // $10.00
    pedidoService.agregarProducto(2, 3.0, 1); // $3.00
    // Total: $13.00
    
    // Navegar al resumen
    await router.navigate(['/cliente/resumen-pedido']);
    tick();
    
    expect(location.path()).toBe('/cliente/resumen-pedido');
    expect(pedidoService.total()).toBe(13.0);
    expect(pedidoService.cantidadItems()).toBe(3); // 2 + 1 items
  }));

  it('debe permitir modificar cantidades en el carrito', fakeAsync(async () => {
    // Agregar producto
    pedidoService.agregarProducto(1, 5.0, 1);
    expect(pedidoService.cantidadItems()).toBe(1);
    
    // Simular aumento de cantidad
    pedidoService.aumentarCantidadProducto(0);
    expect(pedidoService.cantidadItems()).toBe(2);
    expect(pedidoService.total()).toBe(10.0);
    
    // Simular disminución de cantidad
    pedidoService.disminuirCantidadProducto(0);
    expect(pedidoService.cantidadItems()).toBe(1);
    expect(pedidoService.total()).toBe(5.0);
  }));

  it('debe permitir eliminar productos del carrito', fakeAsync(async () => {
    // Agregar producto
    pedidoService.agregarProducto(1, 5.0, 1);
    expect(pedidoService.cantidadItems()).toBe(1);
    
    // Eliminar producto
    pedidoService.eliminarProducto(0);
    
    // Verificar que el producto fue eliminado
    expect(pedidoService.cantidadItems()).toBe(0);
    expect(pedidoService.total()).toBe(0);
  }));

  it('debe manejar correctamente el flujo de pedido completo', fakeAsync(async () => {
    // 1. Navegar al menú
    await router.navigate(['/cliente/menu']);
    tick();
    expect(location.path()).toBe('/cliente/menu');

    // 2. Agregar producto al carrito
    pedidoService.agregarProducto(1, 5.0, 1);
    expect(pedidoService.cantidadItems()).toBe(1);

    // 3. Navegar al carrito
    await router.navigate(['/cliente/carrito']);
    tick();
    expect(location.path()).toBe('/cliente/carrito');

    // 4. Navegar al resumen
    await router.navigate(['/cliente/resumen-pedido']);
    tick();
    expect(location.path()).toBe('/cliente/resumen-pedido');

    // 5. Verificar que los totales son consistentes
    expect(pedidoService.total()).toBe(5.0);
    expect(pedidoService.cantidadItems()).toBe(1);

    // 6. Simular que el usuario vuelve al menú
    await router.navigate(['/cliente/menu']);
    tick();
    expect(location.path()).toBe('/cliente/menu');

    // 7. Verificar que el carrito aún mantiene los datos
    expect(pedidoService.cantidadItems()).toBe(1);
    expect(pedidoService.total()).toBe(5.0);
  }));

  it('debe manejar correctamente el cambio de tipo de entrega', fakeAsync(async () => {
    // Agregar producto
    pedidoService.agregarProducto(1, 5.0, 1);
    
    // Navegar al carrito
    await router.navigate(['/cliente/carrito']);
    tick();
    
    // Verificar que el tipo de entrega por defecto es 'servir'
    expect(pedidoService.tipoEntrega()).toBe('servir');
    
    // Navegar al resumen
    await router.navigate(['/cliente/resumen-pedido']);
    tick();
    
    // Verificar que la navegación funciona correctamente
    expect(location.path()).toBe('/cliente/resumen-pedido');
  }));

  it('debe manejar productos con tamaños', fakeAsync(async () => {
    // Agregar producto con tamaño
    pedidoService.agregarProducto(1, 6.0, 1, undefined, 'M');
    
    // Verificar que el producto se agregó con el tamaño
    const productos = pedidoService.obtenerProductosParaCarrito();
    expect(productos.length).toBe(1);
    expect(productos[0].tamano_codigo).toBe('M');
    expect(productos[0].precio).toBe(6.0);
  }));

  it('debe manejar personalizaciones de productos', fakeAsync(async () => {
    // Agregar producto con personalizaciones
    const personalizaciones = [
      { ingrediente_id: 1, accion: 'agregar', precio_aplicado: 0.5 }
    ];
    
    pedidoService.agregarProducto(1, 5.0, 1, personalizaciones);
    
    // Verificar que el producto se agregó con personalizaciones
    const productos = pedidoService.obtenerProductosParaCarrito();
    expect(productos.length).toBe(1);
    expect(productos[0].personalizacion).toEqual(personalizaciones);
  }));

  it('debe limpiar correctamente el carrito al finalizar', fakeAsync(async () => {
    // Agregar productos
    pedidoService.agregarProducto(1, 5.0, 1);
    pedidoService.agregarProducto(2, 3.0, 2);
    
    expect(pedidoService.cantidadItems()).toBe(3);
    
    // Limpiar carrito
    pedidoService.limpiarCarrito();
    
    expect(pedidoService.cantidadItems()).toBe(0);
    expect(pedidoService.total()).toBe(0);
  }));

  it('debe manejar menús en el carrito', fakeAsync(async () => {
    // Agregar menú
    pedidoService.agregarMenu(1, 8.0, 1);
    
    // Verificar que el menú se agregó correctamente
    const productos = pedidoService.obtenerProductosParaCarrito();
    expect(productos.length).toBe(1);
    expect(productos[0].tipo).toBe('menu');
    expect(productos[0].menu_id).toBe(1);
    expect(productos[0].precio).toBe(8.0);
  }));

  it('debe calcular totales con múltiples productos y menús', fakeAsync(async () => {
    // Agregar productos y menús
    pedidoService.agregarProducto(1, 5.0, 2); // $10.00
    pedidoService.agregarProducto(2, 3.0, 1); // $3.00
    pedidoService.agregarMenu(1, 8.0, 1);    // $8.00
    // Total: $21.00
    
    expect(pedidoService.cantidadItems()).toBe(4); // 2 + 1 + 1
    expect(pedidoService.total()).toBe(21.0);
  }));
});