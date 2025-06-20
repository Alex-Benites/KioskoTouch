import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumenPedidoComponent } from './resumen-pedido.component';

describe('ResumenPedidoComponent', () => {
  let component: ResumenPedidoComponent;
  let fixture: ComponentFixture<ResumenPedidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenPedidoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumenPedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
