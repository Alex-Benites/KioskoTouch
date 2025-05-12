import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadisticasPromocionComponent } from './estadisticas-promocion.component';

describe('EstadisticasPromocionComponent', () => {
  let component: EstadisticasPromocionComponent;
  let fixture: ComponentFixture<EstadisticasPromocionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticasPromocionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstadisticasPromocionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
