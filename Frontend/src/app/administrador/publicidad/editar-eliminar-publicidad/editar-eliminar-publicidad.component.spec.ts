import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEliminarPublicidadComponent } from './editar-eliminar-publicidad.component';

describe('EditarEliminarPublicidadComponent', () => {
  let component: EditarEliminarPublicidadComponent;
  let fixture: ComponentFixture<EditarEliminarPublicidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEliminarPublicidadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarEliminarPublicidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
