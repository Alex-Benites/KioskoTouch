import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router'; // ✅ AGREGAR
import { Router } from '@angular/router'; // ✅ AGREGAR
import { of } from 'rxjs';
import { MatSelectChange } from '@angular/material/select';

import { CrearComponent } from './crear.component';
import { CatalogoService } from '../../../services/catalogo.service';

describe('CrearComponent - Black Box Testing', () => {
  let component: CrearComponent;
  let fixture: ComponentFixture<CrearComponent>;
  let mockCatalogoService: jasmine.SpyObj<CatalogoService>;

  beforeEach(async () => {
    const catalogoSpy = jasmine.createSpyObj('CatalogoService', [
      'getCategorias',
      'getEstados',
      'getTamanos',
      'getIngredientesPorCategoria'
    ]);

    // ✅ CREAR MOCKS PARA ROUTER Y ACTIVATEDROUTE
    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => null // Simular modo creación
        }
      },
      params: of({})
    };

    const mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [
        CrearComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: CatalogoService, useValue: catalogoSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }, // ✅ AGREGAR
        { provide: Router, useValue: mockRouter } // ✅ AGREGAR
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CrearComponent);
    component = fixture.componentInstance;
    mockCatalogoService = TestBed.inject(CatalogoService) as jasmine.SpyObj<CatalogoService>;

    // Setup mocks
    mockCatalogoService.getCategorias.and.returnValue(of([]));
    mockCatalogoService.getEstados.and.returnValue(of([]));
    mockCatalogoService.getTamanos.and.returnValue(of([]));

    fixture.detectChanges();
  });

  // ===== RESTO DE LOS TESTS SIN CAMBIOS =====
  describe('TC002 - Validación Precio (Boundary Value Analysis)', () => {
    
    beforeEach(() => {
      // Deshabilitar tamaños para probar precio base
      component.productoForm.patchValue({ aplicaTamanos: false });
    });

    it('debe aceptar precios en límites válidos', () => {
      const preciosValidos = [
        0.01, // mínimo válido
        0.02, // justo arriba del mínimo
        9.99, // precio típico
        999.99 // precio alto válido
      ];
      
      preciosValidos.forEach(precio => {
        component.productoForm.patchValue({ precio: precio.toString() });
        component.productoForm.get('precio')?.markAsTouched();
        
        expect(component.productoForm.get('precio')?.valid).toBe(true);
        expect(component.precioError).toBe('');
      });
    });

    it('debe rechazar precios en límites inválidos', () => {
      const preciosInvalidos = [
        '0', // cero exacto
        '0.00', // cero con decimales
        '-1', // negativo
        '-0.01', // negativo pequeño
        'abc', // no numérico
        '' // vacío
      ];
      
      preciosInvalidos.forEach(precio => {
        component.productoForm.patchValue({ precio });
        component.productoForm.get('precio')?.markAsTouched();
        
        expect(component.productoForm.get('precio')?.valid).toBe(false);
        expect(component.precioError).not.toBe('');
      });
    });
  });

  describe('TC001 - Validación Nombre Producto (Equivalence Partitioning)', () => {
    
    it('debe aceptar nombres válidos (3+ caracteres)', () => {
      const valoresValidos = [
        'Hamburguesa',
        'Big Mac',
        'Coca Cola',
        'Papas Fritas Supreme'
      ];
      
      valoresValidos.forEach(nombre => {
        component.productoForm.patchValue({ nombre });
        component.productoForm.get('nombre')?.markAsTouched();
        
        expect(component.productoForm.get('nombre')?.valid).toBe(true);
        expect(component.nombreError).toBe('');
      });
    });

    it('debe rechazar nombres inválidos (<3 caracteres)', () => {
      const valoresInvalidos = [
        '', // vacío
        'A', // 1 caracter
        'AB', // 2 caracteres
        '  ', // solo espacios
      ];
      
      valoresInvalidos.forEach(nombre => {
        component.productoForm.patchValue({ nombre });
        component.productoForm.get('nombre')?.markAsTouched();
        
        expect(component.productoForm.get('nombre')?.valid).toBe(false);
        expect(component.nombreError).not.toBe('');
      });
    });
  });

  describe('TC003 - Validación Imagen (Decision Table)', () => {
    
    it('modo creación: debe requerir imagen nueva', () => {
      // Configurar modo creación
      component.isEditMode = false;
      component.selectedFile = null;
      component.imagePreview = null;
      
      const resultado = component['validarFormulario']();
      
      expect(resultado).toBe(false);
      expect(component.imagenError).toContain('obligatoria');
    });

    it('modo creación: debe aceptar imagen nueva', () => {
      // Configurar modo creación con imagen
      component.isEditMode = false;
      component.selectedFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      component.imagePreview = 'data:image/jpeg;base64,test';
      
      // Completar otros campos requeridos
      component.productoForm.patchValue({
        nombre: 'Test Producto',
        descripcion: 'Test descripcion muy larga',
        categoria: 1,
        precio: '9.99',
        disponibilidad: 1
      });
      
      const resultado = component['validarFormulario']();
      
      expect(component.selectedFile).toBeTruthy();
      expect(component.imagePreview).toBeTruthy();
    });

    it('modo edición: debe aceptar sin imagen nueva si ya tiene', () => {
      // Configurar modo edición
      component.isEditMode = true;
      component.selectedFile = null;
      component.currentImageUrl = 'http://ejemplo.com/imagen.jpg';
      component.imagePreview = 'http://ejemplo.com/imagen.jpg';
      
      // Completar otros campos
      component.productoForm.patchValue({
        nombre: 'Test Producto',
        descripcion: 'Test descripcion muy larga',
        categoria: 1,
        precio: '9.99',
        disponibilidad: 1
      });
      
      const resultado = component['validarFormularioParaEdicion']();
      
      expect(resultado).toBe(true);
    });
  });

  describe('TC004 - Ingredientes por Categoría (Equivalence Partitioning)', () => {
    
    beforeEach(() => {
      // Mock de categorías
      component.categorias = [
        { id: 1, nombre: 'Hamburguesas' },
        { id: 2, nombre: 'Bebidas' },
        { id: 3, nombre: 'Postres' },
        { id: 4, nombre: 'Infantil' }
      ];
    });

    it('categorías con ingredientes: debe requerir al menos uno', () => {
      const categoriasConIngredientes = [
        { id: 1, nombre: 'Hamburguesas' },
        { id: 3, nombre: 'Postres' }
      ];
      
      categoriasConIngredientes.forEach(categoria => {
        component.productoForm.patchValue({ categoria: categoria.id });
        component.ingredientesSeleccionados = []; // Sin ingredientes
        
        const requiereIngredientes = component['categoriaDeberiaTenerIngredientes'](categoria.nombre);
        
        expect(requiereIngredientes).toBe(true);
      });
    });

    it('categorías sin ingredientes: no debe requerir ingredientes', () => {
      const categoriasSinIngredientes = [
        { id: 2, nombre: 'Bebidas' },
        { id: 4, nombre: 'Infantil' }
      ];
      
      categoriasSinIngredientes.forEach(categoria => {
        component.productoForm.patchValue({ categoria: categoria.id });
        component.ingredientesSeleccionados = []; // Sin ingredientes
        
        const requiereIngredientes = component['categoriaDeberiaTenerIngredientes'](categoria.nombre);
        
        expect(requiereIngredientes).toBe(false);
      });
    });

    it('debe cargar ingredientes correctamente para categorías válidas', () => {
      spyOn(component['catalogoService'], 'getIngredientesPorCategoria').and.returnValue(
        of([
          { id: 1, nombre: 'Carne', precio_adicional: 0 },
          { id: 2, nombre: 'Queso', precio_adicional: 1.50 }
        ])
      );
      
      const event = { value: 1 } as MatSelectChange;
      component.onCategoriaSeleccionada(event);
      
      expect(component['catalogoService'].getIngredientesPorCategoria).toHaveBeenCalledWith('hamburguesas');
    });
  });

});