import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';

interface Categoria {
  id: number;
  label: string;
  icon: string; // nombre de clase de icono o ruta de imagen
}

interface Producto {
  id: number;
  nombre: string;
  imagen: string;
}

@Component({
  selector: 'app-editar',
  standalone: true,
  imports: [CommonModule,FormsModule,HeaderAdminComponent,FooterAdminComponent],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss'
})

export class EditarComponent {
  categorias: Categoria[] = [
    {id:1, label: 'Hamburguesa', icon: 'fas fa-hamburger' },
    {id:1, label: 'Bebidas', icon: 'fas fa-glass-martini-alt' },
    {id:1, label: 'Extras', icon: 'fas fa-plus-square' },
    {id:1, label: 'Postres', icon: 'fas fa-ice-cream' },
    {id:1, label: 'Pollo', icon: 'fas fa-drumstick-bite' },
    {id:1, label: 'Ensaladas', icon: 'fas fa-leaf' },
    {id:1, label: 'Pizza', icon: 'fas fa-pizza-slice' },
    {id:1, label: 'Infantil', icon: 'fas fa-child' }
  ];

  productos: Producto[] = [
    {id:1, nombre: 'Cheese Burger', imagen: 'assets/cheese-burger.png' },
    {id:2, nombre: 'Vegetable Burger', imagen: 'assets/vegetable-burger.png' },
    {id:3, nombre: 'Meet Burger', imagen: 'assets/meet-burger.png' },
    {id:4, nombre: 'Chicken Burger', imagen: 'assets/chicken-burger.png' },
    {id:5, nombre: 'Cheese Burger', imagen: 'assets/cheese-burger.png' },
    {id:6, nombre: 'Vegetable Burger', imagen: 'assets/vegetable-burger.png' },
    {id:7, nombre: 'Meet Burger', imagen: 'assets/meet-burger.png' },
    {id:8, nombre: 'Chicken Burger', imagen: 'assets/chicken-burger.png' }
  ];

  search = '';

  get productosFiltrados() {
    return this.productos.filter(p =>
      p.nombre.toLowerCase().includes(this.search.toLowerCase())
    );
  }
}