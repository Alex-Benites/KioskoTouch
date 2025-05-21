import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'; 
import { MatButtonModule } from '@angular/material/button'; 

export interface ConfirmationDialogData {
  itemType: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule 
  ],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
})
export class ConfirmationDialogComponent {
  imagePath = 'assets/admin/ADMIN_8.png';

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  get articuloDeterminante(): string {
    const item = this.data.itemType?.toUpperCase();
    const femeninos = ['PANTALLA', 'PUBLICIDAD', 'PROMOCIÓN'];
    if (item && femeninos.includes(item)) {
      return 'ESTA';
    }
    return 'ESTE';
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}