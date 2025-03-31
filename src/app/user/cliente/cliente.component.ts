import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './cliente.component.html',
  styleUrls: ['./cliente.component.scss']
})
export class ClienteComponent implements OnInit {
  role: string | null = '';
  clientes: any[] = [];
  clienteSeleccionado: boolean = false;

  constructor(private http: HttpClient, private router: Router, private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.role = localStorage.getItem('role');
    this.cargarClientes();
  }

  cargarClientes() {
    this.http.get<any[]>('http://localhost:3000/cliente').subscribe({
      next: (data) => {
        this.clientes = data || [];
        if (this.clientes.length === 0) {
          console.log('No hay clientes registrados');
          Swal.fire('Información', 'No hay clientes registrados', 'info');
        }
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        Swal.fire('Error', 'No se pudo cargar la lista de clientes', 'error');
      }
    });
  }

  hacerPrueba(cliente: any) {
    localStorage.setItem('nitSeleccionado', cliente.nit);
    localStorage.setItem('razonSocialSeleccionado', cliente.razon_social);
    console.log('NIT guardado:', cliente.nit);
    console.log('Razón Social guardada:', cliente.razon_social);

    this.clienteSeleccionado = true;

    // Forzar que solo se muestre el botón ATS al seleccionar un cliente
    localStorage.setItem('mostrarTodosBotones', 'false');

    Swal.fire('Cliente Seleccionado', `Cliente: ${cliente.razon_social}`, 'success');
  }

  verificarClienteSeleccionado() {
    const nit = localStorage.getItem('nitSeleccionado');
    this.clienteSeleccionado = !!nit;
    console.log('¿Cliente seleccionado?', this.clienteSeleccionado);
  }
}