import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer-admin',
  imports: [],
  templateUrl: './footer-admin.component.html',
  styleUrl: './footer-admin.component.css'
})
export class FooterAdminComponent {

  constructor(private router: Router) {}

  volver() {
    this.router.navigate(['administrador/home']); 
  }

}
