import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class ExportarInformeService {

  constructor() { }

  generarPDF(historialDePruebas: any[]) {
    const doc = new jsPDF();
    
    // ** Encabezado del documento **
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Empresa de Servicios para Islas de Gasolinerías', 15, 15);
    doc.setFontSize(12);
    doc.text('Informe de Pruebas Hidrostáticas', 15, 25);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 15, 35);
    
    // ** Datos de la tabla **
    const columnas = ['ID', 'Material', 'Producto', 'Fecha de Prueba', 'Estado de Prueba'];
    const filas = historialDePruebas.map(registro => [
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
}
