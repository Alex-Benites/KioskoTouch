// ✅ ACTUALIZAR Frontend/src/app/administrador/gestion-categorias/gestion-categorias.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';

@Component({
  selector: 'app-gestion-categorias',
  standalone: true,
  imports: [
    CommonModule,
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  templateUrl: './gestion-categorias.component.html',
  styleUrls: ['./gestion-categorias.component.scss']
})
export class GestionCategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  loading = false;
  error: string | null = null;

  // ✅ NUEVAS PROPIEDADES PARA POPUP
  mostrarDetalles = false;
  categoriaSeleccionada: Categoria | null = null;

  constructor(
    private categoriaService: CategoriaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  verDetalles(categoria: Categoria): void {
    this.categoriaSeleccionada = categoria;
    this.mostrarDetalles = true;
    // ✅ Evitar scroll del body cuando popup está abierto
    document.body.style.overflow = 'hidden';
  }

    editarDesdePopup(): void {
    if (this.categoriaSeleccionada) {
      this.cerrarDetalles();
      this.editarCategoria(this.categoriaSeleccionada);
    }
  }

  getProductosPercentage(categoria: Categoria): number {
    const total = this.getTotalElementos(categoria);
    return total > 0 ? ((categoria.productos_count || 0) / total) * 100 : 0;
  }

  getIngredientesPercentage(categoria: Categoria): number {
    const total = this.getTotalElementos(categoria);
    return total > 0 ? ((categoria.ingredientes_count || 0) / total) * 100 : 0;
  }

  cargarCategorias(): void {
    this.loading = true;
    this.error = null;

    console.log('🔄 Cargando categorías dinámicamente...');

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias.sort((a, b) => {
          // Ordenar por más usadas primero, luego por nombre
          const totalA = (a.productos_count || 0) + (a.ingredientes_count || 0);
          const totalB = (b.productos_count || 0) + (b.ingredientes_count || 0);
          
          if (totalA !== totalB) {
            return totalB - totalA; // Más usadas primero
          }
          
          return a.nombre.localeCompare(b.nombre); // Luego alfabético
        });
        
        this.loading = false;
        console.log(`✅ ${categorias.length} categorías cargadas dinámicamente`);
        console.log('📊 Estadísticas:', this.getEstadisticas());
      },
      error: (error) => {
        this.error = error.message;
        this.loading = false;
        console.error('❌ Error cargando categorías:', error);
      }
    });
  }

  // ✅ NAVEGACIÓN
  irACrearCategoria(): void {
    this.router.navigate(['/administrador/gestion-categorias/crear']);
  }

  editarCategoria(categoria: Categoria): void {
    this.router.navigate(['/administrador/gestion-categorias/crear', categoria.id]);
  }


  cerrarDetalles(): void {
    this.mostrarDetalles = false;
    this.categoriaSeleccionada = null;
    // ✅ Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }

  // ✅ ELIMINAR CATEGORÍA
  eliminarCategoria(categoria: Categoria): void {
    if (!categoria.id) return;

    // Verificar si puede eliminar
    if (!categoria.puede_eliminar) {
      const productosText = categoria.productos_count ? `${categoria.productos_count} productos` : '';
      const ingredientesText = categoria.ingredientes_count ? `${categoria.ingredientes_count} ingredientes` : '';
      const relaciones = [productosText, ingredientesText].filter(Boolean).join(' y ');
      
      alert(`❌ No se puede eliminar la categoría "${categoria.nombre}"\n\n` +
            `Motivo: Tiene ${relaciones} asociados.\n\n` +
            `Para eliminar esta categoría, primero debes:\n` +
            `• Reasignar o eliminar los productos asociados\n` +
            `• Reasignar o eliminar los ingredientes asociados`);
      return;
    }

    // Confirmar eliminación
    const confirmacion = confirm(
      `🗑️ ¿Eliminar categoría "${categoria.nombre}"?\n\n` +
      `Esta acción no se puede deshacer.\n\n` +
      `✅ Esta categoría no tiene elementos asociados, es seguro eliminarla.`
    );

    if (!confirmacion) return; // ✅ CORREGIDO: confirmacion (sin acento)

    console.log(`🗑️ Eliminando categoría: ${categoria.nombre}`);

    this.categoriaService.eliminarCategoria(categoria.id).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Categoría eliminada exitosamente');
          alert(`✅ ${response.mensaje}`);
          this.cargarCategorias(); // Recargar lista
        } else {
          console.error('❌ Error en respuesta:', response.error);
          alert(`❌ ${response.error || 'Error al eliminar categoría'}`);
        }
      },
      error: (error) => {
        console.error('❌ Error eliminando categoría:', error);
        alert(`❌ ${error.message || 'Error al eliminar categoría'}`);
      }
    });
  }

  // ✅ CREAR CATEGORÍAS POR DEFECTO
  cargarCategoriasDefault(): void {
    const categoriasDefault = [
      'Hamburguesas', 'Pizzas', 'Ensaladas', 'Pollos', 'Helados',
      'Bebidas', 'Snacks', 'Infantil', 'Combos', 'Desayunos'
    ];

    const confirmacion = confirm(
      `¿Crear ${categoriasDefault.length} categorías por defecto?\n\n` +
      `Se crearán: ${categoriasDefault.join(', ')}\n\n` +
      `Las categorías que ya existan serán omitidas.`
    );

    if (!confirmacion) return; // ✅ CORREGIDO: confirmacion (sin acento)

    console.log('🎯 Creando categorías por defecto...');

    // Crear categorías una por una
    this.crearCategoriasSecuencial(categoriasDefault, 0);
  }

  private crearCategoriasSecuencial(categorias: string[], index: number): void {
    if (index >= categorias.length) {
      console.log('✅ Proceso de creación de categorías completado');
      alert('✅ Categorías por defecto creadas exitosamente');
      this.cargarCategorias();
      return;
    }

    const nombre = categorias[index];
    const formData = this.categoriaService.crearFormData({ nombre });

    this.categoriaService.crearCategoria(formData).subscribe({
      next: (response) => {
        if (response.success) {
          console.log(`✅ Categoría creada: ${nombre}`);
        } else {
          console.log(`⚠️ Categoría omitida: ${nombre} (ya existe)`);
        }
        // Continuar con la siguiente
        this.crearCategoriasSecuencial(categorias, index + 1);
      },
      error: (error) => {
        console.log(`⚠️ Error con categoría ${nombre}:`, error.message);
        // Continuar con la siguiente aunque haya error
        this.crearCategoriasSecuencial(categorias, index + 1);
      }
    });
  }

  // ✅ HELPERS SIMPLIFICADOS
  getImagenUrl(categoria: Categoria): string {
    return this.categoriaService.getFullImageUrl(categoria.imagen_url);
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  onImageError(event: any): void {
    event.target.src = 'assets/placeholder-categoria.png';
  }

  // ✅ ESTADÍSTICAS
  getTotalProductos(): number {
    return this.categorias.reduce((total, cat) => total + (cat.productos_count || 0), 0);
  }

  getTotalIngredientes(): number {
    return this.categorias.reduce((total, cat) => total + (cat.ingredientes_count || 0), 0);
  }

  getTotalElementos(categoria: Categoria): number {
    return (categoria.productos_count || 0) + (categoria.ingredientes_count || 0);
  }

  getUsoPercentage(categoria: Categoria): number {
    const total = this.getTotalElementos(categoria);
    const maxUsage = Math.max(...this.categorias.map(c => this.getTotalElementos(c)));
    return maxUsage > 0 ? (total / maxUsage) * 100 : 0;
  }

  esCategoriaMasUsada(categoria: Categoria): boolean {
    const total = this.getTotalElementos(categoria);
    const maxUsage = Math.max(...this.categorias.map(c => this.getTotalElementos(c)));
    return total > 0 && total === maxUsage;
  }

  trackByCategoria(index: number, categoria: Categoria): number {
    return categoria.id || index;
  }

  getEstadisticas() {
    return {
      total: this.categorias.length,
      conProductos: this.categorias.filter(c => (c.productos_count || 0) > 0).length,
      conIngredientes: this.categorias.filter(c => (c.ingredientes_count || 0) > 0).length,
      vacias: this.categorias.filter(c => this.getTotalElementos(c) === 0).length,
      protegidas: this.categorias.filter(c => !c.puede_eliminar).length
    };
  }

  // ✅ REFRESH
  refrescar(): void {
    this.cargarCategorias();
  }
}