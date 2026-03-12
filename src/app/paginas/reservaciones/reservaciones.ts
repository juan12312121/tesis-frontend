import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Autenticacion } from '../../core/servicios/autenticacion/autenticacion';
import { ReservacionesService, Reservacion } from '../../core/servicios/reservaciones/reservaciones';
import { SidebarComponent } from '../../componentes/aside/aside';

@Component({
  selector: 'app-reservaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './reservaciones.html',
  styleUrl: './reservaciones.css',
})
export class ReservacionesComponent implements OnInit {

  sidebarOpen = true;
  empresa: any = null;
  usuario: any = null;
  currentRoute = 'reservas';

  empresaId: string = '';
  usuarioActual: any = null;

  reservaciones: Reservacion[] = [];
  reservacionesFiltradas: Reservacion[] = [];

  cargando = false;
  actualizando = false;

  filtroEstado: 'todos' | 'pendiente' | 'confirmada' | 'cancelada' = 'todos';
  terminoBusqueda = '';

  paginaActual = 1;
  itemsPorPagina = 10;
  reservacionesPaginadas: Reservacion[] = [];

  mostrarModal = false;
  reservaSeleccionada: Reservacion | null = null;
  mostrarOpcionesEstado = false;

  menuEstadoAbierto: number | null = null;
  vistaModo: 'lista' | 'calendario' = 'lista';
  fechaCalendario: Date = new Date();
  diasCalendario: any[] = [];
  nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  reservacionesDelDia: Reservacion[] = [];
  diaSeleccionado: Date | null = null;

