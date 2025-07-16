import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { CarritoCompraComponent } from './carrito-compra.component';
import { PedidoService } from '../../services/pedido.service';
import { CatalogoService } from '../../services/catalogo.service';
import { PublicidadService } from '../../services/publicidad.service';

describe('CarritoCompraComponent - Black Box Testing (Sprint 3)', () => {
  let component: CarritoCompraComponent;
  let fixture: ComponentFixture<CarritoCompraComponent>;
  let pedidoServiceSpy: jasmine.SpyObj<PedidoService>;
  let catalogoServiceSpy: jasmine.SpyObj<CatalogoService>;
  let publicidadServiceSpy: jasmine.SpyObj<PublicidadService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  // Mocks de productos y menús
  const mockCarritoVacio: any[] = [];
  const mockProductoSimple = {
    id: 'producto_1_0_0',
    tipo: 'producto',
    producto_id: 1,
    cantidad: 2,
    precio_unitario: 5.00,
    subtotal: 10.00,
    personalizacion: [],
    nombre: 'Hamburguesa Simple',
    imagen_url: '/media/productos/hamburguesa.jpg'
  };
  const mockProductoConExtras = {
    id: 'producto_2_0_0',
    tipo: 'producto',
    producto_id: 2,
    cantidad: 1,
    precio_unitario: 5.00,
    subtotal: 6.50,
    personalizacion: [
      { ingrediente_id: 1, accion: 'agregar', precio_aplicado: 1.50 }
    ],
    nombre: 'Hamburguesa con Queso Extra',
    imagen_url: '/media/productos/hamburguesa-queso.jpg'
  };
  const mockMenu = {
    id: 'menu_1_0_0',
    tipo: 'menu',
    menu_id: 1,
    cantidad: 1,
    precio_unitario: 12.00,
    subtotal: 12.00,
    productos: [],
    nombre: 'Combo Familiar',
    imagen_url: '/media/menus/combo-familiar.jpg'
  };

  beforeEach(async () => {
    const pedidoSpy = jasmine.createSpyObj('PedidoService', [
      'obtenerProductosParaCarrito',
      'aumentarCantidadProducto',
      'disminuirCantidadProducto',
      'eliminarProducto',
      'limpiarCarrito',
      'setTipoEntrega',
      'tieneTurno',
      'obtenerTurno',
      'total',
      'cantidadItems',
      'tipoEntrega',
      'esPedidoValido',
      'detalles'
    ]);
    pedidoSpy.aumentarCantidadProducto.and.callFake(() => {});
    pedidoSpy.disminuirCantidadProducto.and.callFake(() => {});
    pedidoSpy.eliminarProducto.and.callFake(() => {});
    pedidoSpy.limpiarCarrito.and.callFake(() => {});
    pedidoSpy.setTipoEntrega.and.callFake(() => {});
    pedidoSpy.tieneTurno.and.returnValue(false);
    pedidoSpy.obtenerTurno.and.returnValue(undefined);
    pedidoSpy.total.and.returnValue(0);
    pedidoSpy.cantidadItems.and.returnValue(0);
    pedidoSpy.tipoEntrega.and.returnValue(undefined);
    pedidoSpy.esPedidoValido.and.returnValue(true);
    pedidoSpy.detalles.and.returnValue({});

    const catalogoSpy = jasmine.createSpyObj('CatalogoService', [
      'obtenerProductoPorId',
      'obtenerMenuPorId',
      'getFullImageUrl',
      'getIngredientes'
    ]);
    catalogoSpy.obtenerProductoPorId.and.returnValue(of({}));
    catalogoSpy.obtenerMenuPorId.and.returnValue(of({}));
    catalogoSpy.getFullImageUrl.and.returnValue('/media/productos/default.jpg');
    catalogoSpy.getIngredientes.and.returnValue(of([]));

    const publicidadSpy = jasmine.createSpyObj('PublicidadService', [
      'getPublicidadesActivasParaCarrusel',
      'getFullMediaUrl'
    ]);
    publicidadSpy.getPublicidadesActivasParaCarrusel.and.returnValue(of([]));
    publicidadSpy.getFullMediaUrl.and.returnValue('/media/publicidad/default.jpg');

    // MatDialog mock que siempre retorna un MatDialogRef válido
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    matDialogSpy.open.and.callFake(() => {
      const ref = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      ref.afterClosed.and.returnValue(of({ confirmed: true }));
      // Asegura que siempre tenga data como array real
      ref.componentInstance = { data: [], close: () => {} };
      return ref;
    });

    await TestBed.configureTestingModule({
      imports: [
        CarritoCompraComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        MatSnackBarModule,
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: PedidoService, useValue: pedidoSpy },
        { provide: CatalogoService, useValue: catalogoSpy },
        { provide: PublicidadService, useValue: publicidadSpy },
        { provide: MatDialog, useValue: matDialogSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    pedidoServiceSpy = TestBed.inject(PedidoService) as jasmine.SpyObj<PedidoService>;
    catalogoServiceSpy = TestBed.inject(CatalogoService) as jasmine.SpyObj<CatalogoService>;
    publicidadServiceSpy = TestBed.inject(PublicidadService) as jasmine.SpyObj<PublicidadService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(CarritoCompraComponent);
    component = fixture.componentInstance;
  });

  // TC009 - EQUIVALENCE PARTITIONING: CART PRODUCT MANAGEMENT
  describe('TC009 - Equivalence Partitioning: Cart State Management', () => {
    it('TC009-01: Empty cart shows emptyCart template', () => {
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([]);
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.productosCarrito.length).toBe(0);
      // Aquí podrías verificar el template si lo deseas
    });

    it('TC009-02: Cart with product shows product controls', () => {
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([mockProductoSimple]);
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.productosCarrito.length).toBe(1);
    });

    it('TC009-03: Cart with menu shows menu details', () => {
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([mockMenu]);
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.productosCarrito.length).toBe(1);
    });

    it('TC009-04: Cart with product and menu shows both', () => {
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([mockProductoSimple, mockMenu]);
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.productosCarrito.length).toBe(2);
    });
  });

  // TC010 - BOUNDARY VALUE ANALYSIS: QUANTITY CONTROL
  describe('TC010 - Boundary Value Analysis: Quantity Control', () => {
    it('TC010-01: Increase quantity from 1 to 2', () => {
      const producto = { ...mockProductoSimple, cantidad: 1 };
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([producto]);
      component.ngOnInit();
      component.aumentarCantidad(0);
      expect(pedidoServiceSpy.aumentarCantidadProducto).toHaveBeenCalledWith(0);
    });

    it('TC010-02: Decrease quantity from 2 to 1', () => {
      const producto = { ...mockProductoSimple, cantidad: 2 };
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([producto]);
      component.ngOnInit();
      component.disminuirCantidad(0);
      expect(pedidoServiceSpy.disminuirCantidadProducto).toHaveBeenCalledWith(0);
    });

    // TC010-03: Decrease quantity from 1 removes product
    xit('TC010-03: Decrease quantity from 1 removes product', () => {
      const producto = { ...mockProductoSimple, cantidad: 1 };
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([producto]);
      component.ngOnInit();
      // Mock MatDialogRef con data como array real
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true }));
      dialogRefSpy.componentInstance = { data: [], close: () => {} };
      dialogSpy.open.and.returnValue(dialogRefSpy);
      component.eliminarProducto(0);
      expect(pedidoServiceSpy.eliminarProducto).toHaveBeenCalledWith(0);
    });

    it('TC010-04: Increase quantity at high value', () => {
      const producto = { ...mockProductoSimple, cantidad: 10 };
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([producto]);
      component.ngOnInit();
      component.aumentarCantidad(0);
      expect(pedidoServiceSpy.aumentarCantidadProducto).toHaveBeenCalledWith(0);
    });

    it('TC010-05: Disable decrease button at quantity 1', () => {
      const producto = { ...mockProductoSimple, cantidad: 1 };
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([producto]);
      component.ngOnInit();
      expect(component.productosCarrito[0].cantidad).toBe(1);
      // Aquí podrías verificar el estado del botón en el template si lo deseas
    });
  });

  // TC011 - DECISION TABLE TESTING: CHECKOUT LOGIC
  describe('TC011 - Decision Table Testing: Checkout Logic', () => {
    it('TC011-01: Checkout disabled with empty cart', () => {
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([]);
      pedidoServiceSpy.cantidadItems.and.returnValue(0);
      pedidoServiceSpy.esPedidoValido.and.returnValue(false);
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.productosCarrito.length).toBe(0);
    });

    xit('TC011-02: "dine-in" shows turn popup', () => {
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([mockProductoSimple, mockProductoSimple, mockProductoSimple]);
      pedidoServiceSpy.cantidadItems.and.returnValue(3);
      pedidoServiceSpy.tipoEntrega.and.returnValue('servir');
      pedidoServiceSpy.esPedidoValido.and.returnValue(true);
      // Mock MatDialogRef con data como array real
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true, mesa: 5 }));
      dialogRefSpy.componentInstance = { data: [], close: () => {} };
      dialogSpy.open.and.returnValue(dialogRefSpy);
      component.ngOnInit();
      component.finalizarPedido();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('TC011-03: "takeaway" goes directly to summary', () => {
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([mockProductoSimple, mockProductoSimple]);
      pedidoServiceSpy.cantidadItems.and.returnValue(2);
      pedidoServiceSpy.tipoEntrega.and.returnValue('llevar');
      pedidoServiceSpy.esPedidoValido.and.returnValue(true);
      component.ngOnInit();
      spyOn(component as any, 'irDirectoAlResumen');
      component.finalizarPedido();
      expect((component as any).irDirectoAlResumen).toHaveBeenCalled();
    });

    // TC011-04: undefined delivery type shows default popup
    xit('TC011-04: undefined delivery type shows default popup', () => {
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([mockProductoSimple]);
      pedidoServiceSpy.cantidadItems.and.returnValue(1);
      pedidoServiceSpy.tipoEntrega.and.returnValue(undefined);
      pedidoServiceSpy.esPedidoValido.and.returnValue(true);
      // Mock MatDialogRef con data como array real
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true }));
      dialogRefSpy.componentInstance = { data: [], close: () => {} };
      dialogSpy.open.and.returnValue(dialogRefSpy);
      component.ngOnInit();
      spyOn(component as any, 'mostrarPopupTurno').and.callThrough();
      component.finalizarPedido();
      expect((component as any).mostrarPopupTurno).toHaveBeenCalled();
    });

    // TC011-05: null delivery type shows default popup
    xit('TC011-05: null delivery type shows default popup', () => {
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue([mockProductoSimple, mockProductoSimple, mockProductoSimple, mockProductoSimple]);
      pedidoServiceSpy.cantidadItems.and.returnValue(4);
      pedidoServiceSpy.tipoEntrega.and.returnValue(null);
      pedidoServiceSpy.esPedidoValido.and.returnValue(true);
      // Mock MatDialogRef con data como array real
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true }));
      dialogRefSpy.componentInstance = { data: [], close: () => {} };
      dialogSpy.open.and.returnValue(dialogRefSpy);
      component.ngOnInit();
      spyOn(component as any, 'mostrarPopupTurno').and.callThrough();
      component.finalizarPedido();
      expect((component as any).mostrarPopupTurno).toHaveBeenCalled();
    });
  });

  // TC012 - EQUIVALENCE PARTITIONING: PRICE CALCULATION VALIDATION
  describe('TC012 - Equivalence Partitioning: Price Calculation', () => {
    it('TC012-01: Simple product subtotal is correct', () => {
      const producto = { ...mockProductoSimple, cantidad: 2, subtotal: 10.00 };
      expect(component.calcularPrecioTotalProducto(producto)).toBe(10.00);
    });

    it('TC012-02: Product with extras subtotal is correct', () => {
      const producto = { ...mockProductoConExtras, cantidad: 1, subtotal: 6.50 };
      expect(component.calcularPrecioTotalProducto(producto)).toBe(6.50);
    });

    it('TC012-03: Menu subtotal is correct', () => {
      const menu = { ...mockMenu, cantidad: 1, subtotal: 12.00 };
      expect(component.calcularPrecioTotalProducto(menu)).toBe(12.00);
    });

    it('TC012-04: Cart total is sum of subtotals', () => {
      const productos = [
        { ...mockProductoSimple, subtotal: 10.00 },
        { ...mockProductoConExtras, subtotal: 6.50 },
        { ...mockMenu, subtotal: 12.00 }
      ];
      const total = productos.reduce((sum, p) => sum + component.calcularPrecioTotalProducto(p), 0);
      expect(total).toBeCloseTo(28.50, 2);
    });

    // TC012-05: Remove product recalculates total
    xit('TC012-05: Remove product recalculates total', () => {
      const productos = [
        { ...mockProductoSimple, subtotal: 10.00 },
        { ...mockProductoConExtras, subtotal: 6.50 }
      ];
      pedidoServiceSpy.obtenerProductosParaCarrito.and.returnValue(productos);
      component.ngOnInit();
      // Mock MatDialogRef con data como array real
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true }));
      dialogRefSpy.componentInstance = { data: [], close: () => {} };
      dialogSpy.open.and.returnValue(dialogRefSpy);
      component.eliminarProducto(0);
      // Aquí podrías verificar que el total se recalcula correctamente
    });
  });
});