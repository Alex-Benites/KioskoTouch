import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEliminarIngredienteComponent } from './editar-eliminar-ingrediente.component';

describe('EditarEliminarIngredienteComponent', () => {
  let component: EditarEliminarIngredienteComponent;
  let fixture: ComponentFixture<EditarEliminarIngredienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEliminarIngredienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarEliminarIngredienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
