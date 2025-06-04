import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEliminarEstablecimientoComponent } from './editar-eliminar-establecimiento.component';

describe('EditarEliminarEstablecimientoComponent', () => {
  let component: EditarEliminarEstablecimientoComponent;
  let fixture: ComponentFixture<EditarEliminarEstablecimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEliminarEstablecimientoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarEliminarEstablecimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
