import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicidadSectionComponent } from './publicidad-section.component';

describe('PublicidadSectionComponent', () => {
  let component: PublicidadSectionComponent;
  let fixture: ComponentFixture<PublicidadSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicidadSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicidadSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
