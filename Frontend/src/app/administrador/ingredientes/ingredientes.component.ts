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

// ✅ INTERFAZ PARA ORGANIZAR DATOS
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

  // ✅ NUEVA ESTRUCTURA DINÁMICA
  categoriasConIngredientes: CategoriaConIngredientes[] = [];
  cargandoCategorias = false;
  errorCargandoCategorias = false;

  ngOnInit() {
    this.cargarCategoriasYIngredientes();
  }

  // ✅ CARGAR CATEGORÍAS DINÁMICAS Y SUS INGREDIENTES
  cargarCategoriasYIngredientes() {
    this.cargandoCategorias = true;
    this.errorCargandoCategorias = false;

    console.log('🔄 Cargando categorías dinámicas...');

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        console.log(`✅ ${categorias.length} categorías cargadas`);
        
        // Filtrar solo categorías que tienen ingredientes o crear estructura vacía
        this.categoriasConIngredientes = categorias
          .filter(categoria => categoria.ingredientes_count !== undefined)
          .sort((a, b) => {
            // Ordenar por más ingredientes primero, luego alfabético
            const countA = a.ingredientes_count || 0;
            const countB = b.ingredientes_count || 0;
            
            if (countA !== countB) {
              return countB - countA; // Más ingredientes primero
            }
            
            return a.nombre.localeCompare(b.nombre);
          })
          .map(categoria => ({
            categoria,
            ingredientes: [],
            cargando: false
          }));

        this.cargandoCategorias = false;
        
        // Cargar ingredientes para cada categoría
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
    console.log('🔄 Cargando ingredientes para todas las categorías...');
    
    this.categoriasConIngredientes.forEach(categoriaItem => {
      this.cargarIngredientesPorCategoria(categoriaItem);
    });
  }

  cargarIngredientesPorCategoria(categoriaItem: CategoriaConIngredientes) {
    const nombreCategoria = categoriaItem.categoria.nombre.toLowerCase();
    categoriaItem.cargando = true;
    
    console.log(`🔍 Cargando ingredientes para: ${categoriaItem.categoria.nombre}`);
    
    this.catalogoService.getIngredientesPorCategoriaFiltro(nombreCategoria)
      .subscribe({
        next: (ingredientes) => {
          categoriaItem.ingredientes = ingredientes;
          categoriaItem.cargando = false;
          console.log(`✅ ${ingredientes.length} ingredientes cargados para ${categoriaItem.categoria.nombre}`);
        },
        error: (error) => {
          console.error(`❌ Error al cargar ingredientes de ${categoriaItem.categoria.nombre}:`, error);
          categoriaItem.cargando = false;
          categoriaItem.ingredientes = []; // Asegurar array vacío en caso de error
          
          // Solo mostrar error si no es un 404 (categoría sin ingredientes)
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

  // ✅ HELPER: Recargar una categoría específica
  recargarCategoria(categoriaItem: CategoriaConIngredientes) {
    this.cargarIngredientesPorCategoria(categoriaItem);
  }

  crearIngrediente() {
    console.log('✏️ Intentando crear nuevo ingrediente');
    
    // ✅ AGREGADO: Validación de permisos para crear
    if (!this.authService.hasPermission('catalogo.add_appkioskoingredientes')) {
      console.log('❌ Sin permisos para crear ingredientes');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, redirigiendo a creación');
    this.router.navigate(['/administrador/gestion-ingredientes/crear']);
  }

  editarIngrediente(id: number) {
    console.log('✏️ Intentando editar ingrediente ID:', id);
    
    // ✅ AGREGADO: Validación de permisos para editar
    if (!this.authService.hasPermission('catalogo.change_appkioskoingredientes')) {
      console.log('❌ Sin permisos para editar ingredientes');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, redirigiendo a edición');
    this.router.navigate(['/administrador/gestion-ingredientes/crear', id]);
  }

  eliminarIngrediente(ingrediente: Ingrediente) {
    console.log('🗑️ Intentando eliminar ingrediente:', ingrediente.nombre);
    
    // ✅ AGREGADO: Validación de permisos para eliminar
    if (!this.authService.hasPermission('catalogo.delete_appkioskoingredientes')) {
      console.log('❌ Sin permisos para eliminar ingredientes');
      this.mostrarDialogoSinPermisos();
      return;
    }

    console.log('✅ Permisos validados, procediendo con eliminación');

    const confirmacion = confirm(
      `¿Estás seguro de que quieres eliminar el ingrediente "${ingrediente.nombre}"?\n\n` +
      `Esta acción no se puede deshacer y puede afectar productos que usen este ingrediente.`
    );

    if (confirmacion) {
      console.log('🗑️ Eliminando ingrediente:', ingrediente.nombre);
      
      this.catalogoService.eliminarIngrediente(ingrediente.id)
        .subscribe({
          next: (response) => {
            console.log('✅ Ingrediente eliminado:', response);
            
            this.snackBar.open(
              `Ingrediente "${ingrediente.nombre}" eliminado correctamente`, 
              'Cerrar', 
              { duration: 3000 }
            );
            
            // Recargar la categoría correspondiente
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
  }

  private mostrarDialogoSinPermisos(): void {
    console.log('🔒 Mostrando diálogo de sin permisos');
    this.dialog.open(PermissionDeniedDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'permission-denied-dialog-panel'
    });
  }

  // ✅ HELPERS
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

  // ✅ REFRESCAR TODO
  refrescar() {
    this.cargarCategoriasYIngredientes();
  }

  // ✅ GETTERS DINÁMICOS
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

  // ✅ HELPER: Obtener estadísticas
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

  // ✅ HELPER: TrackBy para optimizar rendering
  trackByCategoria(index: number, item: CategoriaConIngredientes): number {
    return item.categoria.id || index;
  }

  trackByIngrediente(index: number, ingrediente: Ingrediente): number {
    return ingrediente.id;
  }

  // Helper para obtener color del icono de stock
  getStockIconColor(ingrediente: Ingrediente): string {
    if (ingrediente.esta_agotado) return 'warn';
    if (ingrediente.necesita_reposicion) return 'accent';
    return 'primary';
  }

  // Helper para obtener color del estado
  getEstadoColor(estadoStock: string | undefined): string {
    if (!estadoStock) return 'primary'; // ✅ Valor por defecto
    
    switch (estadoStock.toLowerCase()) {
      case 'disponible': return 'primary';
      case 'agotado': return 'warn';
      case 'stock_bajo': return 'accent';
      default: return 'primary';
    }
  }

  // Helper para obtener icono del estado
  getEstadoIcon(estadoStock: string | undefined): string {
    if (!estadoStock) return 'help'; // ✅ Valor por defecto
    
    switch (estadoStock.toLowerCase()) {
      case 'disponible': return 'check_circle';
      case 'agotado': return 'cancel';
      case 'stock_bajo': return 'warning';
      default: return 'help';
    }
  }

  // Helper para etiquetas de tabs
  getCategoriaTabLabel(categoriaItem: CategoriaConIngredientes): string {
    const count = categoriaItem.ingredientes.length;
    const loading = categoriaItem.cargando ? ' ⏳' : '';
    return `${categoriaItem.categoria.nombre} (${count})${loading}`;
  }

  // Helper para porcentajes en resumen
  getCategoriaPorcentaje(categoriaItem: CategoriaConIngredientes): number {
    if (this.totalIngredientes === 0) return 0;
    return (categoriaItem.ingredientes.length / this.totalIngredientes) * 100;
  }

  // Navegación pública para template
  navegarACategorias(): void {
    this.router.navigate(['/administrador/gestion-categorias']);
  }
}