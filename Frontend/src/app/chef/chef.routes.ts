import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { PedidosComponent } from './pedidos/pedidos.component';

export const chefRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'pedidos', component: PedidosComponent},
  { path: '', redirectTo: 'pedidos', pathMatch: 'full'}
];
