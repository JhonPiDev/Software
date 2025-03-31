import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private clienteSeleccionado = new BehaviorSubject<boolean>(false);
  clienteSeleccionado$ = this.clienteSeleccionado.asObservable();

  verificarCliente() {
    const nit = localStorage.getItem('nitSeleccionado');
    this.clienteSeleccionado.next(!!nit);
  }

  setClienteSeleccionado(estado: boolean) {
    if (!estado) {
      localStorage.removeItem('nitSeleccionado');
    }
    this.clienteSeleccionado.next(estado);
  }
}