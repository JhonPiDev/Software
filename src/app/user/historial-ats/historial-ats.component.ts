import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';

interface ATS {
  id: number;
  lugar: string;
  fecha: string;
  procedimiento: string;
  nivel_ruido: number;
  material_filo: number;
  quimicos: number;
  iluminacion: number;
  ventilacion: number;
  caidas: number;
  gafas_seguridad: number;
  arnes: number;
  guantes: number;
  casco: number;
}

@Component({
  selector: 'app-historial-ats',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './historial-ats.component.html',
  styleUrls: ['./historial-ats.component.scss']
})
export class HistorialAtsComponent implements OnInit {
  historialAts: ATS[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.obtenerHistorial();
  }

  obtenerHistorial() {
    console.log('📡 Solicitando historial de ATS...');

    const nit = localStorage.getItem('nitSeleccionado');
    if (!nit) {
      console.error('⚠️ No se ha seleccionado un cliente');
      Swal.fire({
        icon: 'warning',
        title: 'Cliente no seleccionado',
        text: 'Por favor, selecciona un cliente desde la sección de Clientes para ver su historial de ATS.',
        confirmButtonText: 'Ir a Clientes',
        confirmButtonColor: '#06b6d4'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/user/cliente';
        }
      });
      return;
    }

    this.http.get<ATS[]>(`http://localhost:3000/api/historial?nit=${nit}`).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.historialAts = data;
          console.log('✅ Historial cargado correctamente:', data);
          if (data.length === 0) {
            console.log('ℹ️ No hay registros en el historial');
            Swal.fire({
              icon: 'info',
              title: 'Sin registros',
              text: 'No hay registros de ATS para este cliente.',
              confirmButtonColor: '#06b6d4'
            });
          }
        } else {
          console.error('⚠️ Respuesta inesperada del backend:', data);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Respuesta inesperada del servidor. Por favor, intenta de nuevo.',
            confirmButtonColor: '#06b6d4'
          });
        }
      },
      error: (error) => {
        console.error('❌ Error al obtener historial:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el historial. Por favor, intenta de nuevo.',
          confirmButtonColor: '#06b6d4'
        });
      }
    });
  }
}