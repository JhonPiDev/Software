import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Asegúrate de importar Router

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule], // Importa RouterModule para usar <router-outlet>
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent {
  isSideNavVisible: boolean = true; // Estado de visibilidad de la barra lateral

  constructor(private router: Router) {} // Inyecta el Router en el constructor

  // Método para alternar la visibilidad de la barra lateral
  toggleSideNav() {
    this.isSideNavVisible = !this.isSideNavVisible;
  }

  // Método para cerrar sesión
  logout() {
    // Eliminar datos de sesión (por ejemplo, token o información del usuario)
    localStorage.removeItem('token'); // Si usas localStorage para almacenar el token
    localStorage.removeItem('user');  // Si almacenas información del usuario

    // Redirigir al usuario a la página de login
    this.router.navigate(['/login']);

    console.log('Sesión cerrada'); // Opcional: Para verificar que el método se ejecuta
  }

  // Métodos para notificaciones y perfil (puedes implementar la lógica necesaria)
  showNotifications() {
    console.log('Mostrar notificaciones');
  }

  showProfile() {
    console.log('Mostrar perfil');
  }
}