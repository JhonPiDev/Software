import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;
  mostrarFormulario: boolean = false;
  clientes: any[] = []; // Lista de clientes

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.registerForm = this.fb.group({
      nit: ['', [Validators.required, Validators.pattern('^[0-9]+$')]], // Solo números
      razonSocial: ['', Validators.required],
      direccion: ['', Validators.required],
      correo: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]+$')]], // Solo números
      establecimiento: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.cargarClientes(); // Cargar la lista de clientes al iniciar el componente
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    if (this.registerForm.invalid) {
      this.isSubmitting = false;
      return;
    }

    const clienteData = this.registerForm.value;

    this.http.post('http://localhost:3000/agregar', clienteData, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    })
    .subscribe({
      next: (response: any) => {
        this.successMessage = 'Cliente registrado exitosamente.';
        this.registerForm.reset();
        this.mostrarFormulario = false; // Cierra el modal
        this.cargarClientes(); // Recargar lista de clientes después de registrar uno nuevo
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al registrar el cliente.';
      },
      complete: () => this.isSubmitting = false
    });
  }

  cargarClientes() {
    this.http.get<any[]>('http://localhost:3000/cliente').subscribe({
      next: (data: any) => {
        this.clientes = data; // Asigna la respuesta, sea un array vacío o con datos
        if (data.length === 0) {
          console.log('No hay clientes registrados'); // Opcional: mensaje en consola
          // Opcional: mostrar un mensaje al usuario con SweetAlert2
          Swal.fire('Información', 'No hay clientes registrados', 'info');
        }
      },
      error: (error) => {
        // Solo se ejecuta en errores reales (ej. servidor no responde)
        console.error('Error al cargar clientes:', error);
        // Opcional: mostrar alerta al usuario
        Swal.fire('Error', 'No se pudo cargar la lista de clientes', 'error');
      }
    });
  }

  eliminarCliente(nit: string) {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
  
    console.log('Eliminando cliente con ID:', nit); // 👀 Verifica qué ID se está enviando
  
    this.http.delete(`http://localhost:3000/cliente/${nit}`).subscribe({
      next: (response: any) => {
        this.successMessage = 'Cliente eliminado exitosamente.';
        this.cargarClientes(); // Recargar lista de clientes después de eliminar uno
      },
      error: (error) => {
        console.error('Error al eliminar cliente:', error);
        this.errorMessage = 'Error al eliminar el cliente.';
      }
    });
  }
}