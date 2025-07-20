import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-welcome',
  imports: [CommonModule, MatIconModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {

  constructor(private router: Router) {}

  goToLogin(): void {
    this.router.navigate(['/administrador/login']);
  }

  goToKiosko(): void {
    this.router.navigate(['/cliente/home']);
  }

}
