import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { HeaderAdminComponent } from '../../../shared/header-admin/header-admin.component';
import { FooterAdminComponent } from '../../../shared/footer-admin/footer-admin.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-editar-eliminar-usuario',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    HeaderAdminComponent,
    FooterAdminComponent
  ],
  templateUrl: './editar-eliminar-usuario.component.html',
  styleUrls: ['./editar-eliminar-usuario.component.scss']
})
export class EditarEliminarUsuarioComponent {
  displayedColumns: string[] = ['nombres', 'apellidos', 'usuario', 'correo', 'rol', 'acciones'];
  usuarios = [
    { nombres: 'José Ricardo', apellidos: 'González Ramírez', usuario: 's2rhv', correo: 'example@gmail.com', rol: 'Chef' },
    { nombres: 'Anna Gabriela', apellidos: 'Pérez Martínez', usuario: 'Us9rm', correo: 'example@gmail.com', rol: 'Admin. Usuarios' },
    { nombres: 'Mario Luis', apellidos: 'Vargas Torres', usuario: 'V04mk', correo: 'example@gmail.com', rol: 'Admin. Publicidad' },
    { nombres: 'María Fernanda', apellidos: 'Castillo Rivera', usuario: 'kSXTY', correo: 'example@gmail.com', rol: 'Chef' },
    { nombres: 'Miguel Ángel', apellidos: 'Rojas Guzmán', usuario: 'R3x7P', correo: 'example@gmail.com', rol: 'Ctrl. Promociones' }
  ];

  constructor(private dialog: MatDialog) {}

  editarUsuario(usuario: any): void {
    console.log('Editar usuario:', usuario);
    // Aquí puedes redirigir a un formulario de edición o abrir un modal
  }

  abrirDialogoEliminar(usuario: any): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { itemType: 'usuario' } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Usuario eliminado:', usuario);
        // Aquí puedes implementar la lógica para eliminar el usuario
        this.usuarios = this.usuarios.filter(u => u !== usuario);
      } else {
        console.log('Eliminación cancelada');
      }
    });
  }
}