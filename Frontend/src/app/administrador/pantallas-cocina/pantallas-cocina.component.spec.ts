import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PantallasCocinaComponent } from './pantallas-cocina.component';

describe('PantallasCocinaComponent', () => {
  let component: PantallasCocinaComponent;
  let fixture: ComponentFixture<PantallasCocinaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PantallasCocinaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PantallasCocinaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
