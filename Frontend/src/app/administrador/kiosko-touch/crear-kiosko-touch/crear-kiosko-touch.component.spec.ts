import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearKioskoTouchComponent } from './crear-kiosko-touch.component';

describe('CrearKioskoTouchComponent', () => {
  let component: CrearKioskoTouchComponent;
  let fixture: ComponentFixture<CrearKioskoTouchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearKioskoTouchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearKioskoTouchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