  mensaje = {
    mostrar: false,
    tipo: 'success' as 'success' | 'error',
    texto: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: Autenticacion,
    private reservacionesService: ReservacionesService
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.menuEstadoAbierto = null;
    }
  }

  ngOnInit() {
    this.empresaId = this.route.snapshot.paramMap.get('id') || '';
    this.usuarioActual = this.authService.getUsuario();
    this.usuario = this.usuarioActual;

    this.empresa = {
      id: this.empresaId,
      nombre: this.usuarioActual?.empresa?.nombre || 'Mi Empresa',
      tipo: this.usuarioActual?.empresa?.tipo_negocio || 'ambos',
      modulos: this.usuarioActual?.empresa?.modulos || {
        catalogo: true, pedidos: true, reservas: true
      }
    };

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const empresaIdUsuario = this.authService.getEmpresaId();
    if (this.empresaId !== empresaIdUsuario) {
      this.mostrarMensaje('error', 'No tiene permisos para acceder a estas reservas');
      this.router.navigate(['/dashboard', empresaIdUsuario]);
      return;
    }

    this.cargarReservaciones();
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  handleNavigation(route: string) { 
    this.currentRoute = route; 
    if (window.innerWidth < 1024) this.sidebarOpen = false;
  }
  handleLogout() { this.authService.logout(); }

  cargarReservaciones() {
    this.cargando = true;

    this.reservacionesService.obtenerReservaciones(
      this.empresaId,
      this.filtroEstado === 'todos' ? undefined : this.filtroEstado
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reservaciones = response.data;
          this.aplicarFiltros();
          this.generarCalendario();
        } else {
          this.reservaciones = [];
          this.aplicarFiltros();
        }
        this.cargando = false;
      },
      error: () => {
        this.mostrarMensaje('error', 'Error al cargar reservas');
        this.reservaciones = [];
        this.aplicarFiltros();
        this.cargando = false;
      }
    });
  }

  aplicarFiltros() {
    let resultados = [...this.reservaciones];

    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultados = resultados.filter(res =>
        res.nombre_cliente?.toLowerCase().includes(termino) ||
        res.telefono_cliente?.toLowerCase().includes(termino) ||
        res.id.toString().includes(termino)
      );
    }

    this.reservacionesFiltradas = resultados;
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  cambiarFiltroEstado(estado: typeof this.filtroEstado) {
    this.filtroEstado = estado;
    this.paginaActual = 1;
    this.cargarReservaciones();
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.reservacionesPaginadas = this.reservacionesFiltradas.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.reservacionesFiltradas.length / this.itemsPorPagina) || 1;
  }

  get rangoItems(): string {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.itemsPorPagina, this.reservacionesFiltradas.length);
    return `${inicio}-${fin} de ${this.reservacionesFiltradas.length}`;
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  verDetalle(reserva: Reservacion) {
    this.reservaSeleccionada = { ...reserva };
    this.mostrarModal = true;
    this.mostrarOpcionesEstado = false;
    this.menuEstadoAbierto = null;
  }

  toggleEstadoMenu(id: number) {
    if (this.menuEstadoAbierto === id) {
      this.menuEstadoAbierto = null;
    } else {
      this.menuEstadoAbierto = id;
    }
  }

  actualizarEstado(id: number, nuevoEstado: Reservacion['estado']) {
    this.actualizando = true;
    this.mostrarOpcionesEstado = false;
    this.menuEstadoAbierto = null;

    this.reservacionesService.actualizarEstado(id, nuevoEstado).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('success', 'Estado actualizado correctamente');
          this.cargarReservaciones();

          if (this.reservaSeleccionada && this.reservaSeleccionada.id === id) {
            this.reservaSeleccionada.estado = nuevoEstado;
          }
        } else {
          this.mostrarMensaje('error', 'Error al actualizar');
        }
        this.actualizando = false;
      },
      error: () => {
        this.mostrarMensaje('error', 'Error al actualizar');
        this.actualizando = false;
      }
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.reservaSeleccionada = null;
    this.mostrarOpcionesEstado = false;
  }

  formatearFechaLarga(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatearFechaCorta(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatearHora(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  formatearTelefono(tel: string): string {
    if (!tel) return 'Sin contacto';
    return tel.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
  }

  getEstadoColor(estado: Reservacion['estado']): string {
    const colors: any = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmada: 'bg-green-100 text-green-800 border-green-200',
      cancelada: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getEstadoIcono(estado: Reservacion['estado']): string {
    const icons: any = {
      pendiente: 'fa-clock text-yellow-600',
      confirmada: 'fa-check-circle text-green-600',
      cancelada: 'fa-times-circle text-red-600'
    };
    return icons[estado] || 'fa-calendar';
  }

  getEstadoTexto(estado: Reservacion['estado']): string {
    const texts: any = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      cancelada: 'Cancelada'
    };
    return texts[estado] || estado;
  }

  mostrarMensaje(tipo: 'success' | 'error', texto: string) {
    this.mensaje = { mostrar: true, tipo, texto };
    setTimeout(() => this.mensaje.mostrar = false, 4000);
  }

  cerrarMensaje() {
    this.mensaje.mostrar = false;
  }

  // Lógica del Calendario
  cambiarVista(modo: 'lista' | 'calendario') {
    this.vistaModo = modo;
    if (modo === 'calendario') {
      this.generarCalendario();
    }
  }

  generarCalendario() {
    this.diasCalendario = [];
    const año = this.fechaCalendario.getFullYear();
    const mes = this.fechaCalendario.getMonth();

    const primerDiaMes = new Date(año, mes, 1);
    const ultimoDiaMes = new Date(año, mes + 1, 0);

    const primerDiaSemana = primerDiaMes.getDay(); // 0-6
    const totalDias = ultimoDiaMes.getDate();

    // Rellenar días del mes anterior
    const ultimoDiaMesAnterior = new Date(año, mes, 0).getDate();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      this.diasCalendario.push({
        num: ultimoDiaMesAnterior - i,
        actual: false,
        fecha: new Date(año, mes - 1, ultimoDiaMesAnterior - i)
      });
    }

    // Rellenar días del mes actual
    const hoy = new Date();
    for (let i = 1; i <= totalDias; i++) {
      const fecha = new Date(año, mes, i);
      const resHoy = this.reservaciones.filter(r => {
        const d = new Date(r.fecha_reservacion);
        return d.getDate() === i && d.getMonth() === mes && d.getFullYear() === año && r.estado !== 'cancelada';
      });

      this.diasCalendario.push({
        num: i,
        actual: true,
        hoy: hoy.getDate() === i && hoy.getMonth() === mes && hoy.getFullYear() === año,
        fecha: fecha,
        reservas: resHoy,
        count: resHoy.length
      });
    }

    // Rellenar días del mes siguiente para completar la cuadrícula (opcional)
    const celdasRestantes = 42 - this.diasCalendario.length;
    for (let i = 1; i <= celdasRestantes; i++) {
      this.diasCalendario.push({
        num: i,
        actual: false,
        fecha: new Date(año, mes + 1, i)
      });
    }
  }

  cambiarMes(offset: number) {
    console.log('Cambiando mes con offset:', offset);
    this.fechaCalendario = new Date(
      this.fechaCalendario.getFullYear(),
      this.fechaCalendario.getMonth() + offset,
      1
    );
    this.generarCalendario();
  }

  seleccionarDia(dia: any) {
    if (!dia.actual) {
      this.fechaCalendario = dia.fecha;
      this.generarCalendario();
      return;
    }
    this.diaSeleccionado = dia.fecha;
    this.reservacionesDelDia = dia.reservas || [];
  }

  getNombreMes(): string {
    return this.fechaCalendario.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }

  hoy(): Date {
    return new Date();
  }

  irAHoy() {
    this.fechaCalendario = new Date();
    this.generarCalendario();
    const hoy = new Date();
    const diaHoy = this.diasCalendario.find(d => 
      d.actual && 
      d.fecha.getDate() === hoy.getDate() && 
      d.fecha.getMonth() === hoy.getMonth() && 
      d.fecha.getFullYear() === hoy.getFullYear()
    );
    if (diaHoy) this.seleccionarDia(diaHoy);
  }
}
