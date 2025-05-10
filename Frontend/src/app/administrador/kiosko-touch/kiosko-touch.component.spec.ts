import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KioskoTouchComponent } from './kiosko-touch.component';

describe('KioskoTouchComponent', () => {
  let component: KioskoTouchComponent;
  let fixture: ComponentFixture<KioskoTouchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KioskoTouchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KioskoTouchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
