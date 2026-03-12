import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Autenticacion } from '../autenticacion/autenticacion';

// ============================================
// INTERFACES
// ============================================

export interface ConfiguracionChatbot {
  id?: number;
  empresa_id: number;
  mensaje_bienvenida: string;
  mensaje_fuera_horario: string;
  horario_inicio: string;
  horario_fin: string;
  activo: boolean;
  dias_laborales: number[];
  fecha_creacion?: string;
}

export interface RespuestaAutomatica {
  id?: number;
  empresa_id: number;
  texto_disparador: string;
  respuesta: string;
  tipo_respuesta: 'texto' | 'imagen' | 'documento' | 'enlace';
  fecha_creacion?: string;
  //  ELIMINADAS: activo y prioridad
}

export interface CatalogoItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  imagen: string | null;
  tipo: 'producto' | 'servicio';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface HorarioResponse {
  enHorario: boolean;
  mensaje: string;
  horario?: {
    inicio: string;
    fin: string;
    dias_laborales: number[] | string[];
  };
  detalles?: {
    horaActual: string;
    diaActual: number;
  };
}

export interface AnalizarMensajeResponse {
  debe_responder: boolean;
  tipo_respuesta?: 'automatica' | 'productos' | 'servicios' | 'catalogo_completo' | 'item_detalle' | 'texto';
  respuesta?: {
    id: number;
    texto: string;
    tipo: string;
    disparador: string;
  };
  items?: CatalogoItem[];
  productos?: CatalogoItem[];
  servicios?: CatalogoItem[];
  item?: CatalogoItem;
  total?: number;
  total_productos?: number;
  total_servicios?: number;
  mensaje?: string;
  disparador_detectado?: string;
  mensaje_analizado: boolean;
  razon?: string;
}

