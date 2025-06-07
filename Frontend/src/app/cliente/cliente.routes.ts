import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { TipoPedidoComponent } from './tipo-pedido/tipo-pedido.component';
import { MenuComponent } from './menu/menu.component';

export const clienteRoutes: Routes = [

   { path: '', redirectTo: 'home', pathMatch: 'full' },
    
  { path: 'home', component: HomeComponent },

  { path: 'tipo-pedido', component: TipoPedidoComponent },

  { path: 'menu',component: MenuComponent },
  
];
