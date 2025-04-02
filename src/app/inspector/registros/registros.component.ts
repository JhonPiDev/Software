import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'; // ✅ Importamos SweetAlert2

@Component({
  selector: 'app-registros',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './registros.component.html',
  styleUrls: ['./registros.component.scss']
})
export class RegistrosComponent implements OnInit {
  registros: any[] = [];
  currentPage: number = 1; // Página actual
  totalPages: number = 1; // Número total de páginas
  totalRegistros: number = 0; // Número total de registros
  limit: number = 10; // Número de registros por página

  constructor(private http: HttpClient) {
    this.cargarRegistros();
  }

  ngOnInit() {}

  cargarRegistros() {
    this.http.get<any>(`http://localhost:3000/registros_tecnicos?page=${this.currentPage}&limit=${this.limit}`).subscribe({
      next: (response) => {
        this.registros = response.registros;
        this.totalRegistros = response.totalRegistros;
        this.totalPages = response.totalPages;
        this.currentPage = response.currentPage;
        
      },
      error: (error) => {
        console.error('❌ Error al cargar registros:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al cargar los registros.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  actualizarEstado(registro: any) {
    if (!registro.estado_prueba) {
      Swal.fire({
        title: 'Advertencia',
        text: '⚠ Debes seleccionar un estado (Aprobado o Reprobado).',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.http.put(`http://localhost:3000/registros_tecnicos/${registro.id}`, {
      estado_prueba: registro.estado_prueba
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Estado actualizado:', response);
        Swal.fire({
          title: 'Éxito',
          text: 'Estado actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        this.cargarRegistros(); // Recargar los registros después de actualizar
      },
      error: (error) => {
        console.error('❌ Error al actualizar estado:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al actualizar el estado.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  // Ir a la página anterior
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cargarRegistros();
    }
  }

  // Ir a la página siguiente
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cargarRegistros();
    }
  }
}
