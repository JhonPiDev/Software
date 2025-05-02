import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import Chart from 'chart.js/auto';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  mostrarGrafico: boolean = false; // Cambiado a false para que la vista de texto sea la predeterminada
  clientes: number = 0;
  equipos: number = 0;
  certificados: number = 0;
  private chart: Chart | null = null;
  private updateSubscription: Subscription | null = null;
  private apiUrl = 'http://localhost:3000/api/resumen';

  constructor(private http: HttpClient) {
    this.fetchData();
    this.startPolling();
  }

  ngAfterViewInit() {
    // No inicializamos la gráfica aquí porque la vista de texto es la predeterminada
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }

  fetchData() {
    this.http.get<{ clientes: number, equipos: number, certificados: number }>(this.apiUrl).subscribe({
      next: (data) => {
        this.clientes = data.clientes;
        this.equipos = data.equipos;
        this.certificados = data.certificados;
        if (this.mostrarGrafico) {
          this.updateGrafico();
        }
      },
      error: (err) => {
        console.error('Error al obtener datos:', err);
      }
    });
  }

  startPolling() {
    this.updateSubscription = interval(5000).subscribe(() => {
      this.fetchData();
    });
  }

  toggleResumen() {
    this.mostrarGrafico = !this.mostrarGrafico;
    if (this.mostrarGrafico) {
      setTimeout(() => this.inicializarGrafico(), 100);
    } else {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    }
  }

  inicializarGrafico() {
    const ctx = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Clientes', 'Equipos', 'Certificados'],
        datasets: [{
          label: 'Registros',
          data: [this.clientes, this.equipos, this.certificados],
          backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  updateGrafico() {
    if (this.chart) {
      this.chart.data.datasets[0].data = [this.clientes, this.equipos, this.certificados];
      this.chart.update();
    }
  }
}