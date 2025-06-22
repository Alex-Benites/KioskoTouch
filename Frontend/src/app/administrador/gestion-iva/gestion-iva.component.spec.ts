import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionIvaComponent } from './gestion-iva.component';

describe('GestionIvaComponent', () => {
  let component: GestionIvaComponent;
  let fixture: ComponentFixture<GestionIvaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionIvaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionIvaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
