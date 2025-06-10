import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { PedidosComponent } from './pedidos/pedidos.component';
import { authGuard } from '../guards/auth.guard';

export const chefRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'pedidos', component: PedidosComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'pedidos', pathMatch: 'full'},
];
