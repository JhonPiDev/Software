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
  isSideNavVisible: boolean = true; // Estado de visibilidad de la barra lateral

  // Método para alternar la visibilidad de la barra lateral
  toggleSideNav() {
    this.isSideNavVisible = !this.isSideNavVisible;
  }

  // Método para cerrar sesión (puedes implementar la lógica necesaria)
  logout() {
    console.log('Sesión cerrada');
    // Aquí puedes agregar la lógica para cerrar sesión
  }

  // Métodos para notificaciones y perfil (puedes implementar la lógica necesaria)
  showNotifications() {
    console.log('Mostrar notificaciones');
  }

  showProfile() {
    console.log('Mostrar perfil');
  }
}

