import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';

@Component({
  selector: 'app-home',
  imports: [HeaderAdminComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(private router: Router) {}

  irARuta(ruta: string) {
    this.router.navigate([ruta]);
    
  }
}