import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-permission-denied-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './permission-denied-dialog.component.html',
  styleUrls: ['./permission-denied-dialog.component.scss']
})
export class PermissionDeniedDialogComponent {
  imagePath = 'assets/admin/ADMIN_8.png';

  constructor(
    public dialogRef: MatDialogRef<PermissionDeniedDialogComponent>
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}