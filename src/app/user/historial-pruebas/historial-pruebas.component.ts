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
  styleUrls: ['./historial-pruebas.component.scss']
})
export class HistorialPruebasComponent implements OnInit {
  registros: any[] = [];
  registrosFiltrados: any[] = [];
  filtro: string = '';
  registroEditando: any = null;
  mostrarFormularioEdicion: boolean = false;

  // Propiedades para la paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 5;
  totalPaginas: number = 1;

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
        // Ordenar por ID descendente en el frontend
        this.registros = data.sort((a: any, b: any) => b.id - a.id);
        // Si tienes una columna fecha_creacion, usa:
        // this.registros = data.sort((a: any, b: any) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
        this.filtrarRegistros();
      },
      (error) => console.error('Error al cargar registros', error)
    );
  }

  // Filtrar registros por material, producto, cliente o NIT
  filtrarRegistros() {
    const filtroLower = this.filtro.toLowerCase();
    this.registrosFiltrados = this.registros.filter(registro =>
      (registro.material?.toLowerCase().includes(filtroLower) || '') ||
      (registro.producto?.toLowerCase().includes(filtroLower) || '') ||
      (registro.cliente_nombre?.toLowerCase().includes(filtroLower) || '') ||
      (registro.usuario_nit?.toLowerCase().includes(filtroLower) || '')
    );
    this.paginaActual = 1; // Reiniciar a la primera página al filtrar
    this.calcularTotalPaginas();
  }

  // Calcular el total de páginas
  calcularTotalPaginas() {
    this.totalPaginas = Math.ceil(this.registrosFiltrados.length / this.registrosPorPagina);
  }

  // Obtener los registros de la página actual
  get registrosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    return this.registrosFiltrados.slice(inicio, fin);
  }

  // Cambiar a la página anterior
  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  // Cambiar a la página siguiente
  paginaSiguiente() {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  // Ir a una página específica
  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // Generar un array con los números de página
  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  // Editar registro
  editarRegistro(registro: any) {
    const registroEditado = { ...registro };
    if (registroEditado.fecha_prueba) {
      registroEditado.fecha_prueba = new Date(registroEditado.fecha_prueba).toISOString().split('T')[0];
    }
    this.registroEditando = registroEditado;
    this.mostrarFormularioEdicion = true;
  }

  // Guardar cambios en el registro
  guardarEdicion() {
    if (!this.registroEditando.fecha_prueba) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'La fecha de prueba es obligatoria' });
      return;
    }

    const datosActualizados = {
      presion: this.registroEditando.presion,
      temperatura: this.registroEditando.temperatura,
      fecha_prueba: this.registroEditando.fecha_prueba,
      observaciones: this.registroEditando.observaciones
    };

    this.http.put(`http://localhost:3000/registros/${this.registroEditando.id}`, datosActualizados).subscribe(
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
            this.filtrarRegistros(); // Actualizar la lista filtrada y la paginación
            Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El registro se ha eliminado correctamente' });
          },
          (error) => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el registro' })
        );
      }
    });
  }

  // Formatear fecha
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  // Exportar un solo registro a PDF
  exportarRegistroPDF(registro: any) {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204);
    doc.text('Registro de Prueba Hidrostática', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Informe Individual', 105, 28, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 102, 204);
    doc.line(20, 32, 190, 32);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Empresa de Servicios para Islas de Gasolinerías', 20, 40);
    doc.setFont('helvetica', 'normal');
    doc.text('NIT: 123456789-0', 20, 46);
    doc.text('Dirección: Carrera 123 #45-67, Bogotá, Colombia', 20, 52);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 20, 58);

    const datos = [
      ['N° de Registro', registro.id],
      ['Cliente', registro.cliente_nombre || 'No especificado'],
      ['NIT del Cliente', registro.usuario_nit || 'No especificado'],
      ['Material', registro.material],
      ['Tipo de Tanque', registro.tipo_tanque || 'No especificado'],
      ['Capacidad', registro.capacidad || 'No especificado'],
      ['Año de Fabricación', registro.anio_fabricacion || 'No especificado'],
      ['Producto', registro.producto],
      ['Presión', registro.presion || 'No especificado'],
      ['Temperatura', registro.temperatura || 'No especificado'],
      ['Fecha de Prueba', this.formatDate(registro.fecha_prueba)],
      ['Hora de Prueba', registro.hora_prueba || 'No especificado'],
      ['Estado', registro.estado_prueba],
    ];

    autoTable(doc, {
      startY: 70,
      head: [['Campo', 'Valor']],
      body: datos,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 120 },
      },
    });

    let finalY = (doc as any).lastAutoTable.finalY || 70;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Observaciones:', 20, finalY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const observaciones = doc.splitTextToSize(registro.observaciones || 'Ninguna', 170);
    doc.text(observaciones, 20, finalY + 16);

    finalY = finalY + 16 + (observaciones.length * 5);
    if (registro.imagen_base64) {
      const imgData = `data:image/png;base64,${registro.imagen_base64}`;
      doc.addImage(imgData, 'PNG', 55, finalY + 10, 100, 80);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Imagen de la prueba', 105, finalY + 95, { align: 'center' });
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Sin imagen adjunta', 20, finalY + 10);
    }

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, 190, 287, { align: 'right' });
    }

    doc.save(`Registro_${registro.id}.pdf`);
  }

  // Exportar todos los registros a PDF
  exportarPDF() {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204);
    doc.text('Empresa de Servicios para Islas de Gasolinerías', 15, 15);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Informe de Pruebas Hidrostáticas', 15, 25);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 15, 35);

    const columnas = ['ID', 'Cliente', 'NIT del Cliente', 'Material', 'Tipo de Tanque', 'Capacidad', 'Año de Fabricación', 'Producto', 'Presión', 'Temperatura', 'Fecha de Prueba', 'Hora de Prueba', 'Estado'];
    const filas = this.registrosFiltrados.map(r => [
      r.id,
      r.cliente_nombre || 'No especificado',
      r.usuario_nit || 'No especificado',
      r.material,
      r.tipo_tanque || 'No especificado',
      r.capacidad || 'No especificado',
      r.anio_fabricacion || 'No especificado',
      r.producto,
      r.presion || 'No especificado',
      r.temperatura || 'No especificado',
      this.formatDate(r.fecha_prueba),
      r.hora_prueba || 'No especificado',
      r.estado_prueba,
    ]);

    autoTable(doc, {
      startY: 45,
      head: [columnas],
      body: filas,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 15 },
        8: { cellWidth: 15 },
        9: { cellWidth: 15 },
        10: { cellWidth: 15 },
        11: { cellWidth: 15 },
        12: { cellWidth: 15 },
      },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, 190, 287, { align: 'right' });
    }

    doc.save('Informe_Pruebas_Hidrostáticas.pdf');
  }
}