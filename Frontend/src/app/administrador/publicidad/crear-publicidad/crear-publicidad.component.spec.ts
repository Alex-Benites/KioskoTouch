import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearPublicidadComponent } from './crear-publicidad.component';

describe('CrearPublicidadComponent', () => {
  let component: CrearPublicidadComponent;
  let fixture: ComponentFixture<CrearPublicidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearPublicidadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearPublicidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
