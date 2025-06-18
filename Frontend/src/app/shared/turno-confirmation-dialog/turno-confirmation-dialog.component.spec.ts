import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnoConfirmationDialogComponent } from './turno-confirmation-dialog.component';

describe('TurnoConfirmationDialogComponent', () => {
  let component: TurnoConfirmationDialogComponent;
  let fixture: ComponentFixture<TurnoConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnoConfirmationDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnoConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