export interface BuscarCatalogoResponse {
  success: boolean;
  total: number;
  items: CatalogoItem[];
}

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private http = inject(HttpClient);
  private authService = inject(Autenticacion);

  private readonly API_URL = 'http://localhost:3000/api/chatbot';

  // ============================================
  // CONFIGURACIÓN DEL CHATBOT
  // ============================================

  obtenerConfiguracion(empresaId: string): Observable<ApiResponse<ConfiguracionChatbot>> {
    return this.http.get<ApiResponse<ConfiguracionChatbot>>(
      `${this.API_URL}/configuracion/${empresaId}`,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  crearConfiguracion(
    empresaId: string,
    configuracion: Omit<ConfiguracionChatbot, 'id' | 'empresa_id' | 'fecha_creacion'>
  ): Observable<ApiResponse<ConfiguracionChatbot>> {
    return this.http.post<ApiResponse<ConfiguracionChatbot>>(
      `${this.API_URL}/configuracion/${empresaId}`,
      configuracion,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  actualizarConfiguracion(
    empresaId: string,
    configuracion: Partial<Omit<ConfiguracionChatbot, 'id' | 'empresa_id' | 'fecha_creacion'>>
  ): Observable<ApiResponse<ConfiguracionChatbot>> {
    return this.http.put<ApiResponse<ConfiguracionChatbot>>(
      `${this.API_URL}/configuracion/${empresaId}`,
      configuracion,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  eliminarConfiguracion(empresaId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.API_URL}/configuracion/${empresaId}`,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // ============================================
  // HORARIOS (Ruta Pública - Para N8N)
  // ============================================

  verificarHorario(empresaId: string): Observable<HorarioResponse> {
    return this.http.get<HorarioResponse>(
      `${this.API_URL}/verificar-horario/${empresaId}`
    ).pipe(catchError(this.handleError));
  }

  // ============================================
  // ANÁLISIS DE MENSAJES (Ruta Pública - Para N8N)
  // ============================================

  analizarMensaje(empresaId: string, mensaje: string): Observable<AnalizarMensajeResponse> {
    return this.http.post<AnalizarMensajeResponse>(
      `${this.API_URL}/analizar-mensaje/${empresaId}`,
      { mensaje }
    ).pipe(catchError(this.handleError));
  }

  // ============================================
  // RESPUESTAS AUTOMÁTICAS
  // ============================================

  obtenerRespuestas(empresaId: string): Observable<ApiResponse<RespuestaAutomatica[]>> {
    return this.http.get<ApiResponse<RespuestaAutomatica[]>>(
      `${this.API_URL}/respuestas/${empresaId}`,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  crearRespuesta(
    empresaId: string,
    respuesta: Omit<RespuestaAutomatica, 'id' | 'empresa_id' | 'fecha_creacion'>
  ): Observable<ApiResponse<RespuestaAutomatica>> {
    return this.http.post<ApiResponse<RespuestaAutomatica>>(
      `${this.API_URL}/respuestas/${empresaId}`,
      respuesta,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  actualizarRespuesta(
    empresaId: string,
    respuestaId: number,
    datos: Partial<Omit<RespuestaAutomatica, 'id' | 'empresa_id' | 'fecha_creacion'>>
  ): Observable<ApiResponse<RespuestaAutomatica>> {
    return this.http.put<ApiResponse<RespuestaAutomatica>>(
      `${this.API_URL}/respuestas/${empresaId}/${respuestaId}`,
      datos,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  eliminarRespuesta(empresaId: string, respuestaId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.API_URL}/respuestas/${empresaId}/${respuestaId}`,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  //  MÉTODO ELIMINADO: toggleRespuestaActiva (ya no existe el campo activo)

  // ============================================
  // CATÁLOGO - PRODUCTOS Y SERVICIOS (Rutas Públicas - Para N8N)
  // ============================================

  buscarEnCatalogo(
    empresaId: string,
    busqueda?: string,
    tipo?: 'producto' | 'servicio'
  ): Observable<BuscarCatalogoResponse> {
    let params = new HttpParams();

    if (busqueda) {
      params = params.set('busqueda', busqueda);
    }

    if (tipo) {
      params = params.set('tipo', tipo);
    }

    return this.http.get<BuscarCatalogoResponse>(
      `${this.API_URL}/catalogo/${empresaId}/buscar`,
      { params }
    ).pipe(catchError(this.handleError));
  }

  obtenerItemCatalogo(empresaId: string, itemId: number): Observable<ApiResponse<CatalogoItem>> {
    return this.http.get<ApiResponse<CatalogoItem>>(
      `${this.API_URL}/catalogo/${empresaId}/item/${itemId}`
    ).pipe(catchError(this.handleError));
  }

  // ============================================
  // UTILIDADES
  // ============================================

  validarConfiguracion(configuracion: ConfiguracionChatbot): {
    valido: boolean;
    errores: string[];
  } {
    const errores: string[] = [];

    if (!configuracion.mensaje_bienvenida?.trim()) {
      errores.push('El mensaje de bienvenida es obligatorio');
    }

    if (!configuracion.mensaje_fuera_horario?.trim()) {
      errores.push('El mensaje fuera de horario es obligatorio');
    }

    if (!configuracion.horario_inicio || !configuracion.horario_fin) {
      errores.push('Debes especificar el horario de inicio y fin');
    } else {
      const [horaInicio, minInicio] = configuracion.horario_inicio.split(':').map(Number);
      const [horaFin, minFin] = configuracion.horario_fin.split(':').map(Number);
      const minutosInicio = horaInicio * 60 + minInicio;
      const minutosFin = horaFin * 60 + minFin;

      if (minutosFin <= minutosInicio) {
        errores.push('La hora de fin debe ser posterior a la hora de inicio');
      }
    }

    if (!configuracion.dias_laborales || configuracion.dias_laborales.length === 0) {
      errores.push('Debes seleccionar al menos un día laboral');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  validarRespuesta(respuesta: Partial<RespuestaAutomatica>): {
    valido: boolean;
    errores: string[];
  } {
    const errores: string[] = [];

    if (!respuesta.texto_disparador?.trim()) {
      errores.push('El texto disparador es obligatorio');
    } else if (respuesta.texto_disparador.trim().length < 2) {
      errores.push('El texto disparador debe tener al menos 2 caracteres');
    } else if (respuesta.texto_disparador.length > 255) {
      errores.push('El texto disparador no puede superar los 255 caracteres');
    }

    if (!respuesta.respuesta?.trim()) {
      errores.push('La respuesta es obligatoria');
    } else if (respuesta.respuesta.trim().length < 5) {
      errores.push('La respuesta debe tener al menos 5 caracteres');
    }

    if (respuesta.tipo_respuesta) {
      const tiposValidos = ['texto', 'imagen', 'documento', 'enlace'];
      if (!tiposValidos.includes(respuesta.tipo_respuesta)) {
        errores.push('El tipo de respuesta no es válido');
      }
    }

    //  ELIMINADA: validación de prioridad

    return {
      valido: errores.length === 0,
      errores
    };
  }

  obtenerDiasSemana(): Array<{ id: number; nombre: string; nombreCorto: string }> {
    return [
      { id: 0, nombre: 'Domingo', nombreCorto: 'Dom' },
      { id: 1, nombre: 'Lunes', nombreCorto: 'Lun' },
      { id: 2, nombre: 'Martes', nombreCorto: 'Mar' },
      { id: 3, nombre: 'Miércoles', nombreCorto: 'Mié' },
      { id: 4, nombre: 'Jueves', nombreCorto: 'Jue' },
      { id: 5, nombre: 'Viernes', nombreCorto: 'Vie' },
      { id: 6, nombre: 'Sábado', nombreCorto: 'Sáb' }
    ];
  }

  obtenerTiposRespuesta(): Array<{
    valor: string;
    etiqueta: string;
    icono: string;
    descripcion: string;
  }> {
    return [
      {
        valor: 'texto',
        etiqueta: 'Texto',
        icono: '💬',
        descripcion: 'Respuesta en texto plano'
      },
      {
        valor: 'imagen',
        etiqueta: 'Imagen',
        icono: '🖼️',
        descripcion: 'Respuesta con imagen (URL)'
      },
      {
        valor: 'documento',
        etiqueta: 'Documento',
        icono: '📄',
        descripcion: 'Respuesta con documento (URL)'
      },
      {
        valor: 'enlace',
        etiqueta: 'Enlace',
        icono: '🔗',
        descripcion: 'Respuesta con enlace web'
      }
    ];
  }

  formatearPrecio(precio: number | null): string {
    if (precio === null || precio === undefined) {
      return 'Consultar';
    }
    return `$${precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatearTipoItem(tipo: string): string {
    return tipo === 'producto' ? '📦 Producto' : '🛠️ Servicio';
  }

  normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // ============================================
  // MANEJO DE ERRORES
  // ============================================

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en ChatbotService:', error);

    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Solicitud inválida';
      } else if (error.status === 401) {
        errorMessage = 'No estás autorizado. Por favor, inicia sesión nuevamente.';
      } else if (error.status === 404) {
        errorMessage = error.error?.message || 'Recurso no encontrado.';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor. Intenta más tarde.';
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error del servidor: ${error.status}`;
      }
    }

    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      error: error.error
    }));
  }
}


