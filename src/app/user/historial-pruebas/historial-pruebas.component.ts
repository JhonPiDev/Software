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
        this.registros = data.sort((a: any, b: any) => b.id - a.id);
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
    this.paginaActual = 1;
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
            this.filtrarRegistros();
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

  enviarCorreo(registro: any) {
    this.http.post(`http://localhost:3000/enviar-correo`, { id: registro.id }).subscribe(
      () => {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: `El correo fue enviado al cliente: ${registro.cliente_correo}`,
          timer: 2500,
          showConfirmButton: false
        });
      },
      error => {
        Swal.fire({
          icon: 'error',
          title: 'Error al enviar',
          text: 'Hubo un problema al enviar el correo.'
        });
        console.error('Error al enviar correo:', error);
      }
    );
  }
  
  // Exportar un solo registro a PDF
  exportarRegistroPDF(registro: any) {
    const doc = new jsPDF();
  
    // Header & Footer con líneas laterales elegantes
    const addHeaderFooter = (page: number, totalPages: number) => {
      // Líneas laterales elegantes (separadas del borde)
      doc.setDrawColor(0, 102, 204);
      doc.setLineWidth(1);
 // Línea derecha
  
      // Encabezado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 102, 204);
      doc.text('TRUCK SERVICES SAS', 20, 10);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Nit: 901.705.963 - 2', 20, 15);
      doc.text('Carrera 17 sur # 13 - 17, Zona Industrial Neiva - Huila, Colombia', 20, 20);
      doc.text(`Declaración LT#${registro.id}`, 190, 10, { align: 'right' });
  
      // Pie de página
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${page} de ${totalPages}`, 190, 287, { align: 'right' });
      doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 287);
    };
  
    const imagesPerPage = 4;
    const extraImagePages = registro.imagenes && registro.imagenes.length > 0
      ? Math.ceil(registro.imagenes.length / imagesPerPage)
      : 0;
    const basePages = 4;
    let totalPages = basePages + extraImagePages;
  
    const logo = new Image();
    logo.src = 'icon.jpg';
  
    // Página 1 - Portada
    doc.addImage(logo, 'JPEG', 160, 10, 40, 35);
  
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204);
    let startY = 30;
    const lineSpacing = 10;
  
    doc.text('Declaración de Conformidad', 105, startY, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Pruebas de Verificación de Hermeticidad', 105, startY + lineSpacing, { align: 'center' });
    doc.text('Tanque de Almacenamiento Tipo Carro Tanque', 105, startY + lineSpacing * 2, { align: 'center' });
    doc.text(`Registro #${registro.id}`, 105, startY + lineSpacing * 3, { align: 'center' });
  
    let infoY = startY + lineSpacing * 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('TRUCK SERVICES SAS', 105, infoY + 12, { align: 'center' });
  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('NIT: 901.705.963-2', 105, infoY + 20, { align: 'center' });
    doc.text('Carrera 17 sur # 13 - 17, Zona Industrial Neiva - Huila, Colombia', 105, infoY + 28, { align: 'center' });
    doc.text(`Fecha de Generación: ${new Date().toLocaleDateString()}`, 105, infoY + 36, { align: 'center' });
  
    let generalStartY = infoY + 60;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('1. Información General', 20, generalStartY);
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 102, 204);
    doc.line(20, generalStartY + 2, 190, generalStartY + 2);
  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
  
    const introText = `La presente declaración se elabora conforme a la NTC ISO/IEC 17050-1 ( Evaluación de conformidad - Declaración del proveedor -Parte1:Requisitos generales ) y NTC-ISO 17050-2 (Evaluación de la conformidad - Declaración de conformidad del proveedor - Parte2: Documentaciónde Respaldo). Esta declaración se realiza luego de realizar las labores de Verificación de la Hermeticidad de la cisternadepropiedadde:`;
    const justifiedText = doc.splitTextToSize(introText, 170);
    doc.text(justifiedText, 20, generalStartY + 10);
  
    const tableStartY = generalStartY + 10 + justifiedText.length * 6;
    const generalInfo = [
      ['Nombre', registro.cliente_nombre || 'No especificado'],
      ['NIT del Cliente', registro.usuario_nit || 'No especificado'],
      ['Dirección', registro.cliente_direccion || 'No especificada'],
      ['Correo Electrónico', registro.cliente_correo || 'No especificada'],
    ];
  
    autoTable(doc, {
      startY: tableStartY,
      body: generalInfo,
      theme: 'grid',
      margin: { left: 20 },
      styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0] },
      head: [['Campo', 'Valor']],
      headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 120 }
      }
    });
  
    let currentPage = 1;
    addHeaderFooter(currentPage, totalPages);
  
    // Página 2
    doc.addPage();
    currentPage++;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('2. Detalles de la Prueba', 20, 30);
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 102, 204);
    doc.line(20, 32, 190, 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
  
    const testDetails = [
      ['Id Tanque', registro.idtanque || 'No especificado'],
      ['Material', registro.material || 'No especificado'],
      ['Tipo de Tanque', registro.tipo_tanque || 'No especificado'],
      ['Capacidad', registro.capacidad || 'No especificado'],
      ['Fabricante', registro.fabricante || 'No especificado'],
      ['Año de Fabricación', registro.anio_fabricacion || 'No especificado'],
      ['Producto', registro.producto || 'No especificado'],
      ['Presión', registro.presion || 'No especificado'],
      ['Temperatura', registro.temperatura || 'No especificado'],
      ['Fecha de Prueba', this.formatDate(registro.fecha_prueba)],
      ['Hora de Prueba', registro.hora_prueba || 'No especificado'],
      ['Estado', registro.estado_prueba || 'No especificado']
    ];
  
    autoTable(doc, {
      startY: 40,
      head: [['Campo', 'Valor']],
      body: testDetails,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0] },
      headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 120 }
      }
    });
  
    let finalY = (doc as any).lastAutoTable.finalY || 40;
  
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 102, 204);
    doc.text('Resumen:', 20, finalY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const resumen = `La prueba hidrostática correspondiente al registro #${registro.id} fue llevada a cabo conforme a la normativa vigente, asegurando el cumplimiento de los estándares de presión, temperatura y hermeticidad. El estado final de la prueba fue determinado como: "**${registro.estado_prueba || 'No especificado'}**". Este resultado refleja las condiciones observadas durante el procedimiento, garantizando la seguridad y funcionalidad del tanque evaluado.`;
    const resumenLines = doc.splitTextToSize(resumen, 170);
    doc.text(resumenLines, 20, finalY + 18);
  
    const obsY = finalY + 18 + resumenLines.length * 6 + 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 102, 204);
    doc.text('3. Observaciones', 20, obsY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const obsText = doc.splitTextToSize(registro.observaciones || 'Ninguna observación registrada.', 170);
    doc.text(obsText, 20, obsY + 5);
  
    addHeaderFooter(currentPage, totalPages);
  
    // Página 3+ - Imágenes
    // Página 3+ - Imágenes
if (registro.imagenes && registro.imagenes.length > 0) {
  const maxImages = Math.min(registro.imagenes.length, 10); // máximo 10 imágenes
  let index = 0;

  while (index < maxImages) {
    doc.addPage();
    currentPage++;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text(`4. Imágenes de la Prueba${index >= 4 ? ' (Continuación)' : ''}`, 20, 30);
    doc.setDrawColor(0, 102, 204);
    doc.line(20, 32, 190, 32);

    let xPositions = [25, 110];
    let yPositions = [40, 140];
    let imgWidth = 70;
    let imgHeight = 80;

    for (let row = 0; row < 2 && index < maxImages; row++) {
      for (let col = 0; col < 2 && index < maxImages; col++) {
        const image = registro.imagenes[index];
        try {
          const imgData = image.startsWith('data:image') ? image : `data:image/png;base64,${image}`;
          const x = xPositions[col];
          const y = yPositions[row];
          doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.text(`Imagen ${index + 1}`, x + imgWidth / 2, y + imgHeight + 5, { align: 'center' });
        } catch (error) {
          console.error('Error al agregar imagen:', error);
        }
        index++;
      }
    }

    addHeaderFooter(currentPage, totalPages); // mantén el totalPages actualizado luego si agregas la firma
  }
} else {
  doc.addPage();
  currentPage++;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text('4. Imágenes de la Prueba', 20, 30);
  doc.line(20, 32, 190, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Sin imágenes adjuntas.', 20, 40);
  addHeaderFooter(currentPage, totalPages);
}

    // Página final - Firma del inspector
  // if (registro.firma_inspector) {
  //   doc.addPage();
  //   currentPage++;
  //   doc.setFont('helvetica', 'bold');
  //   doc.setFontSize(14);
  //   doc.setTextColor(0, 102, 204);
  //   doc.text('5. Firma del Inspector', 20, 30);
  //   doc.line(20, 32, 190, 32);

  //   doc.setFont('helvetica', 'normal');
  //   doc.setFontSize(11);
  //   doc.setTextColor(0, 0, 0);
  //   doc.text('A continuación se presenta la firma digital del inspector responsable de esta prueba:', 20, 40);

  //   try {
  //     const firmaData = registro.firma_inspector.startsWith('data:image')
  //       ? registro.firma_inspector
  //       : `data:image/png;base64,${registro.firma_inspector}`;

  //     // Agrega imagen de la firma
  //     doc.addImage(firmaData, 'PNG', 80, 60, 50, 30); // posición y tamaño
  //     doc.setDrawColor(0, 102, 204);
  //     doc.rect(75, 55, 60, 40); // Marco elegante

  //     // Nombre e identificación (puedes agregar campos si los tienes)
  //     doc.setFontSize(10);
  //     doc.setFont('helvetica', 'italic');
  //     doc.text('Inspector Responsable', 105, 100, { align: 'center' });

  //   } catch (error) {
  //     console.error('Error al cargar la firma del inspector:', error);
  //     doc.setTextColor(255, 0, 0);
  //     doc.text('Error al cargar la firma del inspector.', 20, 60);
  //   }

  //   addHeaderFooter(currentPage, totalPages + 1); // suma una página más
  //   totalPages++;
  // }

    doc.save(`Declaracion_LT_${registro.id}.pdf`);
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