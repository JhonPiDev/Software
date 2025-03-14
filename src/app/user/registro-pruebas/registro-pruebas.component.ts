import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registro-pruebas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-pruebas.component.html',
  styleUrls: ['./registro-pruebas.component.scss']
})
export class RegistroPruebasComponent {
  formData = {
    material: '',
    tipoTanque: '',
    capacidad: null,
    producto: '',
    anioFabricacion: null,
    presion: null,
    temperatura: null,
    fechaPrueba: '',
    horaPrueba: '',
    estadoPrueba: '',
    observaciones: ''
  };

  registroExitoso: boolean = false; // Controla la visibilidad del modal

  constructor(private http: HttpClient) {}

  guardarDatos() {
    this.http.post('http://localhost:3000/registros-tecnicos', this.formData).subscribe(
      (response: any) => {
        console.log('Registro exitoso:', response);
        this.registroExitoso = true; // Muestra el modal
        this.resetForm();
        setTimeout(() => (this.registroExitoso = false), 3000); // Oculta el modal después de 3 segundos
      },
      (error) => {
        console.error('Error al registrar la prueba:', error);
      }
    );
  }

  resetForm() {
    this.formData = {
      material: '',
      tipoTanque: '',
      capacidad: null,
      producto: '',
      anioFabricacion: null,
      presion: null,
      temperatura: null,
      fechaPrueba: '',
      horaPrueba: '',
      estadoPrueba: '',
      observaciones: ''
    };
  }
}
