import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';

@Component({
  selector: 'app-pantallas-cocina',
  imports: [HeaderAdminComponent, FooterAdminComponent],
  templateUrl: './pantallas-cocina.component.html',
  styleUrls: ['./pantallas-cocina.component.scss']
})
export class PantallasCocinaComponent {
  constructor(private router: Router) {}

  irA(ruta: string) {
    this.router.navigateByUrl(ruta);
  }

  volver() {
    this.router.navigate(['administrador/home']);
  }
}
