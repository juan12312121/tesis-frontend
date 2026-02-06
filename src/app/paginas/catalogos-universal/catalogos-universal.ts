// catalogos-universal-final.component.ts
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Catalogos, CatalogoItem } from '../../core/servicios/catalogos/catalogos';
import { Autenticacion } from '../../core/servicios/autenticacion/autenticacion';
import { Fotos } from '../../core/servicios/fotos/fotos';
import { SidebarComponent } from '../../componentes/aside/aside';
import { catalogo } from '../../componentes-catalogo/catalogo/catalogo';
import { HeaderCatalogo } from '../../componentes-catalogo/header-catalogo/header-catalogo';
import { ModalSeleccionTipo } from '../../componentes-catalogo/modal-seleccion-tipo/modal-seleccion-tipo';
import { ModalAgregar } from '../../componentes-catalogo/modal-agregar/modal-agregar';
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
    ModalAgregar
  ],
  templateUrl: './catalogos-universal.html',
  styleUrl: './catalogos-universal.css',
})
export class CatalogosUniversal implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ==================== CONFIGURACIÓN DE TIPOS ====================
  // Se leen desde localStorage - configurar en /configuracion/:id
  productosHabilitados = true;
  serviciosHabilitados = true;

  // Subscription para detectar cambios de ruta
  private routerSubscription?: Subscription;

  // ==================== SIDEBAR DATA ====================
  sidebarOpen = true;
  empresa: any = null;
  usuario: any = null;
  currentRoute = 'catalogo';

  // Datos del usuario
  empresaId: string = '';
  usuarioActual: any = null;

  // Lista de items
  items: CatalogoItem[] = [];
  itemsFiltrados: CatalogoItem[] = [];

  // Categorías
  categoriasDisponibles: string[] = [];
  categoriasEnUso: any[] = [];
  mostrarModalCategoria = false;
  nuevaCategoria = '';

  // Estadísticas
  estadisticas: any = null;

  // Estados de carga
  cargando = false;
  guardando = false;
  subiendoImagen = false;
  cargandoCategorias = false;

  // Filtros y búsqueda
  terminoBusqueda = '';
  filtroTipo: 'todos' | 'producto' | 'servicio' = 'todos';
  filtroCategoria: string = 'todas';
  filtroDisponible: 'todos' | 'disponible' | 'no_disponible' = 'todos';
  ordenamiento: 'nombre' | 'precio' | 'fecha' | 'categoria' = 'fecha';

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 12;
  itemsPaginados: CatalogoItem[] = [];

  // Modales
  mostrarModalSeleccionTipo = false;
  mostrarModal = false;
  modoEdicion = false;
  itemActual: Partial<CatalogoItem> = {
    nombre_item: '',
    descripcion: '',
    precio: null,
    tipo_item: 'producto',
    imagen_url: '',
    stock: null,
    sku: '',
    disponible: true,
    duracion_minutos: null,
    requiere_agendamiento: false,
    categoria: null,
    tags: '',
    notas_adicionales: ''
  };

  // Manejo de imágenes
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  imagenAnterior: string | null = null;

  // Mensajes
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
    console.log('🏗️ CONSTRUCTOR - Componente CatalogosUniversal creado');

    // ==================== SUSCRIBIRSE A CAMBIOS DE RUTA ====================
    // Esto recarga la configuración cuando vuelves de /configuracion
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        console.log('🔄 NAVEGACIÓN DETECTADA:', event.url);

        // Solo recargar si estamos en la ruta de catálogo Y tenemos empresaId
        if (this.router.url.includes('catalogos') && this.empresaId) {
          console.log('📂 Ruta contiene "catalogos" y tenemos empresaId - Recargando configuración...');
          this.cargarConfiguracionTipos();
        } else {
          console.log('❌ No se recarga - URL:', this.router.url, 'empresaId:', this.empresaId);
        }
      });
  }

  ngOnInit() {
    console.log('🚀 ngOnInit - Inicializando componente');

    this.empresaId = this.route.snapshot.paramMap.get('id') || '';
    console.log('🏢 Empresa ID obtenido:', this.empresaId);

    this.usuarioActual = this.authService.getUsuario();
    this.usuario = this.usuarioActual;

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
      console.log('❌ Usuario NO autenticado - Redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }

    const empresaIdUsuario = this.authService.getEmpresaId();
    console.log('🔐 Validando permisos - Usuario empresa:', empresaIdUsuario, 'vs Ruta empresa:', this.empresaId);

    if (this.empresaId !== empresaIdUsuario) {
      console.log('⛔ SIN PERMISOS - Usuario no tiene acceso a esta empresa');
      this.mostrarMensaje('error', 'No tiene permisos para acceder a este catálogo');
      this.router.navigate(['/dashboard', empresaIdUsuario]);
      return;
    }

    console.log('✅ Permisos validados - Iniciando carga de datos');

    // Cargar configuración de tipos habilitados desde la empresa
    this.cargarConfiguracionTipos();

    this.cargarCategorias();
    this.cargarCatalogo();
    this.cargarEstadisticas();
  }

  ngOnDestroy() {
    console.log('💀 ngOnDestroy - Destruyendo componente');

    // Limpiar suscripción al destruir el componente
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      console.log('✅ Suscripción de router limpiada');
    }
  }

  // ==================== CONFIGURACIÓN DE TIPOS ====================
  cargarConfiguracionTipos() {
    console.log('⚙️ ========================================');
    console.log('⚙️ CARGANDO CONFIGURACIÓN DE TIPOS');
    console.log('⚙️ ========================================');
    console.log('🔑 Key de localStorage:', `config_${this.empresaId}`);

    // Cargar configuración desde localStorage
    const config = localStorage.getItem(`config_${this.empresaId}`);

    console.log('📦 Valor RAW de localStorage:', config);

    if (config) {
      try {
        const parsed = JSON.parse(config);
        console.log('📋 Config parseada:', parsed);

        this.productosHabilitados = parsed.productos ?? true;
        this.serviciosHabilitados = parsed.servicios ?? true;

        console.log('✅ ========================================');
        console.log('✅ CONFIGURACIÓN CARGADA EXITOSAMENTE');
        console.log('✅ ========================================');
        console.log('📦 Productos habilitados:', this.productosHabilitados ? '✅ SÍ' : '❌ NO');
        console.log('⚙️  Servicios habilitados:', this.serviciosHabilitados ? '✅ SÍ' : '❌ NO');
        console.log('✅ ========================================');

      } catch (error) {
        console.error('❌ ERROR al parsear configuración:', error);
        console.log('⚠️  Usando valores por defecto (ambos habilitados)');
      }
    } else {
      console.log('⚠️ ========================================');
      console.log('⚠️  NO SE ENCONTRÓ CONFIGURACIÓN');
      console.log('⚠️ ========================================');
      console.log('📝 Usando valores por defecto:');
      console.log('   - Productos: ✅ habilitados');
      console.log('   - Servicios: ✅ habilitados');
      console.log('⚠️ ========================================');
    }

    // Log adicional para verificar el estado final
    console.log('🎯 Estado final del componente:');
    console.log('   productosHabilitados =', this.productosHabilitados);
    console.log('   serviciosHabilitados =', this.serviciosHabilitados);
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

  // ==================== CATEGORÍAS ====================
  cargarCategorias() {
    this.cargandoCategorias = true;

    this.catalogoService.obtenerCategoriasDisponibles().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.categoriasDisponibles = response.data.filter((item: any) => typeof item === 'string');
        }
      },
      error: (error) => {
        console.error('Error al cargar categorías disponibles:', error);
      }
    });

    this.catalogoService.obtenerCategoriasEnUso().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.categoriasEnUso = response.data;
        }
        this.cargandoCategorias = false;
      },
      error: (error) => {
        console.error('Error al cargar categorías en uso:', error);
        this.cargandoCategorias = false;
      }
    });
  }

  // ==================== CARGAR DATOS ====================
  cargarCatalogo() {
    console.log('📚 Cargando catálogo...');
    this.cargando = true;

    const params: any = {};

    if (this.filtroTipo !== 'todos') {
      params.tipo_item = this.filtroTipo;
    }

    if (this.filtroCategoria !== 'todas') {
      params.categoria = this.filtroCategoria;
    }

    if (this.filtroDisponible !== 'todos') {
      params.disponible = this.filtroDisponible === 'disponible';
    }

    if (this.ordenamiento) {
      params.orden = this.ordenamiento;
    }

    this.catalogoService.obtenerCatalogo(params).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.items = response.data;
          console.log(`✅ Catálogo cargado: ${this.items.length} items totales`);

          // Log de tipos de items
          const productos = this.items.filter(i => i.tipo_item === 'producto').length;
          const servicios = this.items.filter(i => i.tipo_item === 'servicio').length;
          console.log(`   📦 Productos: ${productos}`);
          console.log(`   ⚙️  Servicios: ${servicios}`);

          this.aplicarFiltros();
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar catálogo:', error);
        this.mostrarMensaje('error', 'Error al cargar el catálogo');
        this.cargando = false;
      }
    });
  }

  cargarEstadisticas() {
    this.catalogoService.obtenerEstadisticas().subscribe({
      next: (response) => {
        if (response.success) {
          this.estadisticas = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  // ==================== FILTROS Y BÚSQUEDA ====================
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
    console.log(`🔍 Filtros aplicados: ${this.itemsFiltrados.length} items filtrados`);

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
    if (this.filtroTipo !== 'todos') {
      params.tipo_item = this.filtroTipo;
    }
    if (this.filtroCategoria !== 'todas') {
      params.categoria = this.filtroCategoria;
    }

    this.catalogoService.buscarItems(this.terminoBusqueda, params).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.itemsFiltrados = response.data;
          this.paginaActual = 1;
          this.actualizarPaginacion();
        }
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
      }
    });
  }

  cambiarFiltroTipo(tipo: 'todos' | 'producto' | 'servicio') {
    console.log('🔀 Cambiando filtro de tipo a:', tipo);
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
    const fin = inicio + this.itemsPorPagina;
    this.itemsPaginados = this.itemsFiltrados.slice(inicio, fin);

    console.log(`📄 Paginación actualizada: Mostrando items ${inicio + 1}-${Math.min(fin, this.itemsFiltrados.length)} de ${this.itemsFiltrados.length}`);
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

  // ==================== MODAL DE SELECCIÓN DE TIPO ====================
  mostrarModalTipo() {
    console.log('🎯 Abriendo modal de selección de tipo');
    console.log('   Productos habilitados:', this.productosHabilitados);
    console.log('   Servicios habilitados:', this.serviciosHabilitados);
    this.mostrarModalSeleccionTipo = true;
  }

  cerrarModalTipo() {
    this.mostrarModalSeleccionTipo = false;
  }

  seleccionarTipo(tipo: 'producto' | 'servicio') {
    console.log('✅ Tipo seleccionado:', tipo);
    this.cerrarModalTipo();
    this.abrirModalNuevoConTipo(tipo);
  }

  // ==================== CRUD OPERATIONS ====================
  abrirModalNuevoConTipo(tipo: 'producto' | 'servicio') {
    this.modoEdicion = false;
    this.itemActual = {
      nombre_item: '',
      descripcion: '',
      precio: null,
      tipo_item: tipo,
      imagen_url: '',
      stock: tipo === 'producto' ? 0 : null,
      sku: '',
      disponible: true,
      duracion_minutos: tipo === 'servicio' ? 30 : null,
      requiere_agendamiento: tipo === 'servicio',
      categoria: null,
      tags: '',
      notas_adicionales: ''
    };
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.imagenAnterior = null;
    this.mostrarModal = true;
  }

  abrirModalEditar(item: CatalogoItem) {
    console.log('✏️ Editando item:', item.nombre_item, '- Tipo:', item.tipo_item);
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
      nombre_item: '',
      descripcion: '',
      precio: null,
      tipo_item: 'producto',
      imagen_url: '',
      stock: null,
      sku: '',
      disponible: true,
      duracion_minutos: null,
      requiere_agendamiento: false,
      categoria: null,
      tags: '',
      notas_adicionales: ''
    };
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.imagenAnterior = null;
  }

  // ==================== MANEJO DE IMÁGENES ====================
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
      .then(preview => {
        this.imagenPreview = preview;
      })
      .catch(error => {
        console.error('Error al crear vista previa:', error);
        this.mostrarMensaje('error', 'Error al procesar la imagen');
      });
  }

  eliminarImagenActual() {
    this.itemActual.imagen_url = '';
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
  }

  cancelarImagenNueva() {
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  abrirSelectorArchivo(): void {
    this.fileInput.nativeElement.click();
  }

  async subirImagen(): Promise<string | null> {
    if (!this.imagenSeleccionada) return null;

    this.subiendoImagen = true;

    try {
      const response = await this.fotosService.subirImagen(this.imagenSeleccionada).toPromise();

      if (response && response.success && response.data) {
        return response.data.url;
      } else {
        throw new Error(response?.message || 'Error al subir imagen');
      }

    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      throw error;
    } finally {
      this.subiendoImagen = false;
    }
  }

  async guardarItem() {
    const validacion = this.catalogoService.validarItem(this.itemActual);
    if (!validacion.valido) {
      this.mostrarMensaje('error', validacion.errores.join(', '));
      return;
    }

    this.guardando = true;

    try {
      if (this.imagenSeleccionada) {
        try {
          const imageUrl = await this.subirImagen();
          if (imageUrl) {
            this.itemActual.imagen_url = imageUrl;
          }
        } catch (error: any) {
          this.mostrarMensaje('error', 'Error al subir la imagen: ' + error.message);
          this.guardando = false;
          return;
        }
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
          error: (error) => {
            console.error('Error al actualizar:', error);
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
          error: (error) => {
            console.error('Error al crear:', error);
            this.mostrarMensaje('error', 'Error al crear el item');
            this.guardando = false;
          }
        });
      }

    } catch (error: any) {
      console.error('Error al guardar:', error);
      this.mostrarMensaje('error', 'Error al guardar el item');
      this.guardando = false;
    }
  }

  eliminarItem(item: CatalogoItem) {
    if (!confirm(`¿Está seguro de eliminar "${item.nombre_item}"?`)) {
      return;
    }

    if (!item.id) return;

    this.catalogoService.eliminarItem(item.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('success', 'Item eliminado exitosamente');
          this.cargarCatalogo();
          this.cargarEstadisticas();
        }
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        this.mostrarMensaje('error', 'Error al eliminar el item');
      }
    });
  }

  // ==================== UTILIDADES ====================
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
