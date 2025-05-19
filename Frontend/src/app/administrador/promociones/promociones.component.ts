import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';

@Component({
  selector: 'app-promociones',
  imports: [HeaderAdminComponent, FooterAdminComponent],
  templateUrl: './promociones.component.html',
  styleUrls: ['./promociones.component.css']
})
export class PromocionesComponent {
  constructor(private router: Router) {}

  irA(ruta: string) {
    this.router.navigateByUrl(ruta);
  }

  volver() {
    this.router.navigate(['administrador/home']);
  }
}