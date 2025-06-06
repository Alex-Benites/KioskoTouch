import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-popup',
  templateUrl: './success-popup.component.html',
  styleUrls: ['./success-popup.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SuccessPopupComponent {
  @Input() visible: boolean = false;
  @Input() title: string = '¡ÉXITO!';
  @Input() message: string = 'Operación completada exitosamente';
  @Input() buttonText: string = 'Aceptar';

  @Output() onClose = new EventEmitter<void>();

  cerrarPopup() {
    this.onClose.emit();
  }
}
