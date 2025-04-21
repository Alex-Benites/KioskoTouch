import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; //
import { HomeComponent } from './home/home.component';
import { TipoPedidoComponent } from './tipo-pedido/tipo-pedido.component';
import { MenuComponent } from './menu/menu.component';



@NgModule({
  declarations: [
    TipoPedidoComponent,  
    HomeComponent,
    MenuComponent, 
  ],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class ClienteModule { }
