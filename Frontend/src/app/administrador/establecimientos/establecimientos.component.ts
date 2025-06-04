import { Component } from '@angular/core';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { Router } from '@angular/router';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';

@Component({
  selector: 'app-establecimientos',
  imports: [HeaderAdminComponent, FooterAdminComponent],
  templateUrl: './establecimientos.component.html',
  styleUrl: './establecimientos.component.scss'
})
export class EstablecimientosComponent {

  constructor(private router: Router) {}

  irA(ruta: string) {
    console.log('Navegando a:', ruta); // Para debug
    this.router.navigate([ruta]);
  }
}
