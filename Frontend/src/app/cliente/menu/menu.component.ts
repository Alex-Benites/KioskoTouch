import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})

export class MenuComponent implements OnInit, OnDestroy {
  categorias = [
    { nombre: 'Hamburguesas', img: 'img/cliente/hamburguesa1-home.png' },
    { nombre: 'Postres', img: 'img/cliente/Sundae.png' },
    // etc.
  ];
  productos = [
    { nombre: 'Wendy Burguer', img: 'img/cliente/WendyBurger.png', precio: 5.99, categoria: 'Hamburguesas' },
    { nombre: 'Chiken Box', img: 'img/cliente/ChikenBox.png', precio: 5.99, categoria: 'Hamburguesas' },

    { nombre: 'Cono Triple', img: 'img/cliente/ConoTriple.png', precio: 3.50, categoria: 'Postres' },
    // etc.
  ];

  categoriaSeleccionada = '';
  productosFiltrados: {nombre: string; img: string; precio: number; categoria: string;}[] = [];

  mostrarPopupLogin = false;
  idioma = 'es';

  constructor(private route: ActivatedRoute, private router: Router, private renderer: Renderer2) {}

  ngOnInit() {
    this.renderer.addClass(document.body, 'fondo-home');

    this.route.paramMap.subscribe(params => {
      const categoria = params.get('categoria') || this.categorias[0].nombre;
      this.seleccionarCategoria(categoria);
    });
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'fondo-home');
  }

  seleccionarCategoria(cat: any) {
    this.categoriaSeleccionada = cat.nombre || cat;
    this.productosFiltrados = this.productos.filter(
      p => p.categoria === this.categoriaSeleccionada
    );
    this.router.navigate(['/cliente/menu', this.categoriaSeleccionada]);
  }

  abrirLoginPopup() {
    this.mostrarPopupLogin = true;
  }

  cerrarPopupLogin() {
    this.mostrarPopupLogin = false;
  }

  continuar() {
    const index = this.categorias.findIndex(c => c.nombre === this.categoriaSeleccionada);
    const next = this.categorias[index + 1];
    if (next) {
      this.seleccionarCategoria(next);
    } else {
      this.router.navigate(['/cliente/carrito']); // ruta futura
    }
  }
}
