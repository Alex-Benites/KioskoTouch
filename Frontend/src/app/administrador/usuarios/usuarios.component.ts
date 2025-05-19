import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';

@Component({
  selector: 'app-usuarios',
  imports: [HeaderAdminComponent, FooterAdminComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {
  constructor(private router: Router) {}

  irA(ruta: string) {
    this.router.navigateByUrl(ruta);
  }
  

  volver() {
    this.router.navigate(['administrador/home']); // O la ruta que corresponda al menú anterior
  }
}
