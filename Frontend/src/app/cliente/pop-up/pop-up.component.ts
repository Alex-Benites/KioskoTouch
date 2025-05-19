import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pop-up',
  imports: [],
  templateUrl: './pop-up.component.html',
  styleUrls: ['./pop-up.component.scss']
})
export class PopupComponent {
  @Input() title: string = '';
  @Input() message: string = '';
  @Output() onClose = new EventEmitter<void>();

  closePopup() {
    this.onClose.emit();
  }
}
