// pedidos.component.ts - VERSIÓN LIMPIA

import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Autenticacion } from '../../core/servicios/autenticacion/autenticacion';
import { Pedidos as PedidosService, Pedido, Estadisticas } from '../../core/servicios/pedidos/pedidos';
import { SidebarComponent } from '../../componentes/aside/aside';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {

  sidebarOpen = true;
  empresa: any = null;
  usuario: any = null;
  currentRoute = 'pedidos';

  empresaId: string = '';
  usuarioActual: any = null;

  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];

  estadisticas: Estadisticas | null = null;

  cargando = false;
  actualizando = false;

  filtroEstado: 'todos' | 'pendiente' | 'en_proceso' | 'entregado' | 'cancelado' = 'todos';
  terminoBusqueda = '';

  paginaActual = 1;
  itemsPorPagina = 10;
  pedidosPaginados: Pedido[] = [];

  mostrarModal = false;
  pedidoSeleccionado: Pedido | null = null;
  mostrarOpcionesEstado = false;

  menuEstadoAbierto: number | null = null;

  mensaje = {
    mostrar: false,
    tipo: 'success' as 'success' | 'error',
    texto: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: Autenticacion,
    private pedidosService: PedidosService
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
        catalogo: true,
        pedidos: true,
        reservas: true
      }
    };

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const empresaIdUsuario = this.authService.getEmpresaId();
    if (this.empresaId !== empresaIdUsuario) {
      this.mostrarMensaje('error', 'No tiene permisos para acceder a estos pedidos');
      this.router.navigate(['/dashboard', empresaIdUsuario]);
      return;
    }

    this.cargarPedidos();
    this.cargarEstadisticas();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  handleNavigation(route: string) {
    this.currentRoute = route;
    if (window.innerWidth < 1024) this.sidebarOpen = false;
  }

  handleLogout() {
    this.authService.logout();
  }

  /**
   * Obtiene la lista asincrona de pedidos desde el backend.
   * Aplica el filtro de estado actual si existe uno definido.
   * Maneja diversos estados de error mostrando mensajes descriptivos.
   */
  cargarPedidos() {
    this.cargando = true;

    this.pedidosService.obtenerPedidos(
      this.empresaId,
      this.filtroEstado === 'todos' ? undefined : this.filtroEstado,
      true
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pedidos = response.data;
          this.aplicarFiltros();
        } else {
          this.pedidos = [];
          this.aplicarFiltros();
        }
        this.cargando = false;
      },
      error: (error) => {
        let mensajeError = 'Error al cargar los pedidos';

        if (error.status === 0) {
          mensajeError = 'No se puede conectar al servidor';
        } else if (error.status === 404) {
          mensajeError = 'Endpoint no encontrado';
        } else if (error.status === 500) {
          mensajeError = 'Error en el servidor';
        } else if (error.error?.mensaje) {
          mensajeError = error.error.mensaje;
        }

        this.mostrarMensaje('error', mensajeError);
        this.pedidos = [];
        this.aplicarFiltros();
        this.cargando = false;
      }
    });
  }

  cargarEstadisticas() {
    this.pedidosService.obtenerEstadisticas(this.empresaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.estadisticas = response.data;
        }
      },
      error: () => { }
    });
  }

  /**
   * Ejecuta el filtro de busqueda local sobre el listado de pedidos cargados.
   * Revisa coincidencias por nombre, telefono y folio del pedido.
   * Tambien se encarga de reiniciar la paginacion tras el filtrado.
   */
  aplicarFiltros() {
    let resultados = [...this.pedidos];

    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultados = resultados.filter(pedido =>
        pedido.nombre_cliente?.toLowerCase().includes(termino) ||
        pedido.telefono_cliente?.toLowerCase().includes(termino) ||
        pedido.id.toString().includes(termino)
      );
    }

    this.pedidosFiltrados = resultados;
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  cambiarFiltroEstado(estado: typeof this.filtroEstado) {
    this.filtroEstado = estado;
    this.paginaActual = 1;
    this.cargarPedidos();
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.pedidosPaginados = this.pedidosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.pedidosFiltrados.length / this.itemsPorPagina);
  }

  get rangoItems(): string {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.itemsPorPagina, this.pedidosFiltrados.length);
    return `${inicio}-${fin} de ${this.pedidosFiltrados.length}`;
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get paginasVisibles(): number[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        paginas.push(i);
      }
    } else {
      if (actual <= 4) {
        for (let i = 1; i <= 5; i++) paginas.push(i);
        paginas.push(-1);
        paginas.push(total);
      } else if (actual >= total - 3) {
        paginas.push(1);
        paginas.push(-1);
        for (let i = total - 4; i <= total; i++) paginas.push(i);
      } else {
        paginas.push(1);
        paginas.push(-1);
        for (let i = actual - 1; i <= actual + 1; i++) paginas.push(i);
        paginas.push(-1);
        paginas.push(total);
      }
    }

    return paginas;
  }

  verDetalle(pedido: Pedido) {
    this.pedidosService.obtenerDetallePedido(pedido.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pedidoSeleccionado = response.data;
          this.mostrarModal = true;
          this.mostrarOpcionesEstado = false;
          this.menuEstadoAbierto = null;
        } else {
          this.mostrarMensaje('error', 'No se pudo cargar el detalle del pedido');
        }
      },
      error: () => {
        this.mostrarMensaje('error', 'Error al obtener el detalle del pedido');
      }
    });
  }

  toggleEstadoMenu(pedidoId: number) {
    if (this.menuEstadoAbierto === pedidoId) {
      this.menuEstadoAbierto = null;
    } else {
      this.menuEstadoAbierto = pedidoId;
    }
  }

  /**
   * Modifica el estado de un pedido (ej: de Pendiente a En Proceso) iterando
   * con el servidor para persistir los cambios. Actualiza localmente
   * el listado y las estadisticas despues de una operacion exitosa.
   * @param pedidoId El identificador unico del pedido a modificar.
   * @param nuevoEstado El estado de seguimiento seleccionado.
   */
  actualizarEstado(pedidoId: number, nuevoEstado: Pedido['estado']) {
    this.actualizando = true;
    this.mostrarOpcionesEstado = false;
    this.menuEstadoAbierto = null;

    this.pedidosService.actualizarEstado(pedidoId, nuevoEstado).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('success', 'Estado actualizado correctamente');
          this.cargarPedidos();
          this.cargarEstadisticas();

          if (this.pedidoSeleccionado && this.pedidoSeleccionado.id === pedidoId) {
            this.pedidoSeleccionado.estado = nuevoEstado;
          }
        } else {
          this.mostrarMensaje('error', response.mensaje || 'Error al actualizar el estado');
        }
        this.actualizando = false;
      },
      error: () => {
        this.mostrarMensaje('error', 'Error al actualizar el estado');
        this.actualizando = false;
      }
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.pedidoSeleccionado = null;
    this.mostrarOpcionesEstado = false;
  }

  formatearPrecio(precio: number): string {
    return this.pedidosService.formatearPrecio(precio);
  }

  formatearFecha(fecha: string): string {
    return this.pedidosService.formatearFecha(fecha);
  }

  formatearFechaCorta(fecha: string): string {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatearHora(fecha: string): string {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearTelefono(telefono: string): string {
    return this.pedidosService.formatearTelefono(telefono);
  }

  getEstadoColor(estado: Pedido['estado']): string {
    return this.pedidosService.getEstadoColor(estado);
  }

  getEstadoEmoji(estado: Pedido['estado']): string {
    return this.pedidosService.getEstadoEmoji(estado);
  }

  getEstadoTexto(estado: Pedido['estado']): string {
    return this.pedidosService.getEstadoTexto(estado);
  }

  getEstadoIcono(estado: Pedido['estado']): string {
    const iconos: Record<Pedido['estado'], string> = {
      pendiente: 'fa-clock text-yellow-600',
      en_proceso: 'fa-sync fa-spin text-blue-600',
      entregado: 'fa-check-circle text-green-600',
      cancelado: 'fa-times-circle text-red-600'
    };
    return iconos[estado] || 'fa-box';
  }

  getCantidadPorEstado(estado: string): number {
    return this.pedidosService.getCantidadPorEstado(this.estadisticas, estado);
  }

  getTotalVentasPorEstado(estado: string): number {
    return this.pedidosService.getTotalVentasPorEstado(this.estadisticas, estado);
  }

  mostrarMensaje(tipo: 'success' | 'error', texto: string) {
    this.mensaje = { mostrar: true, tipo, texto };
    setTimeout(() => {
      this.mensaje.mostrar = false;
    }, 5000);
  }

  cerrarMensaje() {
    this.mensaje.mostrar = false;
  }
}
