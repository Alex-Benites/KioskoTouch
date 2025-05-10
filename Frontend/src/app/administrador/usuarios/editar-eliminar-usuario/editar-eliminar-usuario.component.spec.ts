import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEliminarUsuarioComponent } from './editar-eliminar-usuario.component';

describe('EditarEliminarUsuarioComponent', () => {
  let component: EditarEliminarUsuarioComponent;
  let fixture: ComponentFixture<EditarEliminarUsuarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEliminarUsuarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarEliminarUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
