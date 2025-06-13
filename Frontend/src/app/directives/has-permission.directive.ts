import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input() hasPermission: string[] = [];
  @Input() hasPermissionMode: 'any' | 'all' = 'any'; // any = OR, all = AND

  private authSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  ngOnInit(): void {
    // Escuchar cambios en la autenticación
    this.authSubscription = this.authService.currentUser$.subscribe(() => {
      this.updateView();
    });
    
    // Verificación inicial
    this.updateView();
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  private updateView(): void {
    const hasPermission = this.checkPermissions();
    
    if (hasPermission) {
      // Mostrar el elemento
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      // Ocultar el elemento
      this.viewContainer.clear();
    }
  }

  private checkPermissions(): boolean {
    if (!this.hasPermission || this.hasPermission.length === 0) {
      return true; // Si no se especifican permisos, mostrar
    }

    if (this.hasPermissionMode === 'all') {
      // Todos los permisos requeridos (AND)
      return this.authService.hasAllPermissions(this.hasPermission);
    } else {
      // Cualquier permiso requerido (OR)
      return this.authService.hasAnyPermission(this.hasPermission);
    }
  }
}