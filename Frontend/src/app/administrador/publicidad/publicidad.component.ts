import { Component } from '@angular/core';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { Router } from '@angular/router';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';

@Component({
  selector: 'app-publicidad',
  imports: [HeaderAdminComponent, FooterAdminComponent],
  templateUrl: './publicidad.component.html',
  styleUrl: './publicidad.component.scss'
})
export class PublicidadComponent {

  constructor(private router: Router) {}

  irA(ruta: string) {
    this.router.navigateByUrl(ruta);
  }
}
