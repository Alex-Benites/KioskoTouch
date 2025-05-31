import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearIngredienteComponent } from './crear-ingrediente.component';

describe('CrearIngredienteComponent', () => {
  let component: CrearIngredienteComponent;
  let fixture: ComponentFixture<CrearIngredienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearIngredienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearIngredienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
