import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Importa SweetAlert2

@Component({
  selector: 'app-historial-pruebas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-pruebas.component.html',
  styleUrl: './historial-pruebas.component.scss'
})
export class HistorialPruebasComponent implements OnInit {
  registros: any[] = []; // Lista de registros obtenidos de la base de datos
  registrosFiltrados: any[] = []; // Lista de registros filtrados
  filtro: string = ''; // Texto de filtro
  registroEditando: any = null; // Registro que se está editando
  mostrarFormularioEdicion: boolean = false; // Controla la visibilidad del formulario de edición

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarRegistros();
  }

  // Cargar registros desde el backend
  cargarRegistros() {
    this.http.get('http://localhost:3000/registros').subscribe(
      (data: any) => {
        this.registros = data;
        this.registrosFiltrados = data; // Inicialmente, muestra todos los registros
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

  // Método para abrir el formulario de edición
  editarRegistro(registro: any) {
    this.registroEditando = { ...registro }; // Copia el registro para editarlo
    this.mostrarFormularioEdicion = true; // Muestra el formulario de edición
  }

  // Método para guardar los cambios
  guardarEdicion() {
    // Validar que los campos no estén vacíos
    if (
      !this.registroEditando.material ||
      !this.registroEditando.producto ||
      !this.registroEditando.fecha_prueba ||
      !this.registroEditando.estado_prueba
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Todos los campos son obligatorios',
      });
      return; // Detener la ejecución si hay campos vacíos
    }

    // Enviar los cambios al backend
    this.http.put(`http://localhost:3000/registros/${this.registroEditando.id}`, this.registroEditando).subscribe(
      () => {
        // Mostrar modal de éxito
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'El registro se ha actualizado correctamente',
          timer: 2000, // Cierra automáticamente después de 2 segundos
          showConfirmButton: false,
        });

        this.mostrarFormularioEdicion = false; // Oculta el formulario de edición
        this.cargarRegistros(); // Recarga la lista de registros
      },
      (error) => {
        console.error('Error al actualizar registro:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el registro',
        });
      }
    );
  }

  // Método para cancelar la edición
  cancelarEdicion() {
    this.mostrarFormularioEdicion = false; // Oculta el formulario de edición
    this.registroEditando = null; // Limpia el registro en edición
  }

  // Método para eliminar un registro
  eliminarRegistro(id: number) {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      this.http.delete(`http://localhost:3000/registros/${id}`).subscribe(
        () => {
          // Elimina el registro de la lista local
          this.registros = this.registros.filter(r => r.id !== id);
          this.registrosFiltrados = this.registrosFiltrados.filter(r => r.id !== id); // Actualiza la lista filtrada
          console.log('Registro eliminado correctamente');
        },
        (error) => {
          console.error('Error al eliminar registro:', error);
        }
      );
    }
  }

  // Método para exportar a PDF
  exportarPDF() {
      const doc = new jsPDF();
      
      // ** Encabezado **
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Empresa de Servicios para Islas de Gasolinerías', 15, 15);
      doc.setFontSize(12);
      doc.text('Informe de Pruebas Hidrostáticas', 15, 25);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 15, 35);
  
      // ** Datos de la tabla **
      const columnas = ['ID', 'Material', 'Producto', 'Fecha de Prueba', 'Estado de Prueba'];
      const filas = this.registrosFiltrados.map(registro => [
        registro.id,
        registro.material,
        registro.producto,
        registro.fecha_prueba,
        registro.estado_prueba
      ]);
  
      autoTable(doc, {
        startY: 45,
        head: [columnas],
        body: filas,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 100, 200] }
      });
  
      // ** Guardar el archivo **
      doc.save('Informe_Pruebas_Hidrostáticas.pdf');
  }
  
  exportarRegistroPDF(registro: any) {
    const doc = new jsPDF();
  
    // ** Encabezado **
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Empresa de Servicios para Islas de Gasolinerías', 15, 15);
    doc.setFontSize(12);
    doc.text('Informe de Prueba Hidrostática', 15, 25);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 15, 35);
  
    // ** Datos del Registro **
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: ${registro.id}`, 15, 50);
    doc.text(`Material: ${registro.material}`, 15, 60);
    doc.text(`Producto: ${registro.producto}`, 15, 70);
    doc.text(`Fecha de Prueba: ${registro.fecha_prueba}`, 15, 80);
    doc.text(`Estado de Prueba: ${registro.estado_prueba}`, 15, 90);
  
    // ** Guardar el archivo **
    doc.save(`Prueba_${registro.id}.pdf`);
  }
  
}