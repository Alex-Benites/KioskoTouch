import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEliminarRolComponent } from './editar-eliminar-rol.component';

describe('EditarEliminarRolComponent', () => {
  let component: EditarEliminarRolComponent;
  let fixture: ComponentFixture<EditarEliminarRolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEliminarRolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarEliminarRolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
