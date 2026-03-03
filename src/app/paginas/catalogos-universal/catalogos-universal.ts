// catalogos-universal.component.ts
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Catalogos, CatalogoItem, Categoria } from '../../core/servicios/catalogos/catalogos';
import { Autenticacion } from '../../core/servicios/autenticacion/autenticacion';
import { Fotos } from '../../core/servicios/fotos/fotos';
import { SidebarComponent } from '../../componentes/aside/aside';
import { catalogo } from '../../componentes-catalogo/catalogo/catalogo';
import { HeaderCatalogo } from '../../componentes-catalogo/header-catalogo/header-catalogo';
import { ModalSeleccionTipo } from '../../componentes-catalogo/modal-seleccion-tipo/modal-seleccion-tipo';
import { ModalAgregar } from '../../componentes-catalogo/modal-agregar/modal-agregar';
import { ModalCategorias } from '../../componentes-catalogo/modal-categorias/modal-categorias';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-catalogos-universal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    HeaderCatalogo,
    catalogo,
    ModalSeleccionTipo,
    ModalAgregar,
    ModalCategorias   // ✅ NUEVO
  ],
  templateUrl: './catalogos-universal.html',
  styleUrl: './catalogos-universal.css',
})
export class CatalogosUniversal implements OnInit, OnDestroy {
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

  items: CatalogoItem[] = [];
  itemsFiltrados: CatalogoItem[] = [];

  // ✅ categoriasEnUso son objetos Categoria[], para el modal y el header
  categoriasEnUso: Categoria[] = [];

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
  itemsPaginados: CatalogoItem[] = [];

  mostrarModalSeleccionTipo = false;
  mostrarModal = false;
  modoEdicion = false;
  // ✅ NUEVO
  mostrarModalCategorias = false;

  itemActual: Partial<CatalogoItem> = {
    nombre_item: '',
    descripcion: '',
    precio: null,
    tipo_item: 'producto',
    imagen_url: '',
    stock: null,
    disponible: true,
    duracion_minutos: null,
    requiere_agendamiento: false,
    categoria_id: null,
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
    private catalogoService: Catalogos,
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
      tipo: this.usuarioActual?.empresa?.tipo || 'Empresa',
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
  handleNavigation(route: string) { this.currentRoute = route; }
  handleLogout() { this.authService.logout(); }

  // ==================== CATEGORÍAS ====================
  cargarCategorias() {
    this.cargandoCategorias = true;
    this.catalogoService.obtenerCategorias().subscribe({
      next: (response: any) => {
        if (response.success && Array.isArray(response.data)) {
          this.categoriasEnUso = response.data;
        }
        this.cargandoCategorias = false;
      },
      error: () => { this.cargandoCategorias = false; }
    });
  }

  // ✅ NUEVO: abrir/cerrar modal de categorías
  abrirModalCategorias() { this.mostrarModalCategorias = true; }
  cerrarModalCategorias() {
    this.mostrarModalCategorias = false;
    // Recargar categorías después de gestionar
    this.cargarCategorias();
  }

  // ==================== CARGAR DATOS ====================
  cargarCatalogo() {
    this.cargando = true;

    const params: any = {};
    if (this.filtroTipo !== 'todos') params.tipo_item = this.filtroTipo;
    if (this.filtroCategoria !== 'todas') params.categoria_id = this.filtroCategoria;
    if (this.filtroDisponible !== 'todos') params.disponible = this.filtroDisponible === 'disponible';
    if (this.ordenamiento) params.orden = this.ordenamiento;

    this.catalogoService.obtenerCatalogo(params).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.items = response.data;
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
    this.catalogoService.obtenerEstadisticas().subscribe({
      next: (response) => { if (response.success) this.estadisticas = response.data; },
      error: () => {}
    });
  }

  // ==================== FILTROS ====================
  aplicarFiltros() {
    let resultados = [...this.items];
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultados = resultados.filter(item =>
        item.nombre_item.toLowerCase().includes(termino) ||
        item.descripcion?.toLowerCase().includes(termino) ||
        item.tags?.toLowerCase().includes(termino)
      );
    }
    this.itemsFiltrados = resultados;
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  buscar() {
    if (!this.terminoBusqueda.trim()) {
      this.itemsFiltrados = [...this.items];
      this.paginaActual = 1;
      this.actualizarPaginacion();
      return;
    }
    const params: any = {};
    if (this.filtroTipo !== 'todos') params.tipo_item = this.filtroTipo;
    if (this.filtroCategoria !== 'todas') params.categoria_id = this.filtroCategoria;

    this.catalogoService.buscarItems(this.terminoBusqueda, params).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.itemsFiltrados = response.data;
          this.paginaActual = 1;
          this.actualizarPaginacion();
        }
      },
      error: () => {}
    });
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
  mostrarModalTipo() { this.mostrarModalSeleccionTipo = true; }
  cerrarModalTipo() { this.mostrarModalSeleccionTipo = false; }

  seleccionarTipo(tipo: 'producto' | 'servicio') {
    this.cerrarModalTipo();
    this.abrirModalNuevoConTipo(tipo);
  }

  abrirModalNuevoConTipo(tipo: 'producto' | 'servicio') {
    this.modoEdicion = false;
    this.itemActual = {
      nombre_item: '',
      descripcion: '',
      precio: null,
      tipo_item: tipo,
      imagen_url: '',
      stock: tipo === 'producto' ? 0 : null,
      disponible: true,
      duracion_minutos: tipo === 'servicio' ? 30 : null,
      requiere_agendamiento: tipo === 'servicio',
      categoria_id: null,
      tags: ''
    };
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.imagenAnterior = null;
    this.mostrarModal = true;
  }

  abrirModalEditar(item: CatalogoItem) {
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
      nombre_item: '', descripcion: '', precio: null, tipo_item: 'producto',
      imagen_url: '', stock: null, disponible: true, duracion_minutos: null,
      requiere_agendamiento: false, categoria_id: null, tags: ''
    };
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.imagenAnterior = null;
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

  async guardarItem() {
    if (!this.itemActual.nombre_item?.trim()) {
      this.mostrarMensaje('error', 'El nombre del item es requerido');
      return;
    }

    this.guardando = true;

    try {
      if (this.imagenSeleccionada) {
        const imageUrl = await this.subirImagen();
        if (imageUrl) this.itemActual.imagen_url = imageUrl;
      }

      if (this.modoEdicion && this.itemActual.id) {
        this.catalogoService.actualizarItem(this.itemActual.id, this.itemActual).subscribe({
          next: (response) => {
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
        this.catalogoService.crearItem(this.itemActual as any).subscribe({
          next: (response) => {
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

  eliminarItem(item: CatalogoItem) {
    if (!confirm(`¿Está seguro de eliminar "${item.nombre_item}"?`)) return;
    if (!item.id) return;

    this.catalogoService.eliminarItem(item.id).subscribe({
      next: (response) => {
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
