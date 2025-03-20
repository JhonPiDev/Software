import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
    material: '',
    tipoTanque: '',
    capacidad: null,
    anioFabricacion: null,
    producto: ''
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
    this.http.get<any[]>('http://localhost:3000/equipos')
      .subscribe(response => {
        this.equipos = response;
      }, error => {
        console.error('Error al obtener equipos', error);
      });
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
    this.http.delete(`http://localhost:3000/equipos/${id}`)
      .subscribe(() => {
        this.obtenerEquipos();
      });
  }

  resetFormulario() {
    this.nuevoEquipo = { material: '', tipoTanque: '', capacidad: null, anioFabricacion: null, producto: '' };
    this.editando = false;
    this.equipoIdEdicion = null;
  }
}
