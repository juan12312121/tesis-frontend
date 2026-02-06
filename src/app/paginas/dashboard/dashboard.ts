import { Component, OnInit, OnDestroy, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../componentes/aside/aside';
import { WhatsappStatus } from '../../componentes/whatsapp-status/whatsapp-status';
import { Pedidos, Pedido, Estadisticas } from '../../core/servicios/pedidos/pedidos';

// Declarar Chart.js globalmente
declare const Chart: any;

interface Empresa {
  id: string;
  nombre: string;
  tipo: string;
  logo?: string;
  modulos: {
    pedidos: boolean;
    reservas: boolean;
    catalogo: boolean;
  };
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

interface ActividadReciente {
  id: number;
  tipo: string;
  titulo: string;
  descripcion: string;
  estado: string;
  icono: string;
  color: string;
  fecha: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SidebarComponent,
    WhatsappStatus
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private pedidosService = inject(Pedidos);

  private readonly API_URL = 'http://localhost:3000/api';

  // Estado
  empresaId: string = '';
  empresa: Empresa | null = null;
  usuario: Usuario | null = null;

  currentView: string = 'dashboard';
  sidebarOpen: boolean = true;
  isLoading: boolean = true;

  // Gráfica de pedidos
  private pedidosChart: any = null;
  vistaActual: string = 'dia'; // 'dia', 'semana', 'mes'

  // Estadísticas de pedidos (DATOS REALES)
  totalPedidos: number = 0;
  promedioDiario: number = 0;
  diaMasPedidos: string = '-';
  tendencia: number = 0;
  estadisticas: Estadisticas | null = null;

  // Actividad reciente (DATOS REALES)
  actividadReciente: ActividadReciente[] = [];
  pedidosRecientes: Pedido[] = [];

  // Estado WhatsApp
  whatsappConnected: boolean = false;
  conversacionesActivas: number = 0;

  // Datos para diferentes vistas (DATOS REALES)
  private datosPorDia = {
    labels: [] as string[],
    data: [] as number[]
  };

  private datosPorSemana = {
    labels: [] as string[],
    data: [] as number[]
  };

  private datosPorMes = {
    labels: [] as string[],
    data: [] as number[]
  };

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.empresaId = params['id'];
      if (this.empresaId) {
        this.loadEmpresaData();
        this.verificarEstadoWhatsApp();
      } else {
        this.router.navigate(['/seleccionar-empresa']);
      }
    });

    this.loadUserData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.currentView === 'dashboard') {
        this.initPedidosChart();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.pedidosChart) {
      this.pedidosChart.destroy();
      this.pedidosChart = null;
    }
  }

  // ============================================
  // CARGAR DATOS REALES
  // ============================================

  async loadEmpresaData(): Promise<void> {
    try {
      this.isLoading = true;

      console.log(`📊 Cargando datos reales para empresa ${this.empresaId}...`);

      // Cargar datos en paralelo
      await Promise.all([
        this.cargarPedidos(),
        this.cargarEstadisticas(),
        this.cargarDatosGrafica()
      ]);

      // Simular datos de empresa (esto después lo puedes conectar a tu API)
      this.empresa = {
        id: this.empresaId,
        nombre: 'Mi Empresa',
        tipo: 'Restaurante',
        modulos: {
          pedidos: true,
          reservas: true,
          catalogo: true
        }
      };

      this.isLoading = false;

      console.log('✅ Datos del dashboard cargados exitosamente');

    } catch (error) {
      console.error('❌ Error al cargar datos de empresa:', error);
      this.isLoading = false;
    }
  }

  async cargarPedidos(): Promise<void> {
    try {
      console.log('📋 Cargando pedidos recientes...');

      this.pedidosService.obtenerPedidos(this.empresaId, undefined, true).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.pedidosRecientes = this.pedidosService.ordenarPorFecha(response.data);

            // Convertir pedidos a actividad reciente (tomar los últimos 5)
            this.actividadReciente = this.pedidosRecientes
              .slice(0, 5)
              .map(pedido => this.convertirPedidoAActividad(pedido));

            console.log(`✅ ${this.pedidosRecientes.length} pedidos cargados`);
            console.log(`📊 Actividad reciente:`, this.actividadReciente);
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar pedidos:', error);
          this.actividadReciente = [];
        }
      });
    } catch (error) {
      console.error('❌ Error en cargarPedidos:', error);
    }
  }

  async cargarEstadisticas(): Promise<void> {
    try {
      console.log('📊 Cargando estadísticas...');

      this.pedidosService.obtenerEstadisticas(this.empresaId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.estadisticas = response.data;
            this.totalPedidos = response.data.totales.total_pedidos;

            console.log('✅ Estadísticas cargadas:', this.estadisticas);
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar estadísticas:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error en cargarEstadisticas:', error);
    }
  }

  async cargarDatosGrafica(): Promise<void> {
    try {
      console.log('📈 Calculando datos para gráfica...');

      this.pedidosService.obtenerPedidos(this.empresaId, undefined, true).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const pedidos = response.data;

            // Procesar datos por día (últimos 14 días)
            this.datosPorDia = this.procesarDatosPorDia(pedidos);

            // Procesar datos por semana (últimas 4 semanas)
            this.datosPorSemana = this.procesarDatosPorSemana(pedidos);

            // Procesar datos por mes (últimos 12 meses)
            this.datosPorMes = this.procesarDatosPorMes(pedidos);

            // Calcular promedio diario
            if (this.datosPorDia.data.length > 0) {
              const suma = this.datosPorDia.data.reduce((a, b) => a + b, 0);
              this.promedioDiario = Math.round(suma / this.datosPorDia.data.length);
            }

            // Encontrar día con más pedidos
            const maxPedidos = Math.max(...this.datosPorDia.data);
            const indexMaxDia = this.datosPorDia.data.indexOf(maxPedidos);
            this.diaMasPedidos = this.datosPorDia.labels[indexMaxDia] || '-';

            console.log('✅ Datos de gráfica procesados');
            console.log('📊 Por día:', this.datosPorDia);
            console.log('📊 Por semana:', this.datosPorSemana);
            console.log('📊 Por mes:', this.datosPorMes);

            // Actualizar gráfica si ya está inicializada
            if (this.pedidosChart) {
              this.updatePedidosChart();
            }
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar datos de gráfica:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error en cargarDatosGrafica:', error);
    }
  }

  // ============================================
  // PROCESAMIENTO DE DATOS PARA GRÁFICAS
  // ============================================

  procesarDatosPorDia(pedidos: Pedido[]): { labels: string[], data: number[] } {
    const hoy = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    // Generar últimos 14 días
    for (let i = 13; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);

      const dia = fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
      labels.push(dia);

      // Contar pedidos de ese día
      const pedidosDelDia = pedidos.filter(pedido => {
        const fechaPedido = new Date(pedido.fecha_creacion);
        return fechaPedido.toDateString() === fecha.toDateString();
      }).length;

      data.push(pedidosDelDia);
    }

    return { labels, data };
  }

  procesarDatosPorSemana(pedidos: Pedido[]): { labels: string[], data: number[] } {
    const hoy = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    // Generar últimas 4 semanas
    for (let i = 3; i >= 0; i--) {
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(inicioSemana.getDate() - (i * 7 + 6));

      const finSemana = new Date(inicioSemana);
      finSemana.setDate(finSemana.getDate() + 6);

      labels.push(`Semana ${4 - i}`);

      // Contar pedidos de esa semana
      const pedidosDeLaSemana = pedidos.filter(pedido => {
        const fechaPedido = new Date(pedido.fecha_creacion);
        return fechaPedido >= inicioSemana && fechaPedido <= finSemana;
      }).length;

      data.push(pedidosDeLaSemana);
    }

    return { labels, data };
  }

  procesarDatosPorMes(pedidos: Pedido[]): { labels: string[], data: number[] } {
    const hoy = new Date();
    const labels: string[] = [];
    const data: number[] = [];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Generar últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      labels.push(meses[fecha.getMonth()]);

      // Contar pedidos de ese mes
      const pedidosDelMes = pedidos.filter(pedido => {
        const fechaPedido = new Date(pedido.fecha_creacion);
        return fechaPedido.getMonth() === fecha.getMonth() &&
               fechaPedido.getFullYear() === fecha.getFullYear();
      }).length;

      data.push(pedidosDelMes);
    }

    return { labels, data };
  }

  // ============================================
  // CONVERTIR PEDIDOS A ACTIVIDAD
  // ============================================

  convertirPedidoAActividad(pedido: Pedido): ActividadReciente {
    const iconos = {
      'pendiente': 'fa-clock',
      'en_proceso': 'fa-spinner',
      'entregado': 'fa-check-circle',
      'cancelado': 'fa-times-circle'
    };

    const colores = {
      'pendiente': 'yellow',
      'en_proceso': 'blue',
      'entregado': 'green',
      'cancelado': 'red'
    };

    const estados = {
      'pendiente': 'Pendiente',
      'en_proceso': 'En Proceso',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };

    const tiempoTranscurrido = this.calcularTiempoTranscurrido(new Date(pedido.fecha_creacion));
    const telefonoFormateado = this.pedidosService.formatearTelefono(pedido.telefono_cliente);

    return {
      id: pedido.id,
      tipo: 'pedido',
      titulo: pedido.nombre_cliente || 'Cliente sin nombre',
      descripcion: `${telefonoFormateado} - ${this.pedidosService.formatearPrecio(pedido.total)} - ${tiempoTranscurrido}`,
      estado: estados[pedido.estado],
      icono: iconos[pedido.estado],
      color: colores[pedido.estado],
      fecha: new Date(pedido.fecha_creacion)
    };
  }

  calcularTiempoTranscurrido(fecha: Date): string {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `Hace ${minutos} min`;
    return 'Hace un momento';
  }

  async loadUserData(): Promise<void> {
    try {
      // Aquí después puedes obtener el usuario del token o localStorage
      this.usuario = {
        id: '1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        rol: 'Administrador'
      };
    } catch (error) {
      console.error('Error al cargar datos de usuario:', error);
    }
  }

  async verificarEstadoWhatsApp(): Promise<void> {
    try {
      const response = await fetch(
        `${this.API_URL}/whatsapp/public/estado/${this.empresaId}/empresa_${this.empresaId}`
      );
      const data = await response.json();

      if (data.success) {
        this.whatsappConnected = data.conectado;
      }
    } catch (error) {
      console.error('Error verificando estado WhatsApp:', error);
      this.whatsappConnected = false;
    }
  }

  // ============================================
  // GRÁFICA DE PEDIDOS
  // ============================================

  private initPedidosChart(): void {
    const canvas = document.getElementById('pedidosChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Canvas pedidosChart no encontrado - esperando...');
      setTimeout(() => this.initPedidosChart(), 200);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (typeof Chart === 'undefined') {
      console.error('Chart.js no está cargado. Agrega el script en index.html');
      return;
    }

    if (this.pedidosChart) {
      this.pedidosChart.destroy();
    }

    const datos = this.getDatosActuales();

    this.pedidosChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datos.labels,
        datasets: [{
          label: 'Pedidos',
          data: datos.data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#2563eb',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#3b82f6',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              title: function(context: any) {
                return context[0].label;
              },
              label: function(context: any) {
                return `${context.parsed.y} pedidos`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: '#6b7280',
              font: {
                size: 12,
                weight: '500'
              },
              padding: 10,
              stepSize: 1
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: '#6b7280',
              font: {
                size: 12,
                weight: '500'
              },
              padding: 10
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    console.log('✅ Gráfica de pedidos inicializada con datos reales');
  }

  cambiarVistaPedidos(vista: string): void {
    this.vistaActual = vista;
    this.updatePedidosChart();
  }

  private updatePedidosChart(): void {
    if (!this.pedidosChart) return;

    const datos = this.getDatosActuales();

    this.pedidosChart.data.labels = datos.labels;
    this.pedidosChart.data.datasets[0].data = datos.data;
    this.pedidosChart.update('active');
  }

  private getDatosActuales(): { labels: string[], data: number[] } {
    switch (this.vistaActual) {
      case 'dia':
        return this.datosPorDia;
      case 'semana':
        return this.datosPorSemana;
      case 'mes':
        return this.datosPorMes;
      default:
        return this.datosPorDia;
    }
  }

  // ============================================
  // NAVEGACIÓN Y UI
  // ============================================

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  handleNavigation(route: string): void {
    this.currentView = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (route === 'dashboard') {
      setTimeout(() => {
        this.initPedidosChart();
      }, 100);
    }
  }

  handleLogout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  changeView(view: string): void {
    this.currentView = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getViewTitle(): string {
    const titles: { [key: string]: string } = {
      'dashboard': 'Inicio',
      'mensajes': 'Mensajes',
      'catalogo': 'Catálogo',
      'pedidos': 'Pedidos',
      'reservas': 'Reservas',
      'chatbot': 'Configurar Chatbot',
      'whatsapp': 'Estado WhatsApp',
      'configuracion': 'Configuración'
    };
    return titles[this.currentView] || 'Dashboard';
  }

  getViewSubtitle(): string {
    const subtitles: { [key: string]: string } = {
      'dashboard': 'Vista general de tu negocio',
      'mensajes': 'Historial de conversaciones de tu empresa',
      'catalogo': 'Administra tus productos o servicios',
      'pedidos': 'Gestión de pedidos',
      'reservas': 'Gestión de reservas y citas',
      'chatbot': 'Respuestas automáticas y flujos',
      'whatsapp': 'Gestión de conexión WhatsApp',
      'configuracion': 'Ajustes de tu empresa y módulos'
    };
    return subtitles[this.currentView] || '';
  }

  async toggleModulo(modulo: 'pedidos' | 'reservas'): Promise<void> {
    if (!this.empresa) return;

    try {
      this.empresa.modulos[modulo] = !this.empresa.modulos[modulo];
      console.log(`Módulo ${modulo} ${this.empresa.modulos[modulo] ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error al actualizar módulo:', error);
      this.empresa.modulos[modulo] = !this.empresa.modulos[modulo];
    }
  }

  getActivityColorClass(color: string): string {
    const colors: { [key: string]: string } = {
      'green': 'bg-green-100 text-green-600',
      'blue': 'bg-blue-100 text-blue-600',
      'purple': 'bg-purple-100 text-purple-600',
      'orange': 'bg-orange-100 text-orange-600',
      'red': 'bg-red-100 text-red-600',
      'yellow': 'bg-yellow-100 text-yellow-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  }

  getStatusBadgeClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'Pendiente': 'bg-yellow-100 text-yellow-700',
      'En Proceso': 'bg-blue-100 text-blue-700',
      'Entregado': 'bg-green-100 text-green-700',
      'Cancelado': 'bg-red-100 text-red-700'
    };
    return classes[estado] || 'bg-gray-100 text-gray-600';
  }
}
