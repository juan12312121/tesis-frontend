// catalogo-servicios.ts
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { CatalogoServiciosService, CatalogoServicio, CategoriaServicio } from '../../core/servicios/catalogo-servicios/catalogo-servicios';
import { Autenticacion } from '../../core/servicios/autenticacion/autenticacion';
import { Fotos } from '../../core/servicios/fotos/fotos';
import { SidebarComponent } from '../../componentes/aside/aside';
import { catalogo } from '../../componentes-catalogo/catalogo/catalogo';
import { HeaderCatalogo } from '../../componentes-catalogo/header-catalogo/header-catalogo';
import { ModalSeleccionTipo } from '../../componentes-catalogo/modal-seleccion-tipo/modal-seleccion-tipo';
import { ModalAgregar } from '../../componentes-catalogo/modal-agregar/modal-agregar';
import { ModalCategorias } from '../../componentes-catalogo/modal-categorias/modal-categorias';
import { ModalHorarios } from '../../componentes-catalogo/modal-horarios/modal-horarios';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-catalogo-servicios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    HeaderCatalogo,
    catalogo,
    ModalAgregar,
    ModalCategorias,
    ModalHorarios
  ],
  templateUrl: './catalogo-servicios.html',
  styleUrl: './catalogo-servicios.css',
})
export class CatalogoServiciosComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  productosHabilitados = true;
  serviciosHabilitados = true;

  private routerSubscription?: Subscription;

  sidebarOpen = true;
  empresa: any = null;
  usuario: any = null;
  currentRoute = 'catalogo';

  empresaId: string = '';
  usuarioActual: any = null;

  items: any[] = [];
  itemsFiltrados: any[] = [];

  //  categoriasEnUso son objetos CategoriaServicio[], para el modal y el header
  categoriasEnUso: any[] = [];

  estadisticas: any = null;

  cargando = false;
  guardando = false;
  subiendoImagen = false;
  cargandoCategorias = false;

  terminoBusqueda = '';
  filtroTipo: 'todos' | 'producto' | 'servicio' = 'todos';
  filtroCategoria: string = 'todas';
  filtroDisponible: 'todos' | 'disponible' | 'no_disponible' = 'todos';
  ordenamiento: 'nombre' | 'precio' | 'fecha' | 'categoria' = 'fecha';

  paginaActual = 1;
  itemsPorPagina = 12;
  itemsPaginados: any[] = [];

  mostrarModal = false;
  modoEdicion = false;
  mostrarModalCategorias = false;
  mostrarModalHorarios = false;
  servicioHorarioActivo: any = null;

  itemActual: any = {
    nombre_item: '',
    descripcion: '',
    precio: undefined,
    imagen_url: '',
    disponible: true,
    duracion_minutos: undefined,
    requiere_agendamiento: true,
    categoria_id: undefined,
    tipo_item: 'servicio',
    tags: ''
  };

  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  imagenAnterior: string | null = null;

  mensaje = {
    mostrar: false,
    tipo: 'success' as 'success' | 'error',
    texto: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogoService: CatalogoServiciosService,
    private authService: Autenticacion,
    private fotosService: Fotos
  ) {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.router.url.includes('catalogos') && this.empresaId) {
          this.cargarConfiguracionTipos();
        }
      });
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
      this.mostrarMensaje('error', 'No tiene permisos para acceder a este catálogo');
      this.router.navigate(['/dashboard', empresaIdUsuario]);
      return;
    }

    this.cargarConfiguracionTipos();
    this.cargarCategorias();
    this.cargarCatalogo();
    this.cargarEstadisticas();
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  /**
   * Lee la configuracion local almacenada para determinar si los
   * productos y servicios estan habilitados en la vista actual.
   */
  cargarConfiguracionTipos() {
    const config = localStorage.getItem(`config_${this.empresaId}`);
    if (config) {
      try {
        const parsed = JSON.parse(config);
        this.productosHabilitados = parsed.productos ?? true;
        this.serviciosHabilitados = parsed.servicios ?? true;
      } catch (error) {
        console.error('Error al parsear configuración:', error);
      }
    }
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  handleNavigation(route: string) { 
    this.currentRoute = route; 
    if (window.innerWidth < 1024) this.sidebarOpen = false;
  }
  handleLogout() { this.authService.logout(); }

  // ==================== CATEGORIAS ====================
  /**
   * Obtiene la lista completa de categorias disponibles para el catalogo.
   * Actualiza el listado en de categorias en uso para filtrar y mostrar en modales.
   */
  cargarCategorias() {
    this.cargandoCategorias = true;
    this.catalogoService.obtenerCategorias(this.empresaId).subscribe({
      next: (response: any) => {
        if (response.success && Array.isArray(response.data)) {
          this.categoriasEnUso = response.data;
        }
        this.cargandoCategorias = false;
      },
      error: () => { this.cargandoCategorias = false; }
    });
  }

  //  NUEVO: abrir/cerrar modal de categorías
  abrirModalCategorias() { this.mostrarModalCategorias = true; }
  cerrarModalCategorias() {
    this.mostrarModalCategorias = false;
    // Recargar categorías después de gestionar
    this.cargarCategorias();
  }

  // ==================== CARGAR DATOS ====================
  /**
   * Solicita al servicio los items del catalogo base.
   * Aplica filtros activos (tipo, categoria, disponibilidad) y ordenamiento.
   */
  cargarCatalogo() {
    this.cargando = true;

    this.catalogoService.obtenerServicios(this.empresaId).subscribe({
      next: (response: any) => {
        if (response.success && Array.isArray(response.data)) {
          // Mapeamos 'nombre' que viene del backend a 'nombre_item' esperado por UI compartida
          this.items = response.data.map((i: any) => ({
            ...i,
            nombre_item: i.nombre,
            tipo_item: 'servicio' // Flag para los modales
          }));
          this.aplicarFiltros();
        }
        this.cargando = false;
      },
      error: () => {
        this.mostrarMensaje('error', 'Error al cargar el catálogo');
        this.cargando = false;
      }
    });
  }

  cargarEstadisticas() {
    // Pendiente endpoint en el backend para servicios
  }

  // ==================== FILTROS ====================
  aplicarFiltros() {
    let resultados = [...this.items];
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultados = resultados.filter(item =>
        item.nombre_item?.toLowerCase().includes(termino) ||
        item.descripcion?.toLowerCase().includes(termino) ||
        item.tags?.toLowerCase().includes(termino)
      );
    }
    this.itemsFiltrados = resultados;
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  /**
   * Ejecuta la busqueda de items segun un termino introducido.
   * Si el termino esta vacio, restablece los filtros previos.
   */
  buscar() {
    if (!this.terminoBusqueda.trim()) {
      this.itemsFiltrados = [...this.items];
      this.paginaActual = 1;
      this.actualizarPaginacion();
      return;
    }
    this.aplicarFiltros();
  }

  cambiarFiltroTipo(tipo: 'todos' | 'producto' | 'servicio') {
    this.filtroTipo = tipo;
    this.paginaActual = 1;
    this.cargarCatalogo();
  }

  cambiarFiltroCategoria(categoria: string) {
    this.filtroCategoria = categoria;
    this.paginaActual = 1;
    this.cargarCatalogo();
  }

  cambiarFiltroDisponible(disponible: 'todos' | 'disponible' | 'no_disponible') {
    this.filtroDisponible = disponible;
    this.paginaActual = 1;
    this.cargarCatalogo();
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  // ==================== PAGINACIÓN ====================
  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    this.itemsPaginados = this.itemsFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.itemsFiltrados.length / this.itemsPorPagina);
  }

  get rangoItems(): string {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.itemsPorPagina, this.itemsFiltrados.length);
    return `${inicio}-${fin} de ${this.itemsFiltrados.length}`;
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ==================== MODALES ====================
  mostrarModalTipo() { 
    this.abrirModalNuevo(); 
  }

  abrirModalNuevo() {
    this.modoEdicion = false;
    this.itemActual = {
      empresa_id: parseInt(this.empresaId),
      nombre_item: '',
      descripcion: '',
      precio: undefined,
      imagen_url: '',
      disponible: true,
      duracion_minutos: undefined,
      requiere_agendamiento: true,
      categoria_id: undefined,
      tipo_item: 'servicio',
      tags: ''
    };
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.imagenAnterior = null;
    this.mostrarModal = true;
  }

  abrirModalEditar(item: any) {
    this.modoEdicion = true;
    this.itemActual = { ...item };
    this.imagenAnterior = item.imagen_url || null;
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.itemActual = {
      nombre_item: '', descripcion: '', precio: undefined,
      imagen_url: '', disponible: true, duracion_minutos: undefined,
      requiere_agendamiento: true, categoria_id: undefined, tipo_item: 'servicio', tags: ''
    };
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.imagenAnterior = null;
  }

  abrirModalHorarios(item: any) {
    this.servicioHorarioActivo = item;
    this.mostrarModalHorarios = true;
  }

  cerrarModalHorarios() {
    this.mostrarModalHorarios = false;
    this.servicioHorarioActivo = null;
  }

  // ==================== IMÁGENES ====================
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const validacion = this.fotosService.validarImagen(file);
    if (!validacion.valid) {
      this.mostrarMensaje('error', validacion.error || 'Archivo no válido');
      return;
    }
    this.imagenSeleccionada = file;
    this.fotosService.crearVistaPrevia(file)
      .then(preview => { this.imagenPreview = preview; })
      .catch(() => this.mostrarMensaje('error', 'Error al procesar la imagen'));
  }

  eliminarImagenActual() {
    this.itemActual.imagen_url = '';
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
  }

  cancelarImagenNueva() {
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  abrirSelectorArchivo(): void { this.fileInput.nativeElement.click(); }

  /**
   * Procesa y envia la imagen seleccionada al servidor a traves del servicio de fotos.
   * @returns La ruta o URL de la imagen subida, o nulo si no hay imagen.
   */
  async subirImagen(): Promise<string | null> {
    if (!this.imagenSeleccionada) return null;
    this.subiendoImagen = true;
    try {
      const response = await this.fotosService.subirImagen(this.imagenSeleccionada).toPromise();
      if (response?.success && response.data) return response.data.url;
      throw new Error(response?.message || 'Error al subir imagen');
    } finally {
      this.subiendoImagen = false;
    }
  }

  /**
   * Evalua si se debe crear o actualizar un item en el sistema.
   * Contempla la subida de una nueva imagen de ser necesario antes de
   * persistir los datos finales mediante el servicio.
   */
  async guardarItem() {
    if (!this.itemActual.nombre_item?.trim()) {
      this.mostrarMensaje('error', 'El nombre del servicio es requerido');
      return;
    }

    this.guardando = true;

    // Convertir nombre_item intermedio a 'nombre'
    const payload = {
      ...this.itemActual,
      nombre: this.itemActual.nombre_item
    };
    delete payload.nombre_item;
    delete payload.tipo_item;

    try {
      if (this.imagenSeleccionada) {
        const imageUrl = await this.subirImagen();
        if (imageUrl) this.itemActual.imagen_url = imageUrl;
      }

      if (this.modoEdicion && this.itemActual.id) {
        this.catalogoService.actualizarServicio(this.itemActual.id, payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.mostrarMensaje('success', 'Item actualizado exitosamente');
              this.cargarCatalogo();
              this.cargarEstadisticas();
              this.cerrarModal();
            }
            this.guardando = false;
          },
          error: () => {
            this.mostrarMensaje('error', 'Error al actualizar el item');
            this.guardando = false;
          }
        });
      } else {
        payload.empresa_id = parseInt(this.empresaId);
        this.catalogoService.crearServicio(payload).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.mostrarMensaje('success', 'Item creado exitosamente');
              this.cargarCatalogo();
              this.cargarEstadisticas();
              this.cerrarModal();
            }
            this.guardando = false;
          },
          error: () => {
            this.mostrarMensaje('error', 'Error al crear el item');
            this.guardando = false;
          }
        });
      }
    } catch (error: any) {
      this.mostrarMensaje('error', 'Error al guardar el item');
      this.guardando = false;
    }
  }

  eliminarItem(item: any) {
    if (!confirm(`¿Está seguro de eliminar "${item.nombre_item}"?`)) return;
    if (!item.id) return;

    this.catalogoService.eliminarServicio(item.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.mostrarMensaje('success', 'Item eliminado exitosamente');
          this.cargarCatalogo();
          this.cargarEstadisticas();
        }
      },
      error: () => { this.mostrarMensaje('error', 'Error al eliminar el item'); }
    });
  }

  mostrarMensaje(tipo: 'success' | 'error', texto: string) {
    this.mensaje = { mostrar: true, tipo, texto };
    setTimeout(() => { this.mensaje.mostrar = false; }, 5000);
  }

  cerrarMensaje() { this.mensaje.mostrar = false; }
}
