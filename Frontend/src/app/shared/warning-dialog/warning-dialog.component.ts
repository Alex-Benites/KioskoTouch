import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface WarningDialogData {
  message: string;
}

@Component({
  selector: 'app-warning-dialog',
  template: `
    <div class="dialog-container warning-dialog">
      <div class="icon-container">
        <img src="assets/admin/ADMIN_ALERT.png" alt="Advertencia" class="dialog-icon" />
      </div>
      <h2 class="dialog-title">ADVERTENCIA</h2>
      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>
      <div class="dialog-actions">
        <button class="primary__button confirm-button" (click)="onClose()" cdkFocusInitial>Aceptar</button>
      </div>
    </div>
  `,
  styleUrls: ['./warning-dialog.component.scss']
})
export class WarningDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<WarningDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WarningDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
