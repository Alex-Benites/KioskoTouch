import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { PermissionDeniedDialogComponent } from '../../../shared/permission-denied-dialog/permission-denied-dialog.component'; // ✅ AGREGADO
import { Producto, Categoria, Estado } from '../../../models/catalogo.model';
import { CatalogoService } from '../../../services/catalogo.service';
import { AuthService } from '../../../services/auth.service'; // ✅ AGREGADO
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-editar',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderAdminComponent, FooterAdminComponent],
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

  // Propiedades del carrusel
  indiceActual: number = 0;
  itemsVisibles: number = 5;
  itemWidth: number = 180;
  desplazamiento: number = 0;
  totalItems: number = 0;

  constructor(
    private catalogoService: CatalogoService,
    private authService: AuthService, // ✅ AGREGADO
    private dialog: MatDialog, // ✅ AGREGADO
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  anteriorCategoria(): void {
    if (this.indiceActual > 0) {
      this.indiceActual--;
    } else {
      this.indiceActual = Math.max(0, this.totalItems - this.itemsVisibles);
    }
    this.actualizarDesplazamiento();
  }

  siguienteCategoria(): void {
    if (this.indiceActual < this.totalItems - this.itemsVisibles) {
      this.indiceActual++;
    } else {
      this.indiceActual = 0;
    }
    this.actualizarDesplazamiento();
  }

  actualizarDesplazamiento(): void {
    this.desplazamiento = -this.indiceActual * this.itemWidth;
  }

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
            this.productos[index].imagenUrl = response.imagen_url;

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
        this.totalItems = this.categorias.length + 1;
        console.log('✅ Categorías cargadas:', this.categorias);
        console.log('📊 IDs de categorías:', this.categorias.map(c => ({ id: c.id, nombre: c.nombre })));
      },
      error: (error) => {
        console.error('❌ Error cargando categorías:', error);
        this.categorias = [];
        this.totalItems = 1;
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
    console.log('🔧 Intentando editar producto:', producto.nombre);
    
    // ✅ AGREGADO: Validación de permisos para editar
    if (!this.authService.hasPermission('catalogo.change_appkioskoproductos')) {
      console.log('❌ Sin permisos para editar productos');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, redirigiendo a edición');
    this.router.navigate(['/administrador/gestion-productos/crear', producto.id]);
  }

  // ✅ AGREGADO: Método para mostrar diálogo sin permisos
  private mostrarDialogoSinPermisos(): void {
    console.log('🔒 Mostrando diálogo de sin permisos');
    this.dialog.open(PermissionDeniedDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'permission-denied-dialog-panel'
    });
  }

  // ✅ AGREGADO: Método para verificar permisos desde template
  tienePermisoEditar(): boolean {
    return this.authService.hasPermission('catalogo.change_appkioskoproductos');
  }

  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) return '';
    return `${environment.baseUrl}${imagenUrl}`;
  }
}