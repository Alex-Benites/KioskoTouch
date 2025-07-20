import { Component } from '@angular/core';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { Router } from '@angular/router';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';

@Component({
  selector: 'app-kiosko-touch',
  imports: [HeaderAdminComponent, FooterAdminComponent],
  templateUrl: './kiosko-touch.component.html',
  styleUrl: './kiosko-touch.component.scss'
})
export class KioskoTouchComponent {

  constructor(private router: Router) {}

  irA(ruta: string) {
    
    this.router.navigate([ruta]);
  }
}
