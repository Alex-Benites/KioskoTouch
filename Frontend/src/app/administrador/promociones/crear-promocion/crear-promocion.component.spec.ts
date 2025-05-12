import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearPromocionComponent } from './crear-promocion.component';

describe('CrearPromocionComponent', () => {
  let component: CrearPromocionComponent;
  let fixture: ComponentFixture<CrearPromocionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearPromocionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearPromocionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
