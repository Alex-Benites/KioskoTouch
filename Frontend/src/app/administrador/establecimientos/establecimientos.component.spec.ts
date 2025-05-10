import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstablecimientosComponent } from './establecimientos.component';

describe('EstablecimientosComponent', () => {
  let component: EstablecimientosComponent;
  let fixture: ComponentFixture<EstablecimientosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstablecimientosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstablecimientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
