import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEliminarPromocionComponent } from './editar-eliminar-promocion.component';

describe('EditarEliminarPromocionComponent', () => {
  let component: EditarEliminarPromocionComponent;
  let fixture: ComponentFixture<EditarEliminarPromocionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEliminarPromocionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarEliminarPromocionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
