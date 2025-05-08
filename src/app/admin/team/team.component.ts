import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss'
})
export class TeamComponent implements OnInit {
  isModalOpen: boolean = false;
  editando: boolean = false;
  productos: string[] = [];
  equipos: any[] = [];
  equipoIdEdicion: number | null = null;

  nuevoEquipo = {
    idtanque: '',
    material: '',
    tipoTanque: '',
    capacidad: null,
    anioFabricacion: null,
    producto: '',
    fabricante: null
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.obtenerEquipos();
  }

  toggleModal() {
    this.isModalOpen = !this.isModalOpen;
    if (!this.isModalOpen) {
      this.resetFormulario();
    }
  }

  obtenerEquipos() {
    this.http.get<any[]>('http://localhost:3000/equipos').subscribe(
      (response) => {
        this.equipos = response; // Asigna la respuesta, sea un array vacío o con datos
        if (response.length === 0) {
          console.log('No hay equipos registrados'); // Opcional: mensaje en consola
          // Opcional: mostrar un mensaje al usuario con SweetAlert2
          Swal.fire('Información', 'No hay equipos registrados', 'info');
        }
      },
      (error) => {
        // Este bloque solo se ejecutará en caso de errores reales (ej. servidor caído)
        console.error('Error al obtener equipos:', error);
        // Opcional: mostrar alerta al usuario
        // Swal.fire('Error', 'No se pudo obtener la lista de equipos', 'error');
      }
    );
  }

  guardarEquipo() {
    if (this.editando && this.equipoIdEdicion !== null) {
      this.http.put(`http://localhost:3000/equipos/${this.equipoIdEdicion}`, this.nuevoEquipo)
        .subscribe(() => {
          this.obtenerEquipos();
          this.toggleModal();
        });
    } else {
      this.http.post('http://localhost:3000/equipos', this.nuevoEquipo)
        .subscribe(() => {
          this.obtenerEquipos();
          this.toggleModal();
        });
    }
  }

  editarEquipo(equipo: any) {
    this.equipoIdEdicion = equipo.id;
    this.nuevoEquipo = { ...equipo };
    this.editando = true;
    this.toggleModal();
  }

  eliminarEquipo(id: number) {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás deshacer esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:3000/equipos/${id}`).subscribe(
          () => {
            Swal.fire({
              title: "¡Eliminado!",
              text: "El equipo ha sido eliminado exitosamente.",
              icon: "success",
              timer: 2000,
              showConfirmButton: false
            });
            this.obtenerEquipos(); // Recargar lista de equipos después de eliminar
          },
          (error) => {
            Swal.fire({
              title: "Error",
              text: "No se pudo eliminar el equipo.",
              icon: "error"
            });
          }
        );
      }
    });
  }
  resetFormulario() {
    this.nuevoEquipo = {idtanque: '', material: '', tipoTanque: '', capacidad: null, anioFabricacion: null, producto: '', fabricante: null };
    this.editando = false;
    this.equipoIdEdicion = null;
    this.isModalOpen = false; // Cierra el modal al resetear el formulario
  }
}
