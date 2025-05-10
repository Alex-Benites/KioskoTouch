import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicidadComponent } from './publicidad.component';

describe('PublicidadComponent', () => {
  let component: PublicidadComponent;
  let fixture: ComponentFixture<PublicidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicidadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
