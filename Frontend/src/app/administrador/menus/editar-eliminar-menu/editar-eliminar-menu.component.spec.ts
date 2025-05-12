import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEliminarMenuComponent } from './editar-eliminar-menu.component';

describe('EditarEliminarMenuComponent', () => {
  let component: EditarEliminarMenuComponent;
  let fixture: ComponentFixture<EditarEliminarMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEliminarMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarEliminarMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
