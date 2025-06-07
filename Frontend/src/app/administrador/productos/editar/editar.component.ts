import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { Producto, Categoria, Estado } from '../../../models/catalogo.model'; 
import { CatalogoService } from '../../../services/catalogo.service'; 
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

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
    private catalogoService: CatalogoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Las categorías ya vienen con imagen_url integrado
    this.catalogoService.getCategorias().subscribe(data => {
      this.categorias = data;
      console.log('Categorías cargadas:', this.categorias); // Para debug
    });

    this.catalogoService.getProductos().subscribe(data => {
      this.productos = data;
      this.loadProductImages(); // Solo para productos
    });
  }

   editarProducto(producto: any): void {
    console.log('🔧 Editando producto:', producto);
    // Navegar al formulario de edición con el ID del producto
    this.router.navigate(['/administrador/gestion-productos/crear', producto.id]);
  }
  
  loadProductImages(): void {
    this.productos.forEach(producto => {
      if (producto.id) {
        this.catalogoService.getProductoImagen(producto.id).subscribe(response => {
          producto.imagenUrl = response.imagen_url;
        });
      }
    });
  }
  
  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) return '';
    return `${environment.baseUrl}${imagenUrl}`;
  }
}
