import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';
import { AuthService } from '../../services/auth.service';
import { PermissionDeniedDialogComponent } from '../../shared/permission-denied-dialog/permission-denied-dialog.component';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
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

  // ✅ REEMPLAZAR: Método eliminarCategoria completo con diálogos elegantes
  eliminarCategoria(categoria: Categoria): void {
    // ✅ VALIDACIÓN más estricta del ID
    if (!categoria.id || categoria.id <= 0) {
      console.error('❌ Error: Categoría sin ID válido');
      this.mostrarDialogoError('Error: No se puede eliminar una categoría sin identificador válido');
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
      console.log('❌ Categoría protegida, mostrando diálogo informativo');
      this.mostrarDialogoCategoriaNoPuedeEliminarse(categoria);
      return;
    }

    // ✅ Categoría puede eliminarse - Mostrar diálogo de confirmación
    console.log('✅ Categoría puede eliminarse, mostrando diálogo de confirmación');
    this.mostrarDialogoConfirmacionEliminacion(categoria);
  }

  // ✅ NUEVO: Método para mostrar diálogo cuando la categoría no puede eliminarse
  private mostrarDialogoCategoriaNoPuedeEliminarse(categoria: Categoria): void {
    const productosText = categoria.productos_count ? `${categoria.productos_count} productos` : '';
    const ingredientesText = categoria.ingredientes_count ? `${categoria.ingredientes_count} ingredientes` : '';
    const relaciones = [productosText, ingredientesText].filter(Boolean).join(' y ');

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: `CATEGORÍA "${categoria.nombre.toUpperCase()}"`,
        action: 'protect', // ✅ Acción especial para categorías protegidas
        context: 'admin',
        extraInfo: {
          relaciones: relaciones,
          esProtegida: true
        }
      }
    });

    // ✅ Solo hay botón de "Entendido" para categorías protegidas
    dialogRef.afterClosed().subscribe(result => {
      console.log('🎯 Diálogo de categoría protegida cerrado:', result);
    });
  }

  // ✅ NUEVO: Método para mostrar diálogo de confirmación de eliminación
  private mostrarDialogoConfirmacionEliminacion(categoria: Categoria): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: `CATEGORÍA "${categoria.nombre.toUpperCase()}"`,
        action: 'delete',
        context: 'admin'
      }
    });

    // ✅ Manejar la respuesta del diálogo
    dialogRef.afterClosed().subscribe(result => {
      console.log('🎯 Respuesta del diálogo de eliminación:', result);

      if (result === true) {
        // ✅ Usuario confirmó → Eliminar la categoría
        console.log(`✅ Confirmado: Eliminando categoría ${categoria.nombre}`);
        this.procederConEliminacionCategoria(categoria);
      } else {
        // ✅ Usuario canceló → No hacer nada
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

          this.mostrarDialogoExito(`Categoría "${categoria.nombre}" eliminada correctamente`);
          this.cargarCategorias();
        } else {
          console.error('❌ Error en respuesta:', response.error);
          this.mostrarDialogoError(response.error || 'Error al eliminar categoría');
        }
      },
      error: (error) => {
        console.error('❌ Error eliminando categoría:', error);
        this.mostrarDialogoError(error.message || 'Error al eliminar categoría');
      }
    });
  }

  // ✅ NUEVO: Método para mostrar diálogo de éxito
  private mostrarDialogoExito(mensaje: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: 'OPERACIÓN EXITOSA',
        action: 'success',
        context: 'admin',
        extraInfo: {
          mensaje: mensaje,
          soloConfirmar: true
        }
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('✅ Diálogo de éxito cerrado');
    });
  }

  // ✅ NUEVO: Método para mostrar diálogo de error
  private mostrarDialogoError(mensaje: string): void {
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

  private mostrarDialogoSinPermisos(): void {
    console.log('🔒 Mostrando diálogo de sin permisos');
    this.dialog.open(PermissionDeniedDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'permission-denied-dialog-panel'
    });
  }

  // ✅ REEMPLAZAR: Método cargarCategoriasDefault con diálogo
  cargarCategoriasDefault(): void {
    const categoriasDefault = [
      'Hamburguesas', 'Pizzas', 'Ensaladas', 'Pollos', 'Helados',
      'Bebidas', 'Snacks', 'Infantil', 'Combos', 'Desayunos'
    ];

    console.log('🎯 Solicitando confirmación para crear categorías por defecto');

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      disableClose: false,
      panelClass: 'confirmation-dialog-panel',
      data: {
        itemType: `${categoriasDefault.length} CATEGORÍAS POR DEFECTO`,
        action: 'create',
        context: 'admin',
        extraInfo: {
          categorias: categoriasDefault,
          mensaje: 'Se crearán las categorías básicas para organizar tu menú'
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        console.log('✅ Confirmado: Creando categorías por defecto');
        this.crearCategoriasSecuencial(categoriasDefault, 0);
      } else {
        console.log('❌ Cancelado: No se crearán categorías por defecto');
      }
    });
  }

  // ✅ MODIFICAR: Actualizar el método crearCategoriasSecuencial para usar diálogo
  private crearCategoriasSecuencial(categorias: string[], index: number): void {
    if (index >= categorias.length) {
      console.log('✅ Proceso de creación de categorías completado');

      // ✅ Mostrar diálogo de éxito en lugar de alert
      this.mostrarDialogoExito('Categorías por defecto creadas exitosamente');
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

  // ✅ REFRESH
  refrescar(): void {
    this.cargarCategorias();
  }
}