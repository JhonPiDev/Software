import { Component } from '@angular/core';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss'
})
export class NotificacionesComponent {
  notificaciones = [
    { mensaje: 'Prueba completada el 2023-10-01', leida: false },
    { mensaje: 'Nueva actualización disponible', leida: true },
  ];
}
