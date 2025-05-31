import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/usuarios.model';

@Component({
  selector: 'app-header-admin',
  imports: [CommonModule],
  templateUrl: './header-admin.component.html',
  styleUrl: './header-admin.component.scss'
})
export class HeaderAdminComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser: User | null = null;
  username: string = '';
  empleadoNombre: string = '';
  isLoggingOut: boolean = false;

  private userSubscription: Subscription = new Subscription();

  ngOnInit() {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateUserInfo(user);
    });
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }

  private updateUserInfo(user: User | null) {
    if (user) {
      // Mostrar nombre del empleado si existe, sino el username
      if (user.empleado) {
        this.empleadoNombre = `${user.empleado.nombres} ${user.empleado.apellidos}`;
        this.username = this.empleadoNombre;
      } else {
        // Para superuser sin empleado, mostrar first_name + last_name o username
        if (user.first_name && user.last_name) {
          this.username = `${user.first_name} ${user.last_name}`;
        } else {
          this.username = user.username;
        }
      }
    } else {
      this.username = '';
      this.empleadoNombre = '';
    }
  }

logout() {
  if (this.isLoggingOut) {
    console.log('⏳ Logout ya en proceso...');
    return; 
  }

  this.isLoggingOut = true;
  console.log('🚪 Iniciando logout...');
  
  this.authService.logout().subscribe({
    next: () => {
      console.log('✅ Logout exitoso');
      this.isLoggingOut = false;
    },
    error: (error) => {
      console.error('❌ Error en logout:', error);
      this.isLoggingOut = false;
      this.router.navigate(['/administrador/login']);
    }
  });
}

  goToHome(){
    this.router.navigate(['/administrador/home']);
  }

  goToProfile() {
    console.log('📝 Ir al perfil del usuario:', this.currentUser?.username);
  }

  showUserInfo() {
    console.log('👤 Usuario actual:', this.currentUser);
    console.log('🔑 Permisos:', this.currentUser?.permissions);
    console.log('👥 Grupos:', this.currentUser?.groups);
  }
}