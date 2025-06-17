import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { HeaderAdminComponent } from '../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../shared/footer-admin/footer-admin.component';
import { CatalogoService } from '../../services/catalogo.service';
import { Ingrediente } from '../../models/catalogo.model';

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
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  ingredientesHamburguesas: Ingrediente[] = [];
  ingredientesPizzas: Ingrediente[] = [];
  ingredientesEnsaladas: Ingrediente[] = [];
  ingredientesPollos: Ingrediente[] = [];      // ✅ CAMBIO: Pollo → Pollos
  ingredientesHelados: Ingrediente[] = [];     // ✅ CAMBIO: Postres → Helados
  ingredientesSnacks: Ingrediente[] = [];      // ✅ NUEVO: Snacks
  ingredientesBebidas: Ingrediente[] = [];
  
  cargandoHamburguesas = false;
  cargandoPizzas = false;
  cargandoEnsaladas = false;
  cargandoPollos = false;      // ✅ CAMBIO: cargandoPollo → cargandoPollos
  cargandoHelados = false;     // ✅ CAMBIO: cargandoPostres → cargandoHelados
  cargandoSnacks = false;      // ✅ NUEVO: cargandoSnacks
  cargandoBebidas = false;

  ngOnInit() {
    this.cargarTodosLosIngredientes();
  }

  cargarTodosLosIngredientes() {
    this.cargarIngredientesPorCategoria('hamburguesas');
    this.cargarIngredientesPorCategoria('pizzas');
    this.cargarIngredientesPorCategoria('ensaladas');
    this.cargarIngredientesPorCategoria('pollos');     // ✅ CAMBIO: pollo → pollos
    this.cargarIngredientesPorCategoria('helados');    // ✅ CAMBIO: postres → helados
    this.cargarIngredientesPorCategoria('snacks');     // ✅ NUEVO: snacks
    this.cargarIngredientesPorCategoria('bebidas');
  }

  cargarIngredientesPorCategoria(categoria: string) {
    this.setCargando(categoria, true);
    
    this.catalogoService.getIngredientesPorCategoriaFiltro(categoria)
      .subscribe({
        next: (ingredientes) => {
          this.setIngredientes(categoria, ingredientes);
          this.setCargando(categoria, false);
          console.log(`✅ Ingredientes ${categoria} cargados:`, ingredientes.length);
        },
        error: (error) => {
          console.error(`❌ Error al cargar ingredientes de ${categoria}:`, error);
          this.setCargando(categoria, false);
          this.snackBar.open(`Error al cargar ingredientes de ${categoria}`, 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  private setCargando(categoria: string, cargando: boolean) {
    switch (categoria) {
      case 'hamburguesas': this.cargandoHamburguesas = cargando; break;
      case 'pizzas': this.cargandoPizzas = cargando; break;
      case 'ensaladas': this.cargandoEnsaladas = cargando; break;
      case 'pollos': this.cargandoPollos = cargando; break;        // ✅ CAMBIO
      case 'helados': this.cargandoHelados = cargando; break;      // ✅ CAMBIO
      case 'snacks': this.cargandoSnacks = cargando; break;        // ✅ NUEVO
      case 'bebidas': this.cargandoBebidas = cargando; break;
    }
  }

  private setIngredientes(categoria: string, ingredientes: Ingrediente[]) {
    switch (categoria) {
      case 'hamburguesas': this.ingredientesHamburguesas = ingredientes; break;
      case 'pizzas': this.ingredientesPizzas = ingredientes; break;
      case 'ensaladas': this.ingredientesEnsaladas = ingredientes; break;
      case 'pollos': this.ingredientesPollos = ingredientes; break;        // ✅ CAMBIO
      case 'helados': this.ingredientesHelados = ingredientes; break;      // ✅ CAMBIO
      case 'snacks': this.ingredientesSnacks = ingredientes; break;        // ✅ NUEVO
      case 'bebidas': this.ingredientesBebidas = ingredientes; break;
    }
  }

  crearIngrediente() {
    this.router.navigate(['/administrador/gestion-ingredientes/crear']);
  }

  editarIngrediente(id: number) {
    this.router.navigate(['/administrador/gestion-ingredientes/crear', id]);
  }

  eliminarIngrediente(ingrediente: Ingrediente) {
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
            this.cargarIngredientesPorCategoria(ingrediente.categoria_producto);
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

  getFullImageUrl(imagenUrl: string | undefined): string {
    return this.catalogoService.getFullImageUrl(imagenUrl);
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

  // Getters para facilitar el template
  get totalIngredientes(): number {
    return this.ingredientesHamburguesas.length + 
           this.ingredientesPizzas.length + 
           this.ingredientesEnsaladas.length + 
           this.ingredientesPollos.length +      // ✅ CAMBIO
           this.ingredientesHelados.length +     // ✅ CAMBIO
           this.ingredientesSnacks.length +      // ✅ NUEVO
           this.ingredientesBebidas.length;
  }
}
