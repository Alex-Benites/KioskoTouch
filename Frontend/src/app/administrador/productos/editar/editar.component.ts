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
  productos: any[] = [];
  productosFiltrados: any[] = [];
  categorias: any[] = [];
  search: string = '';
  categoriaSeleccionada: number | null = null;
  loading: boolean = false;

  constructor(
    private catalogoService: CatalogoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  // ✅ MANTENER este método
  filtrarPorCategoria(categoriaId: number | null): void {
    this.categoriaSeleccionada = categoriaId;

    console.log('🔍 DEBUGGEO FILTRO POR CATEGORÍA:');
    console.log('- Categoría seleccionada:', categoriaId);
    console.log('- Productos disponibles:', this.productos);
    console.log('- Categorías disponibles:', this.categorias);

    if (this.productos.length > 0) {
      console.log('- Estructura del primer producto:', this.productos[0]);
    }

    this.filtrarProductos();
  }

  // ✅ MANTENER SOLO ESTE método filtrarProductos (eliminar el duplicado)
  filtrarProductos(): void {
    let resultado = [...this.productos];

    console.log('🔍 INICIANDO FILTRADO:');
    console.log('- Total productos:', resultado.length);
    console.log('- Categoría seleccionada:', this.categoriaSeleccionada);

    // Filtrar por categoría si está seleccionada
    if (this.categoriaSeleccionada !== null) {
      console.log('- Aplicando filtro de categoría...');

      resultado = resultado.filter(producto => {
        console.log(`  Producto "${producto.nombre}":`, {
          'producto.categoria': producto.categoria,
          'categoriaSeleccionada': this.categoriaSeleccionada,
          'son iguales?': producto.categoria === this.categoriaSeleccionada
        });

        return producto.categoria === this.categoriaSeleccionada;
      });

      console.log('- Productos después del filtro de categoría:', resultado.length);
    }

    // Filtrar por texto de búsqueda
    if (this.search && this.search.trim() !== '') {
      const searchTerm = this.search.toLowerCase().trim();
      resultado = resultado.filter(producto =>
        producto.nombre?.toLowerCase().includes(searchTerm) ||
        producto.descripcion?.toLowerCase().includes(searchTerm)
      );
      console.log('- Productos después del filtro de texto:', resultado.length);
    }

    this.productosFiltrados = resultado;

    console.log('🎯 RESULTADO FINAL:', {
      categoria: this.categoriaSeleccionada,
      busqueda: this.search,
      total: this.productos.length,
      filtrados: this.productosFiltrados.length
    });
  }

  cargarProductos(): void {
    this.loading = true;
    console.log('📦 Cargando productos...');

    this.catalogoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.productosFiltrados = [...this.productos];
        this.loading = false;

        console.log('✅ Productos cargados:', this.productos);
        console.log('📊 Estructura de productos:', this.productos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          categoria_id: p.categoria_id,
          categoria: p.categoria
        })));

        // ✅ Cargar imágenes después de cargar productos
        this.loadProductImages();
      },
      error: (error) => {
        console.error('❌ Error cargando productos:', error);
        this.productos = [];
        this.productosFiltrados = [];
        this.loading = false;
      }
    });
  }

  loadProductImages(): void {
    console.log('🖼️ Cargando imágenes de productos...');

    this.productos.forEach((producto, index) => {
      if (producto.id) {
        this.catalogoService.getProductoImagen(producto.id).subscribe({
          next: (response) => {
            // Actualizar tanto en productos como en productosFiltrados
            this.productos[index].imagenUrl = response.imagen_url;

            // Actualizar también en productosFiltrados si el producto está ahí
            const filtradoIndex = this.productosFiltrados.findIndex(p => p.id === producto.id);
            if (filtradoIndex !== -1) {
              this.productosFiltrados[filtradoIndex].imagenUrl = response.imagen_url;
            }

            console.log(`✅ Imagen cargada para ${producto.nombre}:`, response.imagen_url);
          },
          error: (error) => {
            console.error(`❌ Error cargando imagen para ${producto.nombre}:`, error);
          }
        });
      }
    });
  }

  cargarCategorias(): void {
    console.log('📂 Cargando categorías...');

    this.catalogoService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        console.log('✅ Categorías cargadas:', this.categorias);
        console.log('📊 IDs de categorías:', this.categorias.map(c => ({ id: c.id, nombre: c.nombre })));
      },
      error: (error) => {
        console.error('❌ Error cargando categorías:', error);
        this.categorias = [];
      }
    });
  }

  limpiarFiltros(): void {
    this.categoriaSeleccionada = null;
    this.search = '';
    this.productosFiltrados = [...this.productos];
    console.log('🧹 Filtros limpiados');
  }

  editarProducto(producto: any): void {
    console.log('🔧 Editando producto:', producto);
    this.router.navigate(['/administrador/gestion-productos/crear', producto.id]);
  }

  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) return '';
    return `${environment.baseUrl}${imagenUrl}`;
  }
}
