import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEliminarPantallaCocinaComponent } from './editar-eliminar-pantalla-cocina.component';

describe('EditarEliminarPantallaCocinaComponent', () => {
  let component: EditarEliminarPantallaCocinaComponent;
  let fixture: ComponentFixture<EditarEliminarPantallaCocinaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEliminarPantallaCocinaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarEliminarPantallaCocinaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
