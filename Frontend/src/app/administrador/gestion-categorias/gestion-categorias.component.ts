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

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias.sort((a, b) => {
          const totalA = (a.productos_count || 0) + (a.ingredientes_count || 0);
          const totalB = (b.productos_count || 0) + (b.ingredientes_count || 0);

          if (totalA !== totalB) {
            return totalB - totalA;
          }

          return a.nombre.localeCompare(b.nombre);
        });

        this.loading = false;
      },
      error: (error) => {
        this.error = error.message;
        this.loading = false;
      }
    });
  }

  irACrearCategoria(): void {
    if (!this.authService.hasPermission('catalogo.add_appkioskocategorias')) {
      this.mostrarDialogoSinPermisos();
      return;
    }

    this.router.navigate(['/administrador/gestion-categorias/crear']);
  }

  editarCategoria(categoria: Categoria): void {
    if (!this.authService.hasPermission('catalogo.change_appkioskocategorias')) {
      this.mostrarDialogoSinPermisos();
      return;
    }

    this.router.navigate(['/administrador/gestion-categorias/crear', categoria.id]);
  }

  cerrarDetalles(): void {
    this.mostrarDetalles = false;
    this.categoriaSeleccionada = null;
  }

  eliminarCategoria(categoria: Categoria): void {
    if (!categoria.id || categoria.id <= 0) {
      return;
    }

    if (!this.authService.hasPermission('catalogo.delete_appkioskocategorias')) {
      this.mostrarDialogoSinPermisos();
      return;
    }

    if (!categoria.puede_eliminar) {
      this.mostrarDialogoCategoriaNoPuedeEliminarse(categoria);
      return;
    }

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
        this.procederConEliminacionCategoria(categoria);
      } else {
      }
    });
  }

  private procederConEliminacionCategoria(categoria: Categoria): void {
    this.categoriaService.eliminarCategoria(categoria.id!).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarDialogExito(
            'Categoría Eliminada',
            `La categoría "${categoria.nombre}" ha sido eliminada exitosamente.`,
            'Continuar'
          );
          this.cargarCategorias();
        } else {
          this.mostrarDialogError(response.error || 'Error al eliminar categoría');
        }
      },
      error: (error) => {
        this.mostrarDialogError(error.message || 'Error al eliminar categoría');
      }
    });
  }

  private mostrarDialogoSinPermisos(): void {
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
        this.crearCategoriasSecuencial(categoriasDefault, 0);
      } else {
      }
    });
  }

  private crearCategoriasSecuencial(categorias: string[], index: number): void {
    if (index >= categorias.length) {
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
        } else {
        }
        this.crearCategoriasSecuencial(categorias, index + 1);
      },
      error: (error) => {
        this.crearCategoriasSecuencial(categorias, index + 1);
      }
    });
  }

  getImagenUrl(categoria: Categoria): string {
    const url = this.categoriaService.getFullImageUrl(categoria.imagen_url);

    if (categoria.nombre.toLowerCase().includes('bebida')) {
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
    });
  }

  refrescar(): void {
    this.cargarCategorias();
  }
}
