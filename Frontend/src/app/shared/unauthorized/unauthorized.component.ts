import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  imports: [],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.scss'
})
export class UnauthorizedComponent {

  private router = inject(Router);
  private authService = inject(AuthService);

  goHome() {
    this.router.navigate(['/administrador/home']);
  }

  logout() {
    this.authService.logout().subscribe();
  }
}
