import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';
import { CatalogoService } from '../../services/catalogo.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { PermissionDeniedDialogComponent } from '../../shared/permission-denied-dialog/permission-denied-dialog.component';
import { Ingrediente } from '../../models/catalogo.model';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';


interface CategoriaConIngredientes {
  categoria: Categoria;
  ingredientes: Ingrediente[];
  cargando: boolean;
}

@Component({
  selector: 'app-ingredientes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  templateUrl: './ingredientes.component.html',
  styleUrls: ['./ingredientes.component.scss']
})
export class IngredientesComponent implements OnInit {

  private catalogoService = inject(CatalogoService);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  categoriasConIngredientes: CategoriaConIngredientes[] = [];
  cargandoCategorias = false;
  errorCargandoCategorias = false;

  ngOnInit() {
    this.cargarCategoriasYIngredientes();
  }

  cargarCategoriasYIngredientes() {
    this.cargandoCategorias = true;
    this.errorCargandoCategorias = false;


    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {

        this.categoriasConIngredientes = categorias
          .filter(categoria => categoria.ingredientes_count !== undefined)
          .sort((a, b) => {
            const countA = a.ingredientes_count || 0;
            const countB = b.ingredientes_count || 0;

            if (countA !== countB) {
              return countB - countA; 
            }

            return a.nombre.localeCompare(b.nombre);
          })
          .map(categoria => ({
            categoria,
            ingredientes: [],
            cargando: false
          }));

        this.cargandoCategorias = false;

        this.cargarTodosLosIngredientes();
      },
      error: (error) => {
        console.error('❌ Error cargando categorías:', error);
        this.cargandoCategorias = false;
        this.errorCargandoCategorias = true;
        this.snackBar.open('Error al cargar categorías', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  cargarTodosLosIngredientes() {

    this.categoriasConIngredientes.forEach(categoriaItem => {
      this.cargarIngredientesPorCategoria(categoriaItem);
    });
  }

  cargarIngredientesPorCategoria(categoriaItem: CategoriaConIngredientes) {
    const nombreCategoria = categoriaItem.categoria.nombre.toLowerCase();
    categoriaItem.cargando = true;


    this.catalogoService.getIngredientesPorCategoriaFiltro(nombreCategoria)
      .subscribe({
        next: (ingredientes) => {
          categoriaItem.ingredientes = ingredientes;
          categoriaItem.cargando = false;
        },
        error: (error) => {
          console.error(`❌ Error al cargar ingredientes de ${categoriaItem.categoria.nombre}:`, error);
          categoriaItem.cargando = false;
          categoriaItem.ingredientes = []; 

          if (error.status !== 404) {
            this.snackBar.open(
              `Error al cargar ingredientes de ${categoriaItem.categoria.nombre}`,
              'Cerrar',
              { duration: 3000 }
            );
          }
        }
      });
  }

  recargarCategoria(categoriaItem: CategoriaConIngredientes) {
    this.cargarIngredientesPorCategoria(categoriaItem);
  }

  crearIngrediente() {

    if (!this.authService.hasPermission('catalogo.add_appkioskoingredientes')) {
      this.mostrarDialogoSinPermisos();
      return;
    }

    this.router.navigate(['/administrador/gestion-ingredientes/crear']);
  }

  editarIngrediente(id: number) {
    console.log('✏️ Intentando editar ingrediente ID:', id);

    if (!this.authService.hasPermission('catalogo.change_appkioskoingredientes')) {
      this.mostrarDialogoSinPermisos();
      return;
    }

    this.router.navigate(['/administrador/gestion-ingredientes/crear', id]);
  }

  eliminarIngrediente(ingrediente: Ingrediente) {
    console.log('🗑️ Intentando eliminar ingrediente:', ingrediente.nombre);

    if (!this.authService.hasPermission('catalogo.delete_appkioskoingredientes')) {
      this.mostrarDialogoSinPermisos();
      return;
    }


    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: `INGREDIENTE "${ingrediente.nombre.toUpperCase()}"`,
        action: 'delete',
        context: 'admin' 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('🎯 Respuesta del diálogo de eliminación:', result);

      if (result === true) {
        this.procederConEliminacion(ingrediente);
      } else {
      }
    });
  }

  private procederConEliminacion(ingrediente: Ingrediente): void {

    this.catalogoService.eliminarIngrediente(ingrediente.id)
      .subscribe({
        next: (response) => {

          this.snackBar.open(
            `Ingrediente "${ingrediente.nombre}" eliminado correctamente`,
            'Cerrar',
            { duration: 3000 }
          );

          const categoriaItem = this.categoriasConIngredientes.find(
            item => item.categoria.nombre.toLowerCase() === ingrediente.categoria_producto.toLowerCase()
          );

          if (categoriaItem) {
            this.recargarCategoria(categoriaItem);
          }
        },
        error: (error) => {
          console.error('❌ Error al eliminar ingrediente:', error);

          let mensaje = 'Error al eliminar el ingrediente';
          if (error.error?.error && error.error.error.includes('siendo usado')) {
            mensaje = error.error.error;
          }

          this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000
          });
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

  getFullImageUrl(imagenUrl: string | undefined): string {
    return this.catalogoService.getFullImageUrl(imagenUrl);
  }

  getCategoriaImagenUrl(categoria: Categoria): string {
    return this.categoriaService.getFullImageUrl(categoria.imagen_url);
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/no-image.png';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  volver() {
    this.router.navigate(['/administrador/gestion-productos']);
  }

  refrescar() {
    this.cargarCategoriasYIngredientes();
  }

  get totalCategorias(): number {
    return this.categoriasConIngredientes.length;
  }

  get totalIngredientes(): number {
    return this.categoriasConIngredientes.reduce(
      (total, item) => total + item.ingredientes.length,
      0
    );
  }

  get categoriasConIngredientesDisponibles(): CategoriaConIngredientes[] {
    return this.categoriasConIngredientes.filter(item => item.ingredientes.length > 0);
  }

  get categoriasSinIngredientes(): CategoriaConIngredientes[] {
    return this.categoriasConIngredientes.filter(item => item.ingredientes.length === 0);
  }

  getEstadisticas() {
    return {
      totalCategorias: this.totalCategorias,
      totalIngredientes: this.totalIngredientes,
      categoriasConIngredientes: this.categoriasConIngredientesDisponibles.length,
      categoriasSinIngredientes: this.categoriasSinIngredientes.length,
      promedioPorCategoria: this.totalCategorias > 0 ?
        Math.round(this.totalIngredientes / this.totalCategorias) : 0
    };
  }

  trackByCategoria(index: number, item: CategoriaConIngredientes): number {
    return item.categoria.id || index;
  }

  trackByIngrediente(index: number, ingrediente: Ingrediente): number {
    return ingrediente.id;
  }

  getStockIconColor(ingrediente: Ingrediente): string {
    if (ingrediente.esta_agotado) return 'warn';
    if (ingrediente.necesita_reposicion) return 'accent';
    return 'primary';
  }

  getEstadoColor(estadoStock: string | undefined): string {
    if (!estadoStock) return 'primary'; 

    switch (estadoStock.toLowerCase()) {
      case 'disponible': return 'primary';
      case 'agotado': return 'warn';
      case 'stock_bajo': return 'accent';
      default: return 'primary';
    }
  }

  getEstadoIcon(estadoStock: string | undefined): string {
    if (!estadoStock) return 'help'; 

    switch (estadoStock.toLowerCase()) {
      case 'disponible': return 'check_circle';
      case 'agotado': return 'cancel';
      case 'stock_bajo': return 'warning';
      default: return 'help';
    }
  }

  getCategoriaTabLabel(categoriaItem: CategoriaConIngredientes): string {
    const count = categoriaItem.ingredientes.length;
    const loading = categoriaItem.cargando ? ' ⏳' : '';
    return `${categoriaItem.categoria.nombre} (${count})${loading}`;
  }

  getCategoriaPorcentaje(categoriaItem: CategoriaConIngredientes): number {
    if (this.totalIngredientes === 0) return 0;
    return (categoriaItem.ingredientes.length / this.totalIngredientes) * 100;
  }

  navegarACategorias(): void {
    this.router.navigate(['/administrador/gestion-categorias']);
  }
}