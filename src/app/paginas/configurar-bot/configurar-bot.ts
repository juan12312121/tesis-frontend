import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../componentes/aside/aside';
import { Horarios } from '../../componentes/configuracion-bot/horarios/horarios';
import { Mensajes, RespuestaAutomatica } from '../../componentes/configuracion-bot/mensajes/mensajes';
import { ModalHorarios } from '../../componentes/configuracion-bot/modal-horarios/modal-horarios';
import { ModalMensajes } from '../../componentes/configuracion-bot/modal-mensajes/modal-mensajes';
import { ChatbotService, ConfiguracionChatbot } from '../../core/servicios/configuracion/configuracion'; //  IMPORTAR SERVICIO
import { Autenticacion } from '../../core/servicios/autenticacion/autenticacion';

@Component({
  selector: 'app-configurar-bot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    Horarios,
    Mensajes,
    ModalHorarios,
    ModalMensajes
  ],
  templateUrl: './configurar-bot.html'
})
export class ConfigurarBotComponent implements OnInit {
  private router = inject(Router);
  private chatbotService = inject(ChatbotService); //  INYECTAR SERVICIO
  private authService = inject(Autenticacion);

  // Estado general
  isLoading = true;
  sidebarOpen = true;
  activeTab: 'horarios' | 'respuestas' = 'horarios';
  currentRoute = 'chatbot';

  // Mensajes
  successMessage = '';
  errorMessage = '';

  // Usuario y empresa
  empresa: any = {};
  usuario: any = {};
  empresaId: string = '';

  // Configuración del bot
  configuracion: ConfiguracionChatbot = {
    empresa_id: 0,
    mensaje_bienvenida: '',
    mensaje_fuera_horario: '',
    horario_inicio: '09:00',
    horario_fin: '18:00',
    dias_laborales: [],
    activo: true
  };
  hasConfiguration = false;

  // Estados
  isSaving = false;

  // Días de la semana - Inicializar correctamente
  diasSemana: any[] = [];

  // Respuestas automáticas
  respuestas: RespuestaAutomatica[] = [];
  filteredRespuestas: RespuestaAutomatica[] = [];
  loadingRespuestas = false;
  searchTerm = '';

  // Modales
  showModalHorarios = false;
  showModalRespuesta = false;
  editingRespuesta: RespuestaAutomatica | null = null;

  ngOnInit() {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      this.sidebarOpen = true;
    }

    //  Inicializar días de la semana desde el servicio
    this.inicializarDiasSemana();

