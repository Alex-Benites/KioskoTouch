import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, Routes, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';

// Importar componentes standalone
import { ProductosComponent } from '../administrador/productos/productos.component';
import { UsuariosComponent } from '../administrador/usuarios/usuarios.component';
import { HomeComponent } from '../administrador/home/home.component';
import { LoginComponent } from '../administrador/login/login.component';
import { UnauthorizedComponent } from '../shared/unauthorized/unauthorized.component';
import { HeaderAdminComponent } from '../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../shared/footer-admin/footer-admin.component';

// Importar servicios
import { AuthService } from '../services/auth.service';

// Rutas de prueba para navegación de administrador
const testRoutes: Routes = [
  { path: 'administrador/home', component: HomeComponent },
  { path: 'administrador/gestion-productos', component: ProductosComponent },
  { path: 'administrador/gestion-usuarios', component: UsuariosComponent },
  { path: 'administrador/login', component: LoginComponent },
  { path: 'administrador/unauthorized', component: UnauthorizedComponent }
];

// Mock de AuthService simple
class MockAuthService {
  isAuthenticated() { return true; }
  getCurrentUser() { return null; }
  logout() { return Promise.resolve(); }
}

describe('Navegación Administrador (Integración)', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        // Componentes standalone
        ProductosComponent,
        UsuariosComponent,
        HomeComponent,
        LoginComponent,
        UnauthorizedComponent,
        HeaderAdminComponent,
        FooterAdminComponent
      ],
      providers: [
        provideRouter(testRoutes),
        provideHttpClient(),
        { provide: AuthService, useClass: MockAuthService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('debe navegar del home a productos correctamente', async () => {
    // Navegar al home
    await router.navigate(['/administrador/home']);
    
    // Navegar a productos
    await router.navigate(['/administrador/gestion-productos']);
    
    expect(location.path()).toBe('/administrador/gestion-productos');
  });

  it('debe navegar del home a usuarios correctamente', async () => {
    // Navegar al home
    await router.navigate(['/administrador/home']);
    
    // Navegar a usuarios
    await router.navigate(['/administrador/gestion-usuarios']);
    
    expect(location.path()).toBe('/administrador/gestion-usuarios');
  });

  it('debe permitir volver al home desde productos', async () => {
    // Navegar a productos
    await router.navigate(['/administrador/gestion-productos']);
    
    // Navegar al home
    await router.navigate(['/administrador/home']);
    
    expect(location.path()).toBe('/administrador/home');
  });

  it('debe permitir volver al home desde usuarios', async () => {
    // Navegar a usuarios
    await router.navigate(['/administrador/gestion-usuarios']);
    
    // Navegar al home
    await router.navigate(['/administrador/home']);
    
    expect(location.path()).toBe('/administrador/home');
  });

  it('debe manejar correctamente la navegación a login', async () => {
    // Navegar al login
    await router.navigate(['/administrador/login']);
    
    expect(location.path()).toBe('/administrador/login');
  });

  it('debe manejar correctamente la navegación a unauthorized', async () => {
    // Navegar a unauthorized
    await router.navigate(['/administrador/unauthorized']);
    
    expect(location.path()).toBe('/administrador/unauthorized');
  });

  it('debe permitir navegación entre múltiples secciones', async () => {
    // Secuencia de navegación típica de un administrador
    await router.navigate(['/administrador/home']);
    expect(location.path()).toBe('/administrador/home');

    await router.navigate(['/administrador/gestion-productos']);
    expect(location.path()).toBe('/administrador/gestion-productos');

    await router.navigate(['/administrador/gestion-usuarios']);
    expect(location.path()).toBe('/administrador/gestion-usuarios');

    await router.navigate(['/administrador/home']);
    expect(location.path()).toBe('/administrador/home');
  });
});