import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cliente-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cliente-dashboard.component.html',
  styleUrls: ['./cliente-dashboard.component.scss']
})
export class ClienteDashboardComponent implements OnInit {
  nitCliente: string | null = '';
  razonSocialCliente: string | null = ''; // Agregado para almacenar la razón social

  constructor(private router: Router) {}

  ngOnInit() {
    this.nitCliente = localStorage.getItem('nitSeleccionado');
    this.razonSocialCliente = localStorage.getItem('razonSocialSeleccionado'); // Obtiene la razón social del cliente
    if (!this.nitCliente) {
      this.router.navigate(['/user/cliente']); // Si no hay cliente, redirige a la lista
    }
  }
}
