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

  minDate: string = '';  // Fecha mínima permitida (ayer)
  maxDate: string = '';

  tanques: any[] = []; // Lista de tanques disponibles
  selectedTankId: string = ''; // ID del tanque seleccionado
  registroExitoso: boolean = false;
  selectedFiles: File[] = [];
  imagenesVistaPrevia: string[] = [];

  selectedNit: string | null = null; // Variable para almacenar el NIT

  constructor(private http: HttpClient) {
    this.selectedNit = localStorage.getItem('nitSeleccionado'); // Recuperar el NIT guardado
    this.cargarTanques();
    this.setDateLimits();
  }
  setDateLimits() {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Formatear fechas como YYYY-MM-DD para el input type="date"
    this.minDate = yesterday.toISOString().split('T')[0];
    this.maxDate = today.toISOString().split('T')[0];
  }


  // 🔹 Cargar tanques desde el backend
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

  // 🔹 Llenar los campos cuando se selecciona un tanque
  onSelectTank() {
    const tanqueSeleccionado = this.tanques.find(tanque => tanque.id == this.selectedTankId);
    if (tanqueSeleccionado) {
      this.formData = {
        ...this.formData,
        material: tanqueSeleccionado.material || '',
        tipoTanque: tanqueSeleccionado.tipoTanque || '',
        capacidad: tanqueSeleccionado.capacidad || null,
        producto: tanqueSeleccionado.producto || '',
        anioFabricacion: tanqueSeleccionado.anioFabricacion || null,
      };
    } else {
      console.warn('⚠ No se encontró el tanque seleccionado.');
    }
  }

  // 🔹 Manejar selección de imágenes
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
  userId: string | null = null;


  // 🔹 Guardar datos en el backend
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
  


  // 🔹 Reiniciar formulario
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
    this.selectedTankId = '';
  }
}
