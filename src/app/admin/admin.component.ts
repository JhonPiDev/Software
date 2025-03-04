import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule], // Importa RouterModule para usar <router-outlet>
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent {
  isSideNavVisible = true;

  constructor(private router: Router) {}

  toggleSideNav() {
    this.isSideNavVisible = !this.isSideNavVisible;
  }

  showNotifications() {
    alert('Notificaciones');
  }

  showProfile() {
    alert('Perfil');
  }

  logout() {
    alert('Cerrando sesión...');
    this.router.navigate(['/login']);
  }
}

