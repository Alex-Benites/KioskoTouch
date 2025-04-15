import { Routes } from '@angular/router';

export const routes: Routes = [

    { path: 'cliente', loadChildren: () => import('./cliente/cliente.routes').then(m => m.clienteRoutes), },
    { path: 'chef', loadChildren: () => import('./chef/chef.routes').then(m => m.chefRoutes), },
    { path: 'administrador', loadChildren: () => import('./administrador/administrador.routes').then(m => m.administradorRoutes), },

];
