import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'; 
import { MatButtonModule } from '@angular/material/button'; 

export interface SuccessDialogData {
  title: string;
  message: string;
  buttonText?: string; 
}

@Component({
  selector: 'app-success-dialog',
  imports: [
    CommonModule,
    MatDialogModule, 
    MatButtonModule  
  ],
  templateUrl: './success-dialog.component.html',
  styleUrls: ['./success-dialog.component.scss'],
})
export class SuccessDialogComponent {
  imagePath = 'assets/admin/ADMIN_3.png'; 

  constructor(
    public dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SuccessDialogData
  ) {}

  onContinue(): void {
    this.dialogRef.close(); 
  }
}