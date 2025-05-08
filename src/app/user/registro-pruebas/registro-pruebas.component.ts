import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2'; // Asegúrate de importar SweetAlert2

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
    fabricante: '',
    anioFabricacion: null,
    presion: null,
    temperatura: null,
    fechaPrueba: '',
    horaPrueba: '',
    observaciones: ''
  };

  minDate: string = '';
  maxDate: string = '';
  tanques: any[] = [];
  selectedTankId: string = '';
  registroExitoso: boolean = false;
  selectedFiles: File[] = [];
  imagenesVistaPrevia: string[] = [];

  selectedNit: string | null = null;

  constructor(private http: HttpClient) {
    this.selectedNit = localStorage.getItem('nitSeleccionado');
    this.cargarTanques();
    this.setDateLimits();
  }

  setDateLimits() {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    this.minDate = yesterday.toISOString().split('T')[0];
    this.maxDate = today.toISOString().split('T')[0];
  }

  cargarTanques() {
    this.http.get<any[]>('http://localhost:3000/equipos').subscribe({
      next: (response) => {
        this.tanques = response;
      },
      error: (error) => {
        console.error('❌ Error al cargar tanques:', error);
      }
    });
  }

  onSelectTank() {
    const tanqueSeleccionado = this.tanques.find(tanque => tanque.id == this.selectedTankId);
    if (tanqueSeleccionado) {
      this.formData = {
        ...this.formData,
        material: tanqueSeleccionado.material || '',
        tipoTanque: tanqueSeleccionado.tipoTanque || '',
        capacidad: tanqueSeleccionado.capacidad || null,
        producto: tanqueSeleccionado.producto || '',
        fabricante: tanqueSeleccionado.fabricante || '',
        anioFabricacion: tanqueSeleccionado.anioFabricacion || null,
      };
    } else {
      console.warn('⚠ No se encontró el tanque seleccionado.');
    }
  }

  // ✅ Agrega múltiples imágenes con límite de 10 y genera vista previa
  onFilesSelected(event: any) {
    const archivos = Array.from(event.target.files) as File[];
    const totalFiles = this.selectedFiles.length + archivos.length;

    if (totalFiles > 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Límite alcanzado',
        text: 'Solo se permiten un máximo de 10 imágenes. Selecciona un número menor.',
        confirmButtonText: 'Aceptar'
      });
      event.target.value = ''; // Limpiar el input para evitar procesar archivos excedentes
      return;
    }

    archivos.forEach((file) => {
      this.selectedFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenesVistaPrevia.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // ✅ Elimina una imagen por índice
  eliminarImagen(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagenesVistaPrevia.splice(index, 1);
  }

  guardarDatos() {
    const userId = localStorage.getItem('userId'); 
    const selectedNit = localStorage.getItem('nitSeleccionado');
  
    if (!userId || !selectedNit) {
      alert('⚠ Error: No se encontró el usuario o el NIT. Inicia sesión nuevamente.');
      return;
    }

    const formData = new FormData();

    Object.keys(this.formData).forEach((key) => {
      formData.append(key, (this.formData as any)[key]);
    });

    formData.append('userId', userId);
    formData.append('selectedTankId', this.selectedTankId);
    formData.append('selectedNit', selectedNit);

    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach((file) => {
        formData.append('imagenes', file);
      });
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
      fabricante: '',
      presion: null,
      temperatura: null,
      fechaPrueba: '',
      horaPrueba: '',
      observaciones: ''
    };
    this.selectedFiles = [];
    this.imagenesVistaPrevia = [];
    this.selectedTankId = '';
  }
}