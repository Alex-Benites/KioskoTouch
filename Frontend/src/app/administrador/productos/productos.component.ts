import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';

@Component({
  selector: 'app-productos',
  imports: [HeaderAdminComponent],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})

export class ProductosComponent {
  constructor(private router: Router) {}

  irA(ruta: string) {
    this.router.navigateByUrl(ruta);
  }

  volver() {
    this.router.navigate(['administrador/home']);
  }
}
