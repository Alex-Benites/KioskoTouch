import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { PermissionDeniedDialogComponent } from '../../../shared/permission-denied-dialog/permission-denied-dialog.component'; // ← NUEVO

import { Promocion } from '../../../models/marketing.model';
import { PublicidadService } from '../../../services/publicidad.service';
import { AuthService } from '../../../services/auth.service'; // ← NUEVO
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment'; 

@Component({
  selector: 'app-editar-eliminar-promocion',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderAdminComponent, FooterAdminComponent],
  templateUrl: './editar-eliminar-promocion.component.html',
  styleUrl: './editar-eliminar-promocion.component.scss'
})
export class EditarEliminarPromocionComponent implements OnInit {
  promociones: Promocion[] = [];
  promocionesFiltradas: Promocion[] = [];
  meses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  mesesSeleccionados: boolean[] = Array(12).fill(false);
  tipoFiltroGrupo: 'producto' | 'menu' | 'nombre' | '' = '';
  busquedaGrupo: string = '';
  loading = false;
  eliminando = false;

  constructor(
    private dialog: MatDialog,
    private publicidadService: PublicidadService,
    private authService: AuthService, // ← NUEVO
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPromociones();
  }

  cargarPromociones(): void {
    this.loading = true;
    this.publicidadService.obtenerPromociones().subscribe({
      next: (promos) => {
        this.promociones = promos;
        this.promociones.forEach(promo => {
          this.publicidadService.getPromocionImagen(promo.id).subscribe(response => {
            promo.imagenUrl = response.imagen_url;
          });
          promo.productosLista = this.getProductosLista(promo);
          promo.menusLista = this.getMenusLista(promo);
        });
        this.promocionesFiltradas = [...this.promociones];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('❌ Error al cargar las promociones. Por favor, intenta de nuevo.');
      }
    });
  }

  aplicarFiltros(): void {
    let filtradas = [...this.promociones];

    // Filtrar por mes
    const mesesActivos = this.mesesSeleccionados
      .map((sel, idx) => sel ? idx : -1)
      .filter(idx => idx !== -1);

    if (mesesActivos.length > 0) {
      filtradas = filtradas.filter(promo => {
        if (!promo.fecha_inicio_promo) return false;
        const mesPromo = new Date(promo.fecha_inicio_promo).getMonth();
        return mesesActivos.includes(mesPromo);
      });
    }

    // Filtrar por producto, menú o nombre específico
    if (this.tipoFiltroGrupo && this.busquedaGrupo.trim()) {
      const busqueda = this.busquedaGrupo.trim().toLowerCase();
      if (this.tipoFiltroGrupo === 'producto') {
        filtradas = filtradas.filter(promo =>
          (promo.productosLista || []).some((prod: string) =>
            prod.toLowerCase().includes(busqueda)
          )
        );
      } else if (this.tipoFiltroGrupo === 'menu') {
        filtradas = filtradas.filter(promo =>
          (promo.menusLista || []).some((men: string) =>
            men.toLowerCase().includes(busqueda)
          )
        );
      } else if (this.tipoFiltroGrupo === 'nombre') {
        filtradas = filtradas.filter(promo =>
          promo.nombre.toLowerCase().includes(busqueda)
        );
      }
    }

    this.promocionesFiltradas = filtradas;
  }

  limpiarFiltros(): void {
    this.mesesSeleccionados = Array(12).fill(false);
    this.tipoFiltroGrupo = '';
    this.busquedaGrupo = '';
    this.promocionesFiltradas = [...this.promociones];
  }

  getProductosLista(promo: any): string[] {
    if (!promo.productos_detalle || !Array.isArray(promo.productos_detalle)) return [];
    return promo.productos_detalle.map((p: any) => {
      const cantidad = p.cantidad || 1;
      const nombre = p.nombre || p.producto_nombre || p.producto?.nombre || '';
      return cantidad > 1 ? `- ${nombre} (${cantidad})` : `- ${nombre}`;
    });
  }

  getMenusLista(promo: any): string[] {
    if (!promo.menus_detalle || !Array.isArray(promo.menus_detalle)) return [];
    return promo.menus_detalle.map((m: any) => {
      const nombre = m.nombre || m.menu_nombre || m.menu?.nombre || '';
      return `- ${nombre}`;
    });
  }

  getFullImageUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) return '';
    return imagenUrl.startsWith('http') ? imagenUrl : `${environment.baseUrl}${imagenUrl}`;
  }

  // ✅ MÉTODO MEJORADO - Valida permisos antes de editar
  editarPromocion(promo: Promocion): void {
    console.log('🔧 Intentando editar promoción:', promo.nombre);
    
    // 🔒 Validar permisos
    if (!this.authService.hasPermission('marketing.change_appkioskopromociones')) {
      console.log('❌ Sin permisos para editar promociones');
      this.mostrarDialogoSinPermisos();
      return;
    }

    // ✅ Tiene permisos, proceder con la edición
    console.log('✅ Permisos validados, redirigiendo a edición');
    this.router.navigate(['/administrador/gestion-promociones/crear', promo.id]);
  }

  // ✅ MÉTODO MEJORADO - Valida permisos antes de eliminar
  abrirDialogoEliminar(promocion: Promocion): void {
    console.log('🗑️ Intentando eliminar promoción:', promocion.nombre);
    
    // 🔒 Validar permisos
    if (!this.authService.hasPermission('marketing.delete_appkioskopromociones')) {
      console.log('❌ Sin permisos para eliminar promociones');
      this.mostrarDialogoSinPermisos();
      return;
    }

    // ✅ Tiene permisos, mostrar confirmación
    console.log('✅ Permisos validados, mostrando confirmación');
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { itemType: 'promoción' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🗑️ Confirmado eliminar promoción:', promocion.nombre);
        this.eliminarPromocion(promocion);
      } else {
        console.log('🚫 Eliminación cancelada');
      }
    });
  }

  eliminarPromocion(promo: Promocion): void {
    this.eliminando = true;
    this.publicidadService.eliminarPromocion(promo.id).subscribe({
      next: () => {
        this.promociones = this.promociones.filter(p => p.id !== promo.id);
        this.aplicarFiltros(); // Reaplica filtros después de eliminar
        this.eliminando = false;
        alert(`✅ Promoción "${promo.nombre}" eliminada exitosamente`);
      },
      error: (error) => {
        this.eliminando = false;
        let mensajeError = '❌ Error al eliminar la promoción.';
        if (error.status === 404) {
          mensajeError = '❌ La promoción no existe o ya fue eliminada.';
        } else if (error.status === 403) {
          mensajeError = '❌ No tienes permisos para eliminar esta promoción.';
        } else if (error.error?.message) {
          mensajeError = `❌ ${error.error.message}`;
        }
        alert(mensajeError);
        this.cargarPromociones();
      }
    });
  }

  // 🆕 MÉTODO PARA MOSTRAR DIÁLOGO DE PERMISOS
  private mostrarDialogoSinPermisos(): void {
    console.log('🔒 Mostrando diálogo de sin permisos');
    this.dialog.open(PermissionDeniedDialogComponent, {
      width: '420px',
      disableClose: false,
      panelClass: 'permission-denied-dialog-panel'
    });
  }
}