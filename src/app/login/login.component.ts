import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Importa el Router

@Component({
  selector: 'app-login',
  standalone: true, // Marca el componente como standalone
  imports: [ReactiveFormsModule, CommonModule], // Importa los módulos necesarios
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = ''; // Variable para mostrar mensajes de error

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]], // Cambia 'email' a 'username'
      password: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  onSubmit() {
    console.log('Botón de login clickeado');
  
    if (this.loginForm.invalid) {
      console.log('Formulario inválido');
      return;
    }
  
    const { username, password } = this.loginForm.value;
    console.log('Datos enviados:', { username, password });
  
    this.http.post('http://localhost:3000/login', { username, password }).subscribe(
      (response: any) => {
        console.log('Respuesta del backend:', response);
        
        if (response.role === 'admin') {
          this.router.navigate(['/admin']); // Redirigir a admin
        } else if (response.role === 'inspector') {
          this.router.navigate(['/inspector']); // Redirigir a inspector
        } else {
          this.router.navigate(['/user']); // Redirigir a usuario normal
        }
      },
      (error) => {
        console.error('Error en la solicitud:', error);
        this.errorMessage = 'Credenciales incorrectas. Inténtalo de nuevo.';
      }
    );
  }
  
  
}