    this.loadData();
  }

  //  Inicializar días desde el servicio
  private inicializarDiasSemana() {
    const diasCompletos = this.chatbotService.obtenerDiasSemana();
    this.diasSemana = diasCompletos.map(dia => ({
      id: dia.id,
      nombre: dia.nombre,
      nombreCorto: dia.nombreCorto,
      activo: false
    }));
  }

  /**
   * Inicializa la vista cargando el ID de la empresa, y luego realiza
   * peticiones al servidor para obtener la configuracion actual del chatbot
   * y sus respuestas predefinidas.
   */
  async loadData() {
    try {
      this.isLoading = true;

      this.empresaId = this.obtenerEmpresaId();
      const usuarioActual = this.authService.getUsuario();

      // Cargar datos de empresa y usuario (estos podrías también obtenerlos de un servicio)
      this.empresa = {
        id: this.empresaId,
        nombre: usuarioActual?.empresa?.nombre || 'Mi Empresa',
        tipo: usuarioActual?.empresa?.tipo_negocio || 'ambos',
        logo: null,
        modulos: usuarioActual?.empresa?.modulos || {
          pedidos: true,
          reservas: true,
          catalogo: true
        }
      };

      this.usuario = usuarioActual || {
        id: '1',
        nombre: 'Usuario',
        email: 'usuario@example.com',
        rol: 'Administrador'
      };

      //  CARGAR CONFIGURACIÓN REAL
      await this.cargarConfiguracion();

      //  CARGAR RESPUESTAS REALES
      await this.cargarRespuestas();

    } catch (error) {
      console.error('Error cargando datos:', error);
      this.errorMessage = 'Error al cargar la configuración';
      setTimeout(() => this.errorMessage = '', 5000);
    } finally {
      this.isLoading = false;
    }
  }

  private obtenerEmpresaId(): string {
    // 1. Intentar desde la URL
    const url = window.location.pathname;
    const match = url.match(/\/dashboard\/(\d+)/);
    if (match) return match[1];

    // 2. Intentar desde localStorage
    const empresaGuardada = localStorage.getItem('empresa_id');
    if (empresaGuardada) return empresaGuardada;

    // 3. Intentar desde el token/usuario guardado
    const userData = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.empresa_id?.toString() || '';
    }

    return '';
  }

  // ========================================
  // CONFIGURACION GENERAL DEL CHATBOT
  // ========================================

  /**
   * Obtiene la configuracion del chatbot vinculada a la empresa actual.
   * Si existe, actualiza los controles de la interfaz; si no, inicializa 
   * una configuracion por defecto.
   */
  async cargarConfiguracion() {
    try {
      const response = await this.chatbotService
        .obtenerConfiguracion(this.empresaId)
        .toPromise();

      if (response?.success && response.data) {
        this.configuracion = response.data;
        this.hasConfiguration = true;

        // Actualizar estado de días laborales
        this.actualizarEstadoDias();

        console.log(' Configuración cargada:', this.configuracion);
      } else {
        this.hasConfiguration = false;
        this.resetConfiguracion();
        console.log('ℹ️ No hay configuración existente');
      }
    } catch (error: any) {
      console.log('ℹ️ No hay configuración (404 esperado):', error);
      this.hasConfiguration = false;
      this.resetConfiguracion();
    }
  }

  private resetConfiguracion() {
    this.configuracion = {
      empresa_id: parseInt(this.empresaId),
      mensaje_bienvenida: '',
      mensaje_fuera_horario: '',
      horario_inicio: '09:00',
      horario_fin: '18:00',
      dias_laborales: [],
      activo: true
    };
    this.diasSemana.forEach(dia => dia.activo = false);
  }

  private actualizarEstadoDias() {
    this.diasSemana.forEach(dia => {
      dia.activo = this.configuracion.dias_laborales.includes(dia.id);
    });
  }

  //  CARGAR RESPUESTAS DESDE EL BACKEND
  async cargarRespuestas() {
    this.loadingRespuestas = true;
    try {
      const response = await this.chatbotService
        .obtenerRespuestas(this.empresaId)
        .toPromise();

      if (response?.success && response.data) {
        this.respuestas = response.data;
        this.filteredRespuestas = this.respuestas;
        console.log(' Respuestas cargadas:', this.respuestas.length);
      } else {
        this.respuestas = [];
        this.filteredRespuestas = [];
      }
    } catch (error) {
      console.error('Error cargando respuestas:', error);
      this.respuestas = [];
      this.filteredRespuestas = [];
    } finally {
      this.loadingRespuestas = false;
    }
  }

  // Navegación y UI
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setActiveTab(tab: 'horarios' | 'respuestas') {
    this.activeTab = tab;
  }

  volver() {
    this.router.navigate([`/dashboard/${this.empresaId}`]);
  }

  handleNavigation(route: string) {
    if (window.innerWidth < 1024) this.sidebarOpen = false;
    this.router.navigate([route]);
  }

  handleLogout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // Días laborales
  toggleDia(diaId: number) {
    const dia = this.diasSemana.find(d => d.id === diaId);
    if (dia) {
      dia.activo = !dia.activo;
      this.actualizarDiasLaboralesEnConfig();
    }
  }

  private actualizarDiasLaboralesEnConfig() {
    this.configuracion.dias_laborales = this.diasSemana
      .filter(d => d.activo)
      .map(d => d.id);
  }

  // Modal de Horarios
  openModalHorarios() {
    this.actualizarEstadoDias();
    this.showModalHorarios = true;
  }

  closeModalHorarios() {
    this.showModalHorarios = false;
  }

  /**
   * Valida y guarda los cambios realizados en la configuracion del bot
   * (mensajes, horarios, dias activos). Hace una peticion POST o PUT
   * dependiendo de si ya existe una configuracion previa o es nueva.
   */
  async guardarConfiguracion() {
    try {
      this.isSaving = true;

      // Actualizar días laborales
      this.actualizarDiasLaboralesEnConfig();

      //  Validar con el servicio
      const validacion = this.chatbotService.validarConfiguracion(this.configuracion);
      if (!validacion.valido) {
        this.errorMessage = validacion.errores.join('. ');
        setTimeout(() => this.errorMessage = '', 5000);
        return;
      }

      // Preparar datos
      const configuracionData = {
        mensaje_bienvenida: this.configuracion.mensaje_bienvenida,
        mensaje_fuera_horario: this.configuracion.mensaje_fuera_horario,
        horario_inicio: this.configuracion.horario_inicio,
        horario_fin: this.configuracion.horario_fin,
        dias_laborales: this.configuracion.dias_laborales,
        activo: this.configuracion.activo
      };

      let response;

      if (this.hasConfiguration) {
        //  Actualizar configuración existente
        response = await this.chatbotService
          .actualizarConfiguracion(this.empresaId, configuracionData)
          .toPromise();
      } else {
        //  Crear nueva configuración
        response = await this.chatbotService
          .crearConfiguracion(this.empresaId, configuracionData)
          .toPromise();
      }

      if (response?.success) {
        this.successMessage = this.hasConfiguration
          ? 'Configuración actualizada exitosamente'
          : 'Configuración creada exitosamente';

        this.hasConfiguration = true;
        this.configuracion = response.data!;
        this.actualizarEstadoDias();
        this.closeModalHorarios();

        setTimeout(() => this.successMessage = '', 5000);
      } else {
        throw new Error(response?.message || 'Error al guardar');
      }

    } catch (error: any) {
      console.error('Error guardando configuración:', error);
      this.errorMessage = error.message || 'Error al guardar la configuración';
      setTimeout(() => this.errorMessage = '', 5000);
    } finally {
      this.isSaving = false;
    }
  }

  //  ELIMINAR CONFIGURACIÓN CON SERVICIO
  async eliminarConfiguracion() {
    if (!confirm('¿Estás seguro de eliminar la configuración? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      this.isSaving = true;

      const response = await this.chatbotService
        .eliminarConfiguracion(this.empresaId)
        .toPromise();

      if (response?.success) {
        this.successMessage = 'Configuración eliminada exitosamente';
        this.hasConfiguration = false;
        this.resetConfiguracion();
        setTimeout(() => this.successMessage = '', 5000);
      } else {
        throw new Error(response?.message || 'Error al eliminar');
      }

    } catch (error: any) {
      console.error('Error eliminando configuración:', error);
      this.errorMessage = error.message || 'Error al eliminar la configuración';
      setTimeout(() => this.errorMessage = '', 5000);
    } finally {
      this.isSaving = false;
    }
  }

  // Respuestas automáticas
  onSearchTermChange(term: string) {
    this.searchTerm = term;
    this.filterRespuestas();
  }

  filterRespuestas() {
    if (!this.searchTerm.trim()) {
      this.filteredRespuestas = this.respuestas;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredRespuestas = this.respuestas.filter(r =>
        r.texto_disparador.toLowerCase().includes(term) ||
        r.respuesta.toLowerCase().includes(term)
      );
    }
  }

  // Modal de respuesta
  openModalRespuesta(respuesta?: RespuestaAutomatica) {
    this.editingRespuesta = respuesta || null;
    this.showModalRespuesta = true;
  }

  closeModalRespuesta() {
    this.showModalRespuesta = false;
    this.editingRespuesta = null;
  }

  // ========================================
  // GESTION DE RESPUESTAS AUTOMATICAS
  // ========================================

  /**
   * Registra una nueva respuesta automatica o actualiza una existente
   * para que el bot la utilice segun su comando de activacion (texto disparador).
   * @param respuestaData Objeto con el disparador, el texto o contenido de respuesta y el tipo.
   */
  async guardarRespuesta(respuestaData: Partial<RespuestaAutomatica>) {
    try {
      this.isSaving = true;

      //  Validar con el servicio
      const validacion = this.chatbotService.validarRespuesta(respuestaData);
      if (!validacion.valido) {
        this.errorMessage = validacion.errores.join('. ');
        setTimeout(() => this.errorMessage = '', 5000);
        return;
      }

      let response;

      if (this.editingRespuesta?.id) {
        //  Actualizar respuesta existente
        response = await this.chatbotService
          .actualizarRespuesta(this.empresaId, this.editingRespuesta.id, respuestaData)
          .toPromise();

        this.successMessage = 'Respuesta actualizada exitosamente';
      } else {
        //  Crear nueva respuesta
        const nuevaRespuesta = {
          texto_disparador: respuestaData.texto_disparador!,
          respuesta: respuestaData.respuesta!,
          tipo_respuesta: respuestaData.tipo_respuesta || 'texto' as 'texto' | 'imagen' | 'documento' | 'enlace'
        };

        response = await this.chatbotService
          .crearRespuesta(this.empresaId, nuevaRespuesta)
          .toPromise();

        this.successMessage = 'Respuesta creada exitosamente';
      }

      if (response?.success) {
        await this.cargarRespuestas();
        this.closeModalRespuesta();
        setTimeout(() => this.successMessage = '', 5000);
      } else {
        throw new Error(response?.message || 'Error al guardar');
      }

    } catch (error: any) {
      console.error('Error guardando respuesta:', error);
      this.errorMessage = error.message || 'Error al guardar la respuesta';
      setTimeout(() => this.errorMessage = '', 5000);
    } finally {
      this.isSaving = false;
    }
  }

  //  ELIMINAR RESPUESTA CON SERVICIO
  async eliminarRespuesta(respuesta: RespuestaAutomatica) {
    if (!confirm(`¿Estás seguro de eliminar la respuesta "${respuesta.texto_disparador}"?`)) {
      return;
    }

    try {
      if (!respuesta.id) {
        throw new Error('ID de respuesta no válido');
      }

      const response = await this.chatbotService
        .eliminarRespuesta(this.empresaId, respuesta.id)
        .toPromise();

      if (response?.success) {
        this.successMessage = 'Respuesta eliminada exitosamente';
        await this.cargarRespuestas();
        setTimeout(() => this.successMessage = '', 5000);
      } else {
        throw new Error(response?.message || 'Error al eliminar');
      }

    } catch (error: any) {
      console.error('Error eliminando respuesta:', error);
      this.errorMessage = error.message || 'Error al eliminar la respuesta';
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }
}
