import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearPantallaCocinaComponent } from './crear-pantalla-cocina.component';

describe('CrearPantallaCocinaComponent', () => {
  let component: CrearPantallaCocinaComponent;
  let fixture: ComponentFixture<CrearPantallaCocinaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearPantallaCocinaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearPantallaCocinaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
