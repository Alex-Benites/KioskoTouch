import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstruccionPagoComponent } from './instruccion-pago.component';

describe('InstruccionPagoComponent', () => {
  let component: InstruccionPagoComponent;
  let fixture: ComponentFixture<InstruccionPagoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstruccionPagoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstruccionPagoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
