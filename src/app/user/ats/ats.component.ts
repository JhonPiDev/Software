import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ats',
  standalone: true, // Indica que es un componente independiente
  imports: [ReactiveFormsModule,CommonModule], // Importa el módulo de formularios reactivos
  templateUrl: './ats.component.html',
  styleUrls: ['./ats.component.scss'] 
})
export class ATSComponent {
  ATSForm: FormGroup;
  showModal: boolean = false; // Variable para controlar el modal

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.ATSForm = this.fb.group({
      lugar: ['', Validators.required],
      fecha: ['', Validators.required],
      procedimiento: ['', Validators.required],
      nivelRuido: [false],
      materialFilo: [false],
      quimicos: [false],
      iluminacion: [false],
      ventilacion: [false],
      caidas: [false],
      gafasSeguridad: [false],
      arnes: [false],
      guantes: [false],
      casco: [false]
    });
  }

  enviarFormulario() {
    if (this.ATSForm.valid) {
      const datos = this.ATSForm.value;

      this.http.post<{ message: string }>('http://localhost:3000/api/ats', datos).subscribe({
        next: (response) => {
          console.log('Datos guardados:', response);
          this.showModal = true; // Mostrar el modal de éxito
        },
        error: (error) => {
          console.error('Error al guardar:', error);
          alert('Error al guardar el ATS');
        }
      });
    } else {
      alert('Formulario no válido');
    }
  }

  cerrarModal() {
    this.showModal = false;
  }
}
