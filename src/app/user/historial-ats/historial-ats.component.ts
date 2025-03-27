import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'historial-ats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-ats.component.html',
  styleUrls: ['./historial-ats.component.scss']
})
export class HistorialAtsComponent implements OnInit {
  historialAts: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.obtenerHistorial();
  }

  obtenerHistorial() {
    console.log('📡 Solicitando historial de ATS...');
  
    this.http.get<any[]>('http://localhost:3000/api/historial').subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.historialAts = data;
          console.log('✅ Historial cargado correctamente:', data);
          if (data.length === 0) {
            console.log('ℹ️ No hay registros en el historial');
            // Opcional: mostrar un mensaje al usuario con SweetAlert2
            Swal.fire('Información', 'No hay registros en el historial', 'info');
          }
        } else {
          console.error('⚠️ Respuesta inesperada del backend:', data);
        }
      },
      error: (error) => {
        console.error('❌ Error al obtener historial:', error);
        // Opcional: mostrar alerta al usuario
        // Swal.fire('Error', 'No se pudo cargar el historial', 'error');
      }
    });
  }
}
