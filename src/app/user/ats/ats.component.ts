import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule,FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-ats',
  standalone: true, // Indica que es un componente independiente
  imports: [ReactiveFormsModule], // Importa el módulo de formularios reactivos
  templateUrl: './ats.component.html',
  styleUrls: ['./ats.component.scss'] 
})
export class ATSComponent {
  // Definimos el formulario reactivo
  ATSForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    // Inicializamos el formulario en el constructor
    this.ATSForm = this.fb.group({
      lugar: ['', Validators.required], // Campo de texto para "Lugar"
      fecha: ['', Validators.required], // Campo de texto para "Fecha"
      procedimiento: ['', Validators.required], // Campo de texto para "Procedimiento"
      nivelRuido: [false], // Checkbox para "Nivel de Ruido"
      materialFilo: [false], // Checkbox para "Material con filo"
      quimicos: [false], // Checkbox para "Químicos"
      iluminacion: [false], // Checkbox para "Iluminación"
      ventilacion: [false], // Checkbox para "Ventilación"
      caidas: [false], // Checkbox para "Caídas"
      gafasSeguridad: [false], // Checkbox para "Gafas de Seguridad"
      arnes: [false], // Checkbox para "Arnés"
      guantes: [false], // Checkbox para "Guantes"
      casco: [false] // Checkbox para "Casco"
    });
  }

  // Método para enviar el formulario
  enviarFormulario() {
    if (this.ATSForm.valid) {
      const datos = this.ATSForm.value;

      // Enviar los datos al servidor
      this.http.post<{ message: string }>('http://localhost:3000/api/ats', datos).subscribe({
        next: (response: { message: string }) => {
          console.log('Datos guardados:', response);
          alert('Ha sido guardado exitosamente'); // Mensaje de éxito
        },
        error: (error: any) => {
          console.error('Error al guardar:', error);
          alert('Error al guardar el ATS'); // Mensaje de error
        }
      });
    } else {
      alert('Formulario no válido'); // Mensaje de validación
    }
  }
}

