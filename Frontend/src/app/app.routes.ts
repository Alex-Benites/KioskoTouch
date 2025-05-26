import { Routes } from '@angular/router';
import { UnauthorizedComponent } from './shared/unauthorized/unauthorized.component';

export const routes: Routes = [

    { path: 'cliente', loadChildren: () => import('./cliente/cliente.routes').then(m => m.clienteRoutes), },
    { path: 'chef', loadChildren: () => import('./chef/chef.routes').then(m => m.chefRoutes), },
    { path: 'administrador', loadChildren: () => import('./administrador/administrador.routes').then(m => m.administradorRoutes), },
    { path: 'unauthorized', component: UnauthorizedComponent },
    { path: '', redirectTo: '/cliente/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/cliente/home' } 

];
