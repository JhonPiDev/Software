import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-exportacion-informes',
  standalone: true,
  imports: [],
  templateUrl: './exportacion-informes.component.html',
  styleUrl: './exportacion-informes.component.scss'
})
export class ExportacionInformesComponent {
  exportarCSV() {
    console.log('Exportando a CSV...');
    // Lógica para exportar a CSV
  }

  exportarPDF() {
    console.log('Exportando a PDF...');
    // Lógica para exportar a PDF
  }
}
