// pedidos.component.ts - CÓDIGO COMPLETO CON DEBUG MEJORADO
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

  // ==================== SIDEBAR DATA ====================
  sidebarOpen = true;
  empresa: any = null;
  usuario: any = null;
  currentRoute = 'pedidos';

  // Datos del usuario
  empresaId: string = '';
  usuarioActual: any = null;

  // Lista de pedidos
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];

  // Estadísticas
  estadisticas: Estadisticas | null = null;

  // Estados de carga
  cargando = false;
  actualizando = false;

  // Filtros
  filtroEstado: 'todos' | 'pendiente' | 'en_proceso' | 'entregado' | 'cancelado' = 'todos';
  terminoBusqueda = '';

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  pedidosPaginados: Pedido[] = [];

  // Modal de detalle
  mostrarModal = false;
  pedidoSeleccionado: Pedido | null = null;
  mostrarOpcionesEstado = false;

  // Menu de estado en cards
  menuEstadoAbierto: number | null = null;

  // Mensajes
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
  ) {}

  // ==================== HOST LISTENER ====================
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Cerrar el menú de estado si se hace clic fuera de él
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.menuEstadoAbierto = null;
    }
  }

  ngOnInit() {
    this.empresaId = this.route.snapshot.paramMap.get('id') || '';
    this.usuarioActual = this.authService.getUsuario();
    this.usuario = this.usuarioActual;

    console.log('🚀 Iniciando componente de pedidos');
    console.log('📍 Empresa ID:', this.empresaId);

    this.empresa = {
      id: this.empresaId,
      nombre: this.usuarioActual?.empresa?.nombre || 'Mi Empresa',
      tipo: this.usuarioActual?.empresa?.tipo || 'Empresa',
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

  // ==================== SIDEBAR METHODS ====================
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  handleNavigation(route: string) {
    this.currentRoute = route;
  }

  handleLogout() {
    this.authService.logout();
  }

  // ==================== CARGAR DATOS - VERSIÓN CON DEBUG MEJORADO ====================
  cargarPedidos() {
    console.log('📋 Cargando pedidos para empresa:', this.empresaId);
    console.log('🔗 URL completa:', `http://localhost:3000/api/pedidos/empresa/${this.empresaId}`);
    this.cargando = true;

    const incluirSinNombre = true;

    this.pedidosService.obtenerPedidos(
      this.empresaId,
      this.filtroEstado === 'todos' ? undefined : this.filtroEstado,
      incluirSinNombre
    ).subscribe({
      next: (response) => {
        console.log('✅ RESPUESTA COMPLETA:', response);
        console.log('   ├─ success:', response.success);
        console.log('   ├─ data existe:', !!response.data);
        console.log('   ├─ data es array:', Array.isArray(response.data));
        console.log('   └─ length:', response.data?.length);

        if (response.success && response.data) {
          this.pedidos = response.data;
          console.log('📦 Pedidos cargados:', this.pedidos.length);

          // Mostrar estructura del primer pedido
          if (this.pedidos.length > 0) {
            console.log('🔍 PRIMER PEDIDO COMPLETO:');
            console.log(JSON.stringify(this.pedidos[0], null, 2));

            console.log('🔍 ESTRUCTURA DEL PRIMER PEDIDO:');
            console.log('   ├─ id:', this.pedidos[0].id);
            console.log('   ├─ nombre_cliente:', this.pedidos[0].nombre_cliente);
            console.log('   ├─ telefono_cliente:', this.pedidos[0].telefono_cliente);
            console.log('   ├─ estado:', this.pedidos[0].estado);
            console.log('   ├─ total:', this.pedidos[0].total);
            console.log('   ├─ fecha_creacion:', this.pedidos[0].fecha_creacion);
            console.log('   └─ items:', this.pedidos[0].items);
          }

          this.aplicarFiltros();
        } else {
          console.warn('⚠️ Respuesta sin datos válidos');
          console.warn('   ├─ success:', response.success);
          console.warn('   ├─ mensaje:', response.mensaje);
          console.warn('   └─ error:', response.error);
          this.pedidos = [];
          this.aplicarFiltros();
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('❌ ERROR COMPLETO:', error);
        console.error('   ├─ status:', error.status);
        console.error('   ├─ statusText:', error.statusText);
        console.error('   ├─ message:', error.message);
        console.error('   ├─ url:', error.url);
        console.error('   └─ error:', error.error);

        let mensajeError = 'Error al cargar los pedidos';

        if (error.status === 0) {
          mensajeError = 'No se puede conectar al servidor. ¿Está corriendo el backend?';
        } else if (error.status === 404) {
          mensajeError = 'Endpoint no encontrado. Verifica la URL del API';
        } else if (error.status === 500) {
          mensajeError = 'Error en el servidor. Revisa los logs del backend';
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
    console.log('📊 Cargando estadísticas para empresa:', this.empresaId);

    this.pedidosService.obtenerEstadisticas(this.empresaId).subscribe({
      next: (response) => {
        console.log('✅ Estadísticas recibidas:', response);

        if (response.success && response.data) {
          this.estadisticas = response.data;
          console.log('📊 Estadísticas procesadas:', this.estadisticas);
        } else {
          console.warn('⚠️ Estadísticas sin datos');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas:', error);
      }
    });
  }

  // ==================== FILTROS Y BÚSQUEDA ====================
  aplicarFiltros() {
    console.log('🔍 Aplicando filtros...');
    console.log('   Término búsqueda:', this.terminoBusqueda);
    console.log('   Total pedidos:', this.pedidos.length);

    let resultados = [...this.pedidos];

    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultados = resultados.filter(pedido =>
        pedido.nombre_cliente?.toLowerCase().includes(termino) ||
        pedido.telefono_cliente?.toLowerCase().includes(termino) ||
        pedido.id.toString().includes(termino)
      );
      console.log('   Después de búsqueda:', resultados.length);
    }

    this.pedidosFiltrados = resultados;
    this.paginaActual = 1;
    this.actualizarPaginacion();

    console.log('✅ Filtros aplicados. Resultados:', this.pedidosFiltrados.length);
  }

  cambiarFiltroEstado(estado: typeof this.filtroEstado) {
    console.log('🔄 Cambiando filtro de estado a:', estado);
    this.filtroEstado = estado;
    this.paginaActual = 1;
    this.cargarPedidos();
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  // ==================== PAGINACIÓN ====================
  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.pedidosPaginados = this.pedidosFiltrados.slice(inicio, fin);

    console.log('📄 Paginación actualizada:');
    console.log('   Página:', this.paginaActual);
    console.log('   Items por página:', this.itemsPorPagina);
    console.log('   Mostrando:', this.pedidosPaginados.length, 'pedidos');
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

  // ==================== ACCIONES ====================
  verDetalle(pedido: Pedido) {
    console.log('👁️ Viendo detalle del pedido:', pedido.id);

    this.pedidosService.obtenerDetallePedido(pedido.id).subscribe({
      next: (response) => {
        console.log('✅ Respuesta detalle pedido:', response);

        if (response.success && response.data) {
          this.pedidoSeleccionado = response.data;
          console.log('✅ Detalle cargado:', this.pedidoSeleccionado);
          console.log('   └─ Items:', this.pedidoSeleccionado.items);

          this.mostrarModal = true;
          this.mostrarOpcionesEstado = false;
          this.menuEstadoAbierto = null;
        } else {
          console.error('❌ Respuesta sin datos de detalle');
          this.mostrarMensaje('error', 'No se pudo cargar el detalle del pedido');
        }
      },
      error: (error) => {
        console.error('❌ Error obteniendo detalle:', error);
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

  actualizarEstado(pedidoId: number, nuevoEstado: Pedido['estado']) {
    console.log('🔄 Actualizando estado:', { pedidoId, nuevoEstado });

    this.actualizando = true;
    this.mostrarOpcionesEstado = false;
    this.menuEstadoAbierto = null;

    this.pedidosService.actualizarEstado(pedidoId, nuevoEstado).subscribe({
      next: (response) => {
        console.log('✅ Respuesta actualización estado:', response);

        if (response.success) {
          this.mostrarMensaje('success', 'Estado actualizado correctamente');
          this.cargarPedidos();
          this.cargarEstadisticas();

          if (this.pedidoSeleccionado && this.pedidoSeleccionado.id === pedidoId) {
            this.pedidoSeleccionado.estado = nuevoEstado;
          }
          console.log('✅ Estado actualizado exitosamente');
        } else {
          console.error('❌ Actualización falló:', response.mensaje);
          this.mostrarMensaje('error', response.mensaje || 'Error al actualizar el estado');
        }
        this.actualizando = false;
      },
      error: (error) => {
        console.error('❌ Error actualizando estado:', error);
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

  // ==================== UTILIDADES ====================
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
    console.log(`💬 Mensaje [${tipo}]:`, texto);
    this.mensaje = { mostrar: true, tipo, texto };
    setTimeout(() => {
      this.mensaje.mostrar = false;
    }, 5000);
  }

  cerrarMensaje() {
    this.mensaje.mostrar = false;
  }
}
