import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, Subject } from 'rxjs';
import { switchMap, takeUntil, startWith } from 'rxjs/operators';
import { Autenticacion } from '../autenticacion/autenticacion';

interface EstadoWhatsApp {
  success: boolean;
  data: {
    id: string;
    nombre_sesion: string;
    conectado: boolean;
    numero_telefono?: string;
    fecha_conexion?: string;
    empresa_id: string;
  };
}

interface QRResponse {
  success: boolean;
  qrCode?: string;
  conectado?: boolean;
  message?: string;
}

interface EnviarMensajeData {
  numero_destino: string;
  mensaje: string;
}

// ==================== INTERFACES PÚBLICAS ====================
export interface EstadoPublicoWhatsApp {
  success: boolean;
  empresaId: string;
  nombreSesion: string;
  conectado: boolean;
  numero?: string;
  nombre?: string;
  existe: boolean;
  mensaje?: string;
  qr?: string;
  timestamp: string;
}

export interface IniciarSesionResponse {
  success: boolean;
  qr?: string;
  message: string;
  conectado?: boolean;
  numero?: string;
  nombre?: string;
}

export interface EnviarMensajePublicoData {
  empresaId: number;
  nombreSesion: string;
  numeroDestino: string;
  mensaje: string;
}

@Injectable({
  providedIn: 'root',
})
export class InstanciasService {
  private readonly API_URL = 'http://localhost:3000/api';
  private qrCheckInterval$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private auth: Autenticacion
  ) { }

  // ========================================
  //  MÉTODOS PÚBLICOS (SIN AUTENTICACIÓN)
  // ========================================

  /**
   * Solicita el inicio de una sesion publica de WhatsApp para una empresa especifica.
   * Crea una nueva instancia de conexion o reactiva una existente.
   * @param empresaId Identificador de la empresa
   * @param nombreSesion Nombre asignado a la sesion de WhatsApp
   * @returns Un Observable con la respuesta del inicio de sesion, que puede contener el codigo QR.
   */
  iniciarSesionPublica(empresaId: number, nombreSesion: string): Observable<IniciarSesionResponse> {
    return this.http.post<IniciarSesionResponse>(
      `${this.API_URL}/whatsapp/public/iniciar-sesion`,
      { empresaId, nombreSesion }
    );
  }

  /**
   * Obtener estado de WhatsApp (público)
   */
  obtenerEstadoPublico(empresaId: number, nombreSesion: string): Observable<EstadoPublicoWhatsApp> {
    return this.http.get<EstadoPublicoWhatsApp>(
      `${this.API_URL}/whatsapp/public/estado/${empresaId}/${nombreSesion}`
    );
  }

  /**
   * Obtener QR code (público)
   */
  obtenerQRPublico(empresaId: number, nombreSesion: string): Observable<any> {
    return this.http.get(`${this.API_URL}/whatsapp/public/obtener-qr/${empresaId}/${nombreSesion}`);
  }

  /**
   * Enviar mensaje (público)
   */
  enviarMensajePublico(data: EnviarMensajePublicoData): Observable<any> {
    return this.http.post(`${this.API_URL}/whatsapp/public/enviar-mensaje`, data);
  }

  /**
   * Cerrar sesión (público)
   */
  cerrarSesionPublica(empresaId: number, nombreSesion: string): Observable<any> {
    return this.http.post(
      `${this.API_URL}/whatsapp/public/cerrar-sesion/${empresaId}/${nombreSesion}`,
      {}
    );
  }

  /**
   * Obtener estado detallado (público)
   */
  obtenerEstadoDetalladoPublico(empresaId: number, nombreSesion: string): Observable<any> {
    return this.http.get(
      `${this.API_URL}/whatsapp/public/estado-detallado/${empresaId}/${nombreSesion}`
    );
  }

  /**
   * Listar todas las sesiones activas (público)
   */
  listarSesionesPublicas(): Observable<any> {
    return this.http.get(`${this.API_URL}/whatsapp/public/sesiones`);
  }

  /**
   * Inicia un proceso de verificacion periodica del estado de conexion de WhatsApp.
   * Este metodo consulta de forma automatica y repetitiva el servidor para detectar cambios
   * en el estado de la sesion (por ejemplo, cuando se escanea exitosamente el codigo QR).
   * @param empresaId ID de la empresa
   * @param nombreSesion Nombre de la sesion
   * @param intervaloSegundos Rango de tiempo entre cada peticion (por defecto 5 segundos)
   * @returns Observable que emite el estado publico de la conexion en cada intervalo
   */
  verificarEstadoAutomaticoPublico(
    empresaId: number,
    nombreSesion: string,
    intervaloSegundos: number = 5
  ): Observable<EstadoPublicoWhatsApp> {
    return interval(intervaloSegundos * 1000).pipe(
      startWith(0), // Ejecutar inmediatamente
      switchMap(() => this.obtenerEstadoPublico(empresaId, nombreSesion)),
      takeUntil(this.qrCheckInterval$)
    );
  }

  // ========================================
  //  MÉTODOS PROTEGIDOS (CON AUTENTICACIÓN)
  // ========================================

  /**
   * Obtener estado de WhatsApp (protegido)
   */
  obtenerEstado(): Observable<EstadoWhatsApp> {
    return this.http.get<EstadoWhatsApp>(`${this.API_URL}/whatsapp/estado`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Obtener QR code (protegido)
   */
  obtenerQR(): Observable<QRResponse> {
    return this.http.get<QRResponse>(`${this.API_URL}/whatsapp/qr`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Enviar mensaje (protegido)
   */
  enviarMensaje(data: EnviarMensajeData): Observable<any> {
    return this.http.post(`${this.API_URL}/whatsapp/enviar`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Enviar mensaje con media (protegido)
   */
  enviarMensajeConMedia(numeroDestino: string, mensaje: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('numero_destino', numeroDestino);
    formData.append('mensaje', mensaje);
    formData.append('media', file);

    return this.http.post(`${this.API_URL}/whatsapp/enviar-media`, formData, {
      headers: {
        'Authorization': `Bearer ${this.auth.getToken()}`
      }
    });
  }

  /**
   * Desconectar WhatsApp (protegido)
   */
  desconectar(): Observable<any> {
    return this.http.post(`${this.API_URL}/whatsapp/desconectar`, {}, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Reiniciar instancia (protegido)
   */
  reiniciarInstancia(): Observable<any> {
    return this.http.post(`${this.API_URL}/whatsapp/reiniciar`, {}, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Verificación automática de conexión (protegido)
   */
  iniciarVerificacionAutomatica(intervaloSegundos: number = 5): Observable<EstadoWhatsApp> {
    return interval(intervaloSegundos * 1000)
      .pipe(
        switchMap(() => this.obtenerEstado()),
        takeUntil(this.qrCheckInterval$)
      );
  }

  /**
   * Detener verificación automática
   */
  detenerVerificacionAutomatica(): void {
    this.qrCheckInterval$.next();
  }

  /**
   * Obtener información de la instancia (protegido)
   */
  obtenerInfoInstancia(): Observable<any> {
    return this.http.get(`${this.API_URL}/whatsapp/instancia`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Listar chats activos (protegido)
   */
  listarChatsActivos(): Observable<any> {
    return this.http.get(`${this.API_URL}/whatsapp/chats`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Obtener mensajes de un chat (protegido)
   */
  obtenerMensajesChat(numeroCliente: string, limite: number = 50): Observable<any> {
    return this.http.get(`${this.API_URL}/whatsapp/chats/${numeroCliente}/mensajes?limite=${limite}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Marcar mensajes como leídos (protegido)
   */
  marcarComoLeido(numeroCliente: string): Observable<any> {
    return this.http.post(`${this.API_URL}/whatsapp/chats/${numeroCliente}/leer`, {}, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Obtener contactos (protegido)
   */
  obtenerContactos(): Observable<any> {
    return this.http.get(`${this.API_URL}/whatsapp/contactos`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Bloquear/Desbloquear contacto (protegido)
   */
  toggleBloquearContacto(numeroCliente: string, bloquear: boolean): Observable<any> {
    return this.http.post(`${this.API_URL}/whatsapp/contactos/${numeroCliente}/bloquear`, {
      bloquear
    }, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Crear grupo (protegido)
   */
  crearGrupo(nombre: string, participantes: string[]): Observable<any> {
    return this.http.post(`${this.API_URL}/whatsapp/grupos`, {
      nombre,
      participantes
    }, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Enviar mensaje a grupo (protegido)
   */
  enviarMensajeGrupo(grupoId: string, mensaje: string): Observable<any> {
    return this.http.post(`${this.API_URL}/whatsapp/grupos/${grupoId}/enviar`, {
      mensaje
    }, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Obtener estado de batería (protegido)
   */
  obtenerEstadoBateria(): Observable<any> {
    return this.http.get(`${this.API_URL}/whatsapp/bateria`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Cambiar foto de perfil (protegido)
   */
  cambiarFotoPerfil(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('foto', file);

    return this.http.post(`${this.API_URL}/whatsapp/foto-perfil`, formData, {
      headers: {
        'Authorization': `Bearer ${this.auth.getToken()}`
      }
    });
  }

  /**
   * Cambiar estado/about (protegido)
   */
  cambiarEstado(nuevoEstado: string): Observable<any> {
    return this.http.put(`${this.API_URL}/whatsapp/estado`, {
      estado: nuevoEstado
    }, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Enviar ubicación (protegido)
   */
  enviarUbicacion(numeroDestino: string, latitud: number, longitud: number, descripcion?: string): Observable<any> {
    return this.http.post(`${this.API_URL}/whatsapp/enviar-ubicacion`, {
      numero_destino: numeroDestino,
      latitud,
      longitud,
      descripcion
    }, {
      headers: this.auth.getAuthHeaders()
    });
  }

  /**
   * Obtener estadísticas de mensajería (protegido)
   */
  obtenerEstadisticasMensajeria(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let url = `${this.API_URL}/whatsapp/estadisticas`;
    const params: string[] = [];

    if (fechaInicio) params.push(`fechaInicio=${fechaInicio}`);
    if (fechaFin) params.push(`fechaFin=${fechaFin}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get(url, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ========================================
  // UTILIDADES
  // ========================================

  /**
   * Normaliza el formato del numero de telefono para su correcto procesamiento.
   * Elimina todos los caracteres no numericos y asegura que el numero incluya el 
   * codigo de pais correspondiente (por defecto agrega 52 para Mexico si no esta presente).
   * @param numero Numero original a formatear
   * @returns Numero limpio y estandarizado
   */
  formatearNumero(numero: string): string {
    // Eliminar caracteres no numéricos
    numero = numero.replace(/\D/g, '');

    // Si no empieza con código de país, agregar 52 (México)
    if (!numero.startsWith('52') && numero.length === 10) {
      numero = '52' + numero;
    }

    return numero;
  }

  /**
   * Validar número de teléfono
   */
  validarNumero(numero: string): boolean {
    const numeroLimpio = numero.replace(/\D/g, '');
    // Validar que tenga entre 10 y 15 dígitos
    return numeroLimpio.length >= 10 && numeroLimpio.length <= 15;
  }

  /**
   * Obtener estado de conexión guardado
   */
  obtenerEstadoConexion(): 'conectado' | 'desconectado' | 'cargando' {
    const estado = localStorage.getItem('whatsapp_estado');
    return (estado as any) || 'cargando';
  }

  /**
   * Guardar estado de conexión
   */
  guardarEstadoConexion(estado: 'conectado' | 'desconectado'): void {
    localStorage.setItem('whatsapp_estado', estado);
  }

  /**
   * Limpiar localStorage de WhatsApp
   */
  limpiarEstadoLocal(): void {
    localStorage.removeItem('whatsapp_estado');
    localStorage.removeItem('whatsapp_numero');
    localStorage.removeItem('whatsapp_nombre');
  }

  /**
   * Guardar datos de sesión en localStorage
   */
  guardarDatosSesion(empresaId: number, nombreSesion: string, numero?: string, nombre?: string): void {
    localStorage.setItem('whatsapp_empresa_id', empresaId.toString());
    localStorage.setItem('whatsapp_nombre_sesion', nombreSesion);
    if (numero) localStorage.setItem('whatsapp_numero', numero);
    if (nombre) localStorage.setItem('whatsapp_nombre', nombre);
  }

  /**
   * Obtener datos de sesión de localStorage
   */
  obtenerDatosSesion(): { empresaId: number | null; nombreSesion: string | null } {
    const empresaId = localStorage.getItem('whatsapp_empresa_id');
    const nombreSesion = localStorage.getItem('whatsapp_nombre_sesion');

    return {
      empresaId: empresaId ? parseInt(empresaId) : null,
      nombreSesion: nombreSesion
    };
  }
}


