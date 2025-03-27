import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;
  mostrarFormulario: boolean = false;
  usuarios: any[] = []; // Lista de usuarios

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', Validators.required],
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios(); // Cargar la lista de usuarios al iniciar el componente
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    if (this.registerForm.invalid) {
      this.isSubmitting = false;
      return;
    }

    const userData = this.registerForm.value;

    this.http.post('http://localhost:3000/register', userData).subscribe(
      (response: any) => {
        this.successMessage = 'Usuario registrado exitosamente.';
        this.registerForm.reset();
        this.mostrarFormulario = false; // Cierra el modal
        this.cargarUsuarios(); // Recargar lista de usuarios después de registrar uno nuevo
      },
      (error) => {
        this.errorMessage = error.error.message || 'Error al registrar el usuario.';
      }
    ).add(() => this.isSubmitting = false);
  }

  cargarUsuarios() {
    this.http.get('http://localhost:3000/users').subscribe(
      (data: any) => this.usuarios = data,
      (error) => console.error('Error al cargar usuarios', error)
    );
  }

  eliminarUsuario(id: string) {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar" // Opcional: personaliza el texto del botón cancelar
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:3000/users/${id}`).subscribe(
          (response: any) => {
            Swal.fire({
              title: "¡Eliminado!",
              text: "El usuario ha sido eliminado exitosamente.",
              icon: "success",
              timer: 2000, // Opcional: cierra automáticamente después de 2 segundos
              showConfirmButton: false // Opcional: elimina el botón "OK"
            });
            this.successMessage = 'Usuario eliminado exitosamente.';
            this.cargarUsuarios(); // Recargar lista de usuarios después de eliminar uno
          },
          (error) => {
            Swal.fire({
              title: "Error",
              text: "Hubo un problema al eliminar el usuario.",
              icon: "error"
            });
            this.errorMessage = 'Error al eliminar el usuario.';
          }
        );
      }
    });
  }
}