import { Routes } from '@angular/router';

export const clienteRoutes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'tipo-pedido',
    loadComponent: () => import('./tipo-pedido/tipo-pedido.component').then(m => m.TipoPedidoComponent)
  },
  {
    path: 'menu',
    loadComponent: () => import('./menu/menu.component').then(m => m.MenuComponent)
  },
  {
    path: 'personalizar-producto/:id',
    loadComponent: () => import('./personalizar-producto/personalizar-producto.component').then(m => m.PersonalizarProductoComponent)
  },
  {
    path: 'pop-up',
    loadComponent: () => import('./pop-up/pop-up.component').then(m => m.PopupComponent)  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }
];
