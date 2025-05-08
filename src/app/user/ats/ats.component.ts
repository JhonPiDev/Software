import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ats',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './ats.component.html',
  styleUrls: ['./ats.component.scss']
})
export class ATSComponent implements OnInit {
  ATSForm: FormGroup;
  showModal: boolean = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    const fechaActual = new Date().toLocaleDateString('en-CA');
    console.log('Fecha inicial:', fechaActual);
    this.ATSForm = this.fb.group({
      usuario_nit: [{ value: localStorage.getItem('nitSeleccionado') || '', disabled: true }, Validators.required],
      lugar: ['', Validators.required],
      fecha: [{ value: fechaActual, disabled: true }, Validators.required],
      procedimiento: ['', Validators.required],
      nivel_ruido: [false],
      material_filo: [false],
      quimicos: [false],
      iluminacion: [false],
      ventilacion: [false],
      caidas: [false],
      gafas_seguridad: [false],
      arnes: [false],
      guantes: [false],
      casco: [false],
      estado: [0]
    });
  }

  ngOnInit() {
    const fechaActual = new Date().toLocaleDateString('en-CA');
    this.ATSForm.patchValue({ fecha: fechaActual });
  }

  enviarFormulario() {
    if (this.ATSForm.valid) {
      const pasaValidacion = this.validarATS();
      this.ATSForm.patchValue({ estado: pasaValidacion ? 1 : 0 });

      if (!pasaValidacion) {
        return; // La validación ya muestra el mensaje de error en validarATS()
      }

      const datos = this.ATSForm.getRawValue();

      this.http.post<{ message: string }>('http://localhost:3000/api/ats', datos).subscribe({
        next: (response) => {
          console.log('Datos guardados:', response);
          this.showModal = true;
          localStorage.setItem('mostrarTodosBotones', 'true');
          this.resetForm();
        },
        error: (error) => {
          console.error('Error al guardar:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo guardar el ATS. Por favor, intenta de nuevo.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3085d6'
          });
        }
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario Incompleto',
        text: 'Por favor, completa todos los campos obligatorios.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  validarATS(): boolean {
    const riesgos = {
      nivel_ruido: this.ATSForm.get('nivel_ruido')?.value,
      material_filo: this.ATSForm.get('material_filo')?.value,
      quimicos: this.ATSForm.get('quimicos')?.value,
      iluminacion: this.ATSForm.get('iluminacion')?.value,
      ventilacion: this.ATSForm.get('ventilacion')?.value,
      caidas: this.ATSForm.get('caidas')?.value
    };
    const epp = {
      gafas_seguridad: this.ATSForm.get('gafas_seguridad')?.value,
      arnes: this.ATSForm.get('arnes')?.value,
      guantes: this.ATSForm.get('guantes')?.value,
      casco: this.ATSForm.get('casco')?.value
    };

    // Verificar que al menos un riesgo esté seleccionado
    const tieneRiesgo = Object.values(riesgos).some(r => r === true);
    if (!tieneRiesgo) {
      Swal.fire({
        icon: 'error',
        title: 'Validación Fallida',
        text: 'Debes identificar al menos un riesgo en el lugar de trabajo.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      });
      return false;
    }

    // Verificar que al menos un EPP esté seleccionado
    const tieneEPP = Object.values(epp).some(e => e === true);
    if (!tieneEPP) {
      Swal.fire({
        icon: 'error',
        title: 'Validación Fallida',
        text: 'Debes seleccionar al menos un equipo de protección personal (EPP) para mitigar los riesgos.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      });
      return false;
    }

    // Validaciones específicas de riesgos y EPP
    let mensajeError = '';

    if (riesgos.nivel_ruido && !epp.casco) {
      mensajeError = 'El riesgo de nivel de ruido requiere el uso de un casco (con protección auditiva).';
    }
    if (riesgos.material_filo && !(epp.guantes && epp.gafas_seguridad)) {
      mensajeError = 'El riesgo de material con filo requiere guantes y gafas de seguridad.';
    }
    if (riesgos.quimicos && !(epp.gafas_seguridad && epp.guantes)) {
      mensajeError = 'El riesgo de químicos requiere gafas de seguridad y guantes.';
    }
    if (riesgos.ventilacion && !epp.gafas_seguridad) {
      mensajeError = 'El riesgo de ventilación inadecuada requiere gafas de seguridad para proteger contra partículas.';
    }
    if (riesgos.caidas && !(epp.arnes && epp.casco)) {
      mensajeError = 'El riesgo de caídas requiere el uso de un arnés y un casco.';
    }

    if (mensajeError) {
      Swal.fire({
        icon: 'error',
        title: 'Validación Fallida',
        text: mensajeError,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      });
      return false;
    }

    return true;
  }

  cerrarModal() {
    this.showModal = false;
  }

  private resetForm() {
    const fechaActual = new Date().toLocaleDateString('en-CA');
    console.log('Fecha al reset:', fechaActual);
    this.ATSForm.reset({
      usuario_nit: localStorage.getItem('nitSeleccionado') || '',
      lugar: '',
      fecha: fechaActual,
      procedimiento: '',
      nivel_ruido: false,
      material_filo: false,
      quimicos: false,
      iluminacion: false,
      ventilacion: false,
      caidas: false,
      gafas_seguridad: false,
      arnes: false,
      guantes: false,
      casco: false,
      estado: 0
    }, { emitEvent: false });
  }
}