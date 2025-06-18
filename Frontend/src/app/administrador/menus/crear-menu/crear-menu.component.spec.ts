import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearMenuComponent } from './crear-menu.component';

// Angular Material y dependencias usadas en el componente
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Mocks para servicios y router
import { CatalogoService } from '../../../services/catalogo.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

// Mocks para componentes hijos standalone
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';

// Mock de producto completo
const productoMock = {
  id: 1,
  nombre: 'Hamburguesa',
  descripcion: 'Hamburguesa clásica',
  precio: 5.99,
  categoria: 1,
  aplica_tamanos: false,
  estado: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  imagen_url: '',
  // agrega aquí cualquier otro campo que tu interfaz Producto requiera
};

describe('CrearMenuComponent', () => {
  let component: CrearMenuComponent;
  let fixture: ComponentFixture<CrearMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CrearMenuComponent,
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule,
        HeaderAdminComponent,
        FooterAdminComponent
      ],
      providers: [
        {
          provide: CatalogoService,
          useValue: {
            getEstados: () => of([{ id: 1, nombre: 'Activado' }]),
            getProductos: () => of([
              { id: 1, nombre: 'Hamburguesa', aplica_tamanos: false, estado: 1 }
            ]),
            getTamanos: () => of([]),
            getProductoImagen: () => of({ imagen_url: '' }),
            obtenerMenuPorId: () => of({})
          }
        },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CrearMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('el formulario debería ser inválido si está vacío', () => {
    expect(component.menuForm.valid).toBeFalse();
  });

  it('debería marcar error si el nombre está vacío', () => {
    const control = component.menuForm.get('nombre');
    control?.setValue('');
    control?.markAsTouched();
    fixture.detectChanges();
    expect(control?.invalid).toBeTrue();
  });

  it('debería marcar error si el precio es menor a 0.01', () => {
    const control = component.menuForm.get('precio');
    control?.setValue(0);
    control?.markAsTouched();
    fixture.detectChanges();
    expect(control?.invalid).toBeTrue();
  });

  it('debería marcar error si el precio es mayor a 1000', () => {
    const control = component.menuForm.get('precio');
    control?.setValue(1001);
    control?.markAsTouched();
    fixture.detectChanges();
    expect(control?.invalid).toBeTrue();
  });

  it('debería ser válido con datos correctos', () => {
    component.menuForm.patchValue({
      nombre: 'Menú Test',
      descripcion: 'Descripción de prueba',
      precio: 9.99,
      tipo_menu: 'pequeno',
      estado: 1,
      productos: [{ producto: 1, cantidad: 1 }]
    });
    expect(component.menuForm.valid).toBeTrue();
  });

  it('debería agregar un producto a productosSeleccionados', () => {
    component.productos = [productoMock];
    component.productosSeleccionados = [];
    component.agregarProducto(productoMock);
    expect(component.productosSeleccionados.length).toBe(1);
    expect(component.productosSeleccionados[0].producto).toBe(1);
  });

  it('debería limpiar productos seleccionados al llamar eliminarProductos', () => {
    component.productosSeleccionados = [{ producto: 1, cantidad: 1 }];
    component.eliminarProductos();
    expect(component.productosSeleccionados.length).toBe(0);
  });

  it('debería mostrar el texto correcto de productos seleccionados', () => {
    component.productos = [productoMock];
    component.tamanos = [];
    component.productosSeleccionados = [{ producto: 1, cantidad: 2 }];
    expect(component.productosSeleccionadosTexto).toContain('Hamburguesa (x2)');
  });
});
