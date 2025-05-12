import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pantallas-cocina',
  imports: [],
  templateUrl: './pantallas-cocina.component.html',
  styleUrls: ['./pantallas-cocina.component.css']
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
