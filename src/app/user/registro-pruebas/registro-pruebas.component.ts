import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-registro-pruebas',
  standalone: true,
  templateUrl: './registro-pruebas.component.html',
  styleUrls: ['./registro-pruebas.component.scss'],
  imports: [CommonModule, FormsModule, HttpClientModule],
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

  tanques: any[] = []; // Lista de tanques disponibles
  selectedTankId: string = ''; // ID del tanque seleccionado
  registroExitoso: boolean = false;
  selectedFiles: File[] = [];
  imagenesVistaPrevia: string[] = [];

  constructor(private http: HttpClient) {
    this.cargarTanques();
  }

  // Cargar tanques desde el backend
  cargarTanques() {
    this.http.get<any[]>('http://localhost:3000/equipos').subscribe(
      (response) => {
        this.tanques = response;
      },
      (error) => {
        console.error('Error al cargar tanques:', error);
      }
    );
  }

  // Cuando se selecciona un tanque, llenar los campos automáticamente
  onSelectTank() {
    const tanqueSeleccionado = this.tanques.find(
      (tanque) => tanque.id == this.selectedTankId
    );
  
    if (tanqueSeleccionado) {
      this.formData = {
        ...this.formData,
        material: tanqueSeleccionado.material || '',
        tipoTanque: tanqueSeleccionado.tipoTanque || '',  // Asegurar que el alias se usa correctamente
        capacidad: tanqueSeleccionado.capacidad || null,
        producto: tanqueSeleccionado.producto || '',
        anioFabricacion: tanqueSeleccionado.anioFabricacion || null,  // Misma conversión
      };
    } else {
      console.warn('No se encontró el tanque seleccionado.');
    }
  }
  
  

  onFilesSelected(event: any) {
    this.selectedFiles = [];
    this.imagenesVistaPrevia = [];
  
    const archivos = Array.from(event.target.files) as File[];
  
    archivos.forEach((file) => {
      this.selectedFiles.push(file);
  
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenesVistaPrevia.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }
  

  guardarDatos() {
    const formData = new FormData();
  
    Object.keys(this.formData).forEach((key) => {
      formData.append(key, (this.formData as any)[key]);
    });
  
    if (this.selectedFiles.length > 0) {
      formData.append('imagen', this.selectedFiles[0]); // Enviar solo una imagen
    }
  
    this.http.post('http://localhost:3000/registros_tecnicos', formData).subscribe({
      next: (response: any) => {
        console.log('✅ Registro exitoso:', response);
        this.registroExitoso = true;
        this.resetForm();
        setTimeout(() => (this.registroExitoso = false), 3000);
      },
      error: (error) => {
        console.error('❌ Error al registrar la prueba:', error);
        alert('Hubo un error al guardar la información.');
      },
    });
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
    this.selectedFiles = [];
    this.imagenesVistaPrevia = [];
  }
}
