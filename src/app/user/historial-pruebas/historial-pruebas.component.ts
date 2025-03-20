import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-historial-pruebas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-pruebas.component.html',
  styleUrl: './historial-pruebas.component.scss'
})
export class HistorialPruebasComponent implements OnInit {
  registros: any[] = [];
  registrosFiltrados: any[] = [];
  filtro: string = '';
  registroEditando: any = null;
  mostrarFormularioEdicion: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarRegistros();
  }
  getImageUrl(base64String: string): string {
    return `data:image/png;base64,${base64String}`;
  }
  
  // Cargar registros desde el backend
  cargarRegistros() {
    this.http.get('http://localhost:3000/registros').subscribe(
      (data: any) => {
        this.registros = data;
        this.registrosFiltrados = data;
      },
      (error) => console.error('Error al cargar registros', error)
    );
  }

  // Filtrar registros por material o producto
  filtrarRegistros() {
    const filtroLower = this.filtro.toLowerCase();
    this.registrosFiltrados = this.registros.filter(registro =>
      registro.material.toLowerCase().includes(filtroLower) ||
      registro.producto.toLowerCase().includes(filtroLower)
    );
  }

  // Editar registro
  editarRegistro(registro: any) {
    this.registroEditando = { ...registro };
    this.mostrarFormularioEdicion = true;
  }

  // Guardar cambios en el registro
  guardarEdicion() {
    if (!this.registroEditando.material || !this.registroEditando.producto || !this.registroEditando.fecha_prueba || !this.registroEditando.estado_prueba) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Todos los campos son obligatorios' });
      return;
    }

    this.http.put(`http://localhost:3000/registros/${this.registroEditando.id}`, this.registroEditando).subscribe(
      () => {
        Swal.fire({ icon: 'success', title: 'Actualizado', text: 'El registro se ha actualizado correctamente', timer: 2000, showConfirmButton: false });
        this.mostrarFormularioEdicion = false;
        this.cargarRegistros();
      },
      (error) => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el registro' })
    );
  }

  // Cancelar edición
  cancelarEdicion() {
    this.mostrarFormularioEdicion = false;
    this.registroEditando = null;
  }

  // Eliminar registro
  eliminarRegistro(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:3000/registros/${id}`).subscribe(
          () => {
            this.registros = this.registros.filter(r => r.id !== id);
            this.registrosFiltrados = this.registrosFiltrados.filter(r => r.id !== id);
            Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El registro se ha eliminado correctamente' });
          },
          (error) => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el registro' })
        );
      }
    });
  }

  // Exportar todos los registros a PDF
  exportarPDF() {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Empresa de Servicios para Islas de Gasolinerías', 15, 15);
    doc.setFontSize(12);
    doc.text('Informe de Pruebas Hidrostáticas', 15, 25);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 15, 35);

    const columnas = ['ID', 'Material', 'Producto', 'Fecha de Prueba', 'Estado'];
    const filas = this.registrosFiltrados.map(r => [r.id, r.material, r.producto, r.fecha_prueba, r.estado_prueba]);

    autoTable(doc, {
      startY: 45,
      head: [columnas],
      body: filas,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 100, 200] }
    });

    doc.save('Informe_Pruebas_Hidrostáticas.pdf');
  }

  // Exportar un solo registro con imagen a PDF
  exportarRegistroPDF(registro: any) {
    const doc = new jsPDF();
  
    // Título del documento
    doc.setFontSize(18);
    doc.text('Registro de Prueba Hidrostática', 20, 20);
  
    // Información del registro
    doc.setFontSize(12);
    doc.text(`ID: ${registro.id}`, 20, 40);
    doc.text(`Material: ${registro.material}`, 20, 50);
    doc.text(`Producto: ${registro.producto}`, 20, 60);
    doc.text(`Fecha de Prueba: ${registro.fecha_prueba}`, 20, 70);
    doc.text(`Estado: ${registro.estado_prueba}`, 20, 80);
  
    // Observaciones (manejo de texto largo)
    doc.text('Observaciones:', 20, 90);
    const observaciones = doc.splitTextToSize(registro.observaciones || 'Ninguna', 160);
    doc.text(observaciones, 20, 100);
  
    // Insertar imagen si existe
    if (registro.imagen_base64) {
      const imgData = `data:image/png;base64,${registro.imagen_base64}`;
      doc.addImage(imgData, 'PNG', 20, 120, 100, 80); // Posición X, Y, Ancho, Alto
    } else {
      doc.text('Sin imagen adjunta', 20, 130);
    }
  
    // Guardar PDF con nombre personalizado
    doc.save(`Registro_${registro.id}.pdf`);
  }
}
