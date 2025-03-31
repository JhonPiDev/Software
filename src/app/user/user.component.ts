import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit, OnDestroy {
  role: string | null = '';
  clienteSeleccionado: boolean = false;
  showSideNav: boolean = false;
  intervalId: any;
  mostrarTodosBotones: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.role = localStorage.getItem('role') || 'Usuario';
    this.verificarClienteSeleccionado();

    // Verificar cambios en localStorage cada 500ms
    this.intervalId = setInterval(() => {
      this.verificarClienteSeleccionado();
      this.verificarMostrarBotones();
    }, 500);

    // Escuchar evento "storage" para cambios entre pestañas
    window.addEventListener('storage', () => {
      this.verificarClienteSeleccionado();
      this.verificarMostrarBotones();
    });
  }

  verificarClienteSeleccionado() {
    const nit = localStorage.getItem('nitSeleccionado');
    this.clienteSeleccionado = !!nit; // Si hay un NIT, se muestra el menú
    if (!this.clienteSeleccionado) {
      this.mostrarTodosBotones = false; // Si no hay cliente seleccionado, ocultar todos los botones
      localStorage.setItem('mostrarTodosBotones', 'false');
    }
  }

  verificarMostrarBotones() {
    const mostrar = localStorage.getItem('mostrarTodosBotones');
    this.mostrarTodosBotones = mostrar === 'true';
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
    window.removeEventListener('storage', this.verificarClienteSeleccionado);
  }

  toggleSideNav() {
    this.showSideNav = !this.showSideNav;
  }

  logout() {
    localStorage.clear();
    this.clienteSeleccionado = false;
    this.mostrarTodosBotones = false;
    this.router.navigate(['/login']);
  }
}