import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../componentes/aside/aside';
import { ModalRespuestaComponent, RespuestaAutomatica } from '../../componentes/modal-respuesta-component/modal-respuesta-component';
import { Horarios } from '../../componentes/configuracion-bot/horarios/horarios';
import { Mensajes } from '../../componentes/configuracion-bot/mensajes/mensajes';
import { ModalHorarios } from '../../componentes/configuracion-bot/modal-horarios/modal-horarios';

@Component({
  selector: 'app-configurar-bot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    ModalRespuestaComponent,
    Horarios,
    Mensajes,
    ModalHorarios
  ],
  templateUrl: './configurar-bot.html'
})
export class ConfigurarBotComponent implements OnInit {
  private router = inject(Router);

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

  // Configuración del bot
  configuracion: any = {
    mensaje_bienvenida: '',
    mensaje_fuera_horario: '',
    horario_inicio: '09:00',
    horario_fin: '18:00',
    dias_laborales: []
  };
  hasConfiguration = false;

  // Estados
  isSaving = false;

  // Días de la semana
  diasSemana = [
    { id: 'lunes', nombre: 'Lunes', activo: false },
    { id: 'martes', nombre: 'Martes', activo: false },
    { id: 'miercoles', nombre: 'Miércoles', activo: false },
    { id: 'jueves', nombre: 'Jueves', activo: false },
    { id: 'viernes', nombre: 'Viernes', activo: false },
    { id: 'sabado', nombre: 'Sábado', activo: false },
    { id: 'domingo', nombre: 'Domingo', activo: false }
  ];

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
    this.loadData();
  }

  async loadData() {
    try {
      this.isLoading = true;

      const empresaId = this.obtenerEmpresaId();

      // Cargar datos de empresa y usuario
      this.empresa = {
        id: empresaId,
        nombre: 'Mi Empresa',
        tipo: 'Restaurante',
        logo: null,
        modulos: {
          pedidos: true,
          reservas: true,
          catalogo: true
        }
      };

      this.usuario = {
        id: '1',
        nombre: 'Usuario',
        email: 'usuario@example.com',
        rol: 'Administrador'
      };

      // Simular datos de configuración existente (para pruebas)
      this.hasConfiguration = true;
      this.configuracion = {
        mensaje_bienvenida: '¡Hola! 👋 Bienvenido a Mi Empresa. ¿En qué podemos ayudarte hoy?',
        mensaje_fuera_horario: 'Gracias por contactarnos 🌙. En este momento estamos fuera de horario. Nuestro horario es de Lunes a Viernes de 9:00 AM a 6:00 PM. Te responderemos lo antes posible.',
        horario_inicio: '09:00',
        horario_fin: '18:00',
        dias_laborales: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
      };

      // Actualizar estado de días
      this.diasSemana.forEach(dia => {
        dia.activo = this.configuracion.dias_laborales.includes(dia.id);
      });

      // Simular respuestas automáticas
      this.respuestas = [
        {
          id: 1,
          empresa_id: parseInt(empresaId),
          texto_disparador: 'horario',
          respuesta: 'Nuestro horario de atención es de Lunes a Viernes de 9:00 AM a 6:00 PM',
          tipo_respuesta: 'texto'
        },
        {
          id: 2,
          empresa_id: parseInt(empresaId),
          texto_disparador: 'precio',
          respuesta: 'Para información sobre precios, por favor consulta nuestro catálogo o comunícate directamente.',
          tipo_respuesta: 'texto'
        },
        {
          id: 3,
          empresa_id: parseInt(empresaId),
          texto_disparador: 'ubicación',
          respuesta: 'Estamos ubicados en Av. Principal #123, Colonia Centro',
          tipo_respuesta: 'texto'
        }
      ];
      this.filteredRespuestas = this.respuestas;

      await this.cargarConfiguracion();
      await this.cargarRespuestas();
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.errorMessage = 'Error al cargar la configuración';
    } finally {
      this.isLoading = false;
    }
  }

  private obtenerEmpresaId(): string {
    const url = window.location.pathname;
    const match = url.match(/\/dashboard\/(\d+)/);
    if (match) {
      return match[1];
    }
    const empresaGuardada = localStorage.getItem('empresa_id');
    return empresaGuardada || '27';
  }

  async cargarConfiguracion() {
    // Implementar llamada al servicio
  }

  async cargarRespuestas() {
    this.loadingRespuestas = true;
    try {
      // Implementar llamada al servicio
      this.filteredRespuestas = this.respuestas;
    } catch (error) {
      console.error('Error cargando respuestas:', error);
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
    this.router.navigate(['/dashboard']);
  }

  handleNavigation(route: string) {
    this.router.navigate([route]);
  }

  handleLogout() {
    this.router.navigate(['/login']);
  }

  // Días laborales
  toggleDia(diaId: string) {
    const dia = this.diasSemana.find(d => d.id === diaId);
    if (dia) {
      dia.activo = !dia.activo;
      this.actualizarDiasLaborales();
    }
  }

  actualizarDiasLaborales() {
    this.configuracion.dias_laborales = this.diasSemana
      .filter(d => d.activo)
      .map(d => d.id);
  }

  // Modal de Horarios
  openModalHorarios() {
    this.showModalHorarios = true;
  }

  closeModalHorarios() {
    this.showModalHorarios = false;
  }

  // Configuración del bot
  async guardarConfiguracion() {
    try {
      this.isSaving = true;

      // Validaciones
      if (this.configuracion.dias_laborales.length === 0) {
        this.errorMessage = 'Debes seleccionar al menos un día laboral';
        setTimeout(() => this.errorMessage = '', 3000);
        return;
      }

      if (!this.configuracion.mensaje_bienvenida.trim()) {
        this.errorMessage = 'El mensaje de bienvenida es obligatorio';
        setTimeout(() => this.errorMessage = '', 3000);
        return;
      }

      if (!this.configuracion.mensaje_fuera_horario.trim()) {
        this.errorMessage = 'El mensaje fuera de horario es obligatorio';
        setTimeout(() => this.errorMessage = '', 3000);
        return;
      }

      // Implementar guardado
      // await this.botService.saveConfiguracion(this.empresa.id, this.configuracion);

      this.successMessage = 'Configuración guardada exitosamente';
      this.hasConfiguration = true;
      this.closeModalHorarios();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      this.errorMessage = 'Error al guardar la configuración';
      setTimeout(() => this.errorMessage = '', 3000);
    } finally {
      this.isSaving = false;
    }
  }

  async eliminarConfiguracion() {
    if (!confirm('¿Estás seguro de eliminar la configuración? Esta acción no se puede deshacer.')) return;

    try {
      this.isSaving = true;
      // Implementar eliminación
      // await this.botService.deleteConfiguracion(this.empresa.id);

      this.successMessage = 'Configuración eliminada exitosamente';
      this.hasConfiguration = false;
      this.configuracion = {
        mensaje_bienvenida: '',
        mensaje_fuera_horario: '',
        horario_inicio: '09:00',
        horario_fin: '18:00',
        dias_laborales: []
      };
      this.diasSemana.forEach(dia => dia.activo = false);
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error eliminando configuración:', error);
      this.errorMessage = 'Error al eliminar la configuración';
      setTimeout(() => this.errorMessage = '', 3000);
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

  async guardarRespuesta(respuesta: RespuestaAutomatica) {
    try {
      this.isSaving = true;

      if (this.editingRespuesta) {
        // Actualizar respuesta existente
        // await this.botService.updateRespuesta(this.empresa.id, respuesta);
        this.successMessage = 'Respuesta actualizada exitosamente';
      } else {
        // Crear nueva respuesta
        // await this.botService.createRespuesta(this.empresa.id, respuesta);
        this.successMessage = 'Respuesta creada exitosamente';
      }

      await this.cargarRespuestas();
      this.closeModalRespuesta();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error guardando respuesta:', error);
      this.errorMessage = 'Error al guardar la respuesta';
      setTimeout(() => this.errorMessage = '', 3000);
    } finally {
      this.isSaving = false;
    }
  }

  async eliminarRespuesta(respuesta: RespuestaAutomatica) {
    if (!confirm(`¿Estás seguro de eliminar la respuesta "${respuesta.texto_disparador}"?`)) return;

    try {
      // Implementar eliminación
      // await this.botService.deleteRespuesta(this.empresa.id, respuesta.id);

      this.successMessage = 'Respuesta eliminada exitosamente';
      await this.cargarRespuestas();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error eliminando respuesta:', error);
      this.errorMessage = 'Error al eliminar la respuesta';
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }
}
