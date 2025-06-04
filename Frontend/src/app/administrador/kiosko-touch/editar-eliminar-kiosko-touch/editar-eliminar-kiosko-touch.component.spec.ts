import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEliminarKioskoTouchComponent } from './editar-eliminar-kiosko-touch.component';

describe('EditarEliminarKioskoTouchComponent', () => {
  let component: EditarEliminarKioskoTouchComponent;
  let fixture: ComponentFixture<EditarEliminarKioskoTouchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEliminarKioskoTouchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarEliminarKioskoTouchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
