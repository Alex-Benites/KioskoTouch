import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';
import { AuthService } from '../../services/auth.service';
import { PermissionDeniedDialogComponent } from '../../shared/permission-denied-dialog/permission-denied-dialog.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { SuccessDialogComponent, SuccessDialogData } from '../../shared/success-dialog/success-dialog.component';
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

  mostrarDetalles = false;
  categoriaSeleccionada: Categoria | null = null;

  constructor(
    private categoriaService: CategoriaService,
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  verDetalles(categoria: Categoria): void {
    this.categoriaSeleccionada = categoria;
    this.mostrarDetalles = true;
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

  irACrearCategoria(): void {
    console.log('✏️ Intentando crear nueva categoría');

    if (!this.authService.hasPermission('catalogo.add_appkioskocategorias')) {
      console.log('❌ Sin permisos para crear categorías');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, redirigiendo a creación');
    this.router.navigate(['/administrador/gestion-categorias/crear']);
  }

  editarCategoria(categoria: Categoria): void {
    console.log('✏️ Intentando editar categoría ID:', categoria.id);

    if (!this.authService.hasPermission('catalogo.change_appkioskocategorias')) {
      console.log('❌ Sin permisos para editar categorías');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, redirigiendo a edición');
    this.router.navigate(['/administrador/gestion-categorias/crear', categoria.id]);
  }

  cerrarDetalles(): void {
    this.mostrarDetalles = false;
    this.categoriaSeleccionada = null;
  }

  eliminarCategoria(categoria: Categoria): void {
    // ✅ VALIDACIÓN más estricta del ID
    if (!categoria.id || categoria.id <= 0) {
      console.error('❌ Error: Categoría sin ID válido');
      return;
    }

    console.log('🗑️ Intentando eliminar categoría:', categoria.nombre);

    // ✅ Validación de permisos
    if (!this.authService.hasPermission('catalogo.delete_appkioskocategorias')) {
      console.log('❌ Sin permisos para eliminar categorías');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, verificando si puede eliminar');

    // ✅ Verificar si la categoría puede ser eliminada
    if (!categoria.puede_eliminar) {
      console.log('❌ Categoría protegida, no se puede eliminar');
      this.mostrarDialogoCategoriaNoPuedeEliminarse(categoria);
      return;
    }

    console.log('✅ Categoría puede eliminarse, mostrando diálogo de confirmación');
    this.mostrarDialogoConfirmacionEliminacion(categoria);
  }

  private mostrarDialogoCategoriaNoPuedeEliminarse(categoria: Categoria): void {
    const productosCount = categoria.productos_count || 0;
    const ingredientesCount = categoria.ingredientes_count || 0;
    
    const mensaje = `No se puede eliminar la categoría "${categoria.nombre}" porque tiene ${productosCount} productos y ${ingredientesCount} ingredientes asociados.`;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: 'CATEGORÍA PROTEGIDA',
        action: 'warning',
        context: 'admin',
        extraInfo: {
          mensaje: mensaje,
          soloConfirmar: true,
          detalles: `Productos: ${productosCount} | Ingredientes: ${ingredientesCount}`
        }
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('⚠️ Diálogo de categoría protegida cerrado');
    });
  }

  private mostrarDialogoConfirmacionEliminacion(categoria: Categoria): void {
    const dialogData: ConfirmationDialogData = {
      itemType: 'categoría',
      action: 'delete'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        // Usuario confirmó → Eliminar la categoría
        console.log(`✅ Confirmado: Eliminando categoría ${categoria.nombre}`);
        this.procederConEliminacionCategoria(categoria);
      } else {
        // Usuario canceló → No hacer nada
        console.log(`❌ Cancelado: La categoría ${categoria.nombre} no será eliminada`);
      }
    });
  }

  // ✅ NUEVO: Método separado para proceder con la eliminación
  private procederConEliminacionCategoria(categoria: Categoria): void {
    console.log(`🗑️ Eliminando categoría: ${categoria.nombre}`);

    // ✅ USANDO: Operador de aserción no nula (!)
    this.categoriaService.eliminarCategoria(categoria.id!).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Categoría eliminada exitosamente');
          this.mostrarDialogExito(
            'Categoría Eliminada',
            `La categoría "${categoria.nombre}" ha sido eliminada exitosamente.`,
            'Continuar'
          );
          this.cargarCategorias();
        } else {
          console.error('❌ Error en respuesta:', response.error);
          this.mostrarDialogError(response.error || 'Error al eliminar categoría');
        }
      },
      error: (error) => {
        console.error('❌ Error eliminando categoría:', error);
        this.mostrarDialogError(error.message || 'Error al eliminar categoría');
      }
    });
  }

  private mostrarDialogoSinPermisos(): void {
    console.log('🔒 Mostrando diálogo de sin permisos');
    this.dialog.open(PermissionDeniedDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'permission-denied-dialog-panel'
    });
  }

  cargarCategoriasDefault(): void {
    const categoriasDefault = [
      'Hamburguesas', 'Pizzas', 'Ensaladas', 'Pollos', 'Helados',
      'Bebidas', 'Snacks', 'Infantil', 'Combos', 'Desayunos'
    ];

    console.log('🎯 Solicitando confirmación para crear categorías por defecto');

    const dialogData: ConfirmationDialogData = {
      itemType: 'categorías por defecto',
      action: 'create'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        console.log('✅ Confirmado: Creando categorías por defecto');
        this.crearCategoriasSecuencial(categoriasDefault, 0);
      } else {
        console.log('❌ Cancelado: No se crearán categorías por defecto');
      }
    });
  }

  private crearCategoriasSecuencial(categorias: string[], index: number): void {
    if (index >= categorias.length) {
      console.log('✅ Proceso de creación de categorías completado');
      this.mostrarDialogExito(
        'Categorías Creadas',
        'Las categorías por defecto han sido creadas exitosamente.',
        'Continuar'
      );
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

  // ✅ MODIFICAR: Método getImagenUrl con debug
  getImagenUrl(categoria: Categoria): string {
    const url = this.categoriaService.getFullImageUrl(categoria.imagen_url);

    // ✅ DEBUG: Solo para la categoría Bebidas
    if (categoria.nombre.toLowerCase().includes('bebida')) {
      console.log('🔍 DEBUG IMAGEN BEBIDAS:');
      console.log('   - Nombre:', categoria.nombre);
      console.log('   - imagen_url original:', categoria.imagen_url);
      console.log('   - URL completa generada:', url);
      console.log('   - Categoría completa:', categoria);
    }

    return url;
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

  private mostrarDialogExito(title: string, message: string, buttonText: string = 'Continuar'): void {
    const dialogData: SuccessDialogData = {
      title,
      message,
      buttonText
    };

    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('✅ Diálogo de éxito cerrado');
    });
  }

  private mostrarDialogError(mensaje: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: 'ERROR',
        action: 'error',
        context: 'admin',
        extraInfo: {
          mensaje: mensaje,
          soloConfirmar: true
        }
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('❌ Diálogo de error cerrado');
    });
  }

  // ✅ REFRESH
  refrescar(): void {
    this.cargarCategorias();
  }
}