import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionDeniedDialogComponent } from './permission-denied-dialog.component';

describe('PermissionDeniedDialogComponent', () => {
  let component: PermissionDeniedDialogComponent;
  let fixture: ComponentFixture<PermissionDeniedDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionDeniedDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionDeniedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
