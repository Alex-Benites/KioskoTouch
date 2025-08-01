import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import {Location} from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-admin',
  imports: [CommonModule],
  templateUrl: './footer-admin.component.html',
  styleUrl: './footer-admin.component.scss'
})
export class FooterAdminComponent {


  @Input() backRoute?: string | any[];

  constructor(private router: Router, private location: Location) {}

  volver() {
    if (this.backRoute) {
      const routeToNavigate = Array.isArray(this.backRoute) ? this.backRoute : [this.backRoute];
      this.router.navigate(routeToNavigate);
    } else {
      this.location.back();
    }
  }

}
