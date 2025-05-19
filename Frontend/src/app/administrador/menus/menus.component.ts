import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';

@Component({
  selector: 'app-menus',
  imports: [HeaderAdminComponent, FooterAdminComponent],
  templateUrl: './menus.component.html',
  styleUrls: ['./menus.component.css']
})
export class MenusComponent {
  constructor(private router: Router) {}

  irA(ruta: string) {
    this.router.navigateByUrl(ruta);
  }

  volver() {
    this.router.navigate(['administrador/home']);
  }
}
