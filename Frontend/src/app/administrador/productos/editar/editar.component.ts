import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { Producto, Categoria, Estado } from '../../../models/catalogo.model'; 
import { CatalogoService } from '../../../services/catalogo.service'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-editar',
  standalone: true,
  imports: [CommonModule,FormsModule,HeaderAdminComponent,FooterAdminComponent],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss'
})

export class EditarComponent implements OnInit {
  categorias: Categoria[] = [];
  productos: Producto[] = [];
  search: string = '';
  
  constructor(
    private catalogoService: CatalogoService, // Lo mantenemos por si quieres usarlo para crearProducto
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.catalogoService.getCategorias().subscribe(data => {
      this.categorias = data;
    });

    this.catalogoService.getProductos().subscribe(data => {
      this.productos = data;
    });
  }


}