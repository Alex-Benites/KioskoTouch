import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalizarProductoComponent } from './personalizar-producto.component';

describe('PersonalizarProductoComponent', () => {
  let component: PersonalizarProductoComponent;
  let fixture: ComponentFixture<PersonalizarProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalizarProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalizarProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
