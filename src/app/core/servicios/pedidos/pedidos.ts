// core/servicios/pedidos/pedidos.service.ts - COMPLETO CON WHATSAPP Y TOKEN

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Autenticacion } from '../autenticacion/autenticacion';

export interface ItemPedido {
  producto_id?: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  empresa_id: number;
  nombre_cliente: string;
  telefono_cliente: string;
  estado: 'pendiente' | 'en_proceso' | 'entregado' | 'cancelado';
  total: number;
  fecha_creacion: string;
  items?: ItemPedido[];
  // Campos adicionales para WhatsApp
  jid_whatsapp?: string;
  numero_real?: string;
  push_name?: string;
}

export interface EstadisticasPorEstado {
  estado: string;
  cantidad: number;
  total_ventas: number;
}

export interface Totales {
  total_pedidos: number;
  ventas_totales: number;
}

export interface Estadisticas {
  por_estado: EstadisticasPorEstado[];
  totales: Totales;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  mensaje?: string;
  error?: string;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Pedidos {
  private apiUrl = 'http://localhost:3000/api/pedidos';

  constructor(
    private http: HttpClient,
    private authService: Autenticacion
  ) {
    console.log('🔧 Servicio de Pedidos inicializado');
    console.log('📍 API URL:', this.apiUrl);
  }

  // ==================== OBTENER PEDIDOS ====================

  /**
   * Obtener todos los pedidos de una empresa
   */
  obtenerPedidos(
    empresaId: string | number,
    estado?: string,
    incluirSinNombre: boolean = false
  ): Observable<ApiResponse<Pedido[]>> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    if (incluirSinNombre) {
      params = params.set('incluirSinNombre', 'true');
    }

    console.log('📋 GET pedidos:', { empresaId, estado, incluirSinNombre });
    return this.http.get<ApiResponse<Pedido[]>>(
      `${this.apiUrl}/empresa/${empresaId}`,
      { params }
    );
  }

  /**
   * Obtener detalle de un pedido específico
   */
  obtenerDetallePedido(pedidoId: number): Observable<ApiResponse<Pedido>> {
    console.log('📄 GET detalle pedido:', pedidoId);
    return this.http.get<ApiResponse<Pedido>>(
      `${this.apiUrl}/detalle/${pedidoId}`
    );
  }

  /**
   * Obtener estadísticas de pedidos
   */
  obtenerEstadisticas(empresaId: string | number): Observable<ApiResponse<Estadisticas>> {
    console.log('📊 GET estadísticas:', empresaId);
    return this.http.get<ApiResponse<Estadisticas>>(
      `${this.apiUrl}/estadisticas/${empresaId}`
    );
  }

  // ==================== ACTUALIZAR ESTADO ====================

  /**
   * Actualizar el estado de un pedido
   */
  actualizarEstado(pedidoId: number, nuevoEstado: Pedido['estado']): Observable<ApiResponse<Pedido>> {
    console.log('🔄 PUT actualizar estado:', { pedidoId, nuevoEstado });
    return this.http.put<ApiResponse<Pedido>>(
      `${this.apiUrl}/actualizar-estado/${pedidoId}`,
      { estado: nuevoEstado }
    );
  }

  // ==================== ENVIAR MENSAJE WHATSAPP 🔥 ====================

  /**
   * Enviar mensaje de WhatsApp a un cliente
   * @param empresaId ID de la empresa
   * @param nombreSesion Nombre de la sesión WhatsApp
   * @param jidWhatsapp JID del cliente (ej: 52064214372462@lid)
   * @param mensaje Mensaje a enviar
   * @returns Observable con la respuesta del servidor
   */
  enviarMensajeCliente(
    empresaId: string,
    nombreSesion: string,
    jidWhatsapp: string,
    mensaje: string
  ): Observable<any> {
    console.log('📤 Servicio: Enviando mensaje a cliente');
    console.log('   ├─ empresaId:', empresaId);
    console.log('   ├─ nombreSesion:', nombreSesion);
    console.log('   ├─ jidWhatsapp:', jidWhatsapp);
    console.log('   └─ mensaje:', mensaje.substring(0, 50) + '...');

    const payload = {
      empresaId,
      nombreSesion,
      jidWhatsapp,
      mensaje
    };

    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    // 🔥 AGREGAR TOKEN AQUÍ
    const token = this.authService.getToken();
    console.log('🔐 Token obtenido:', token ? '✅ Sí' : '❌ No');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });

    console.log('📋 Headers enviados:', { Authorization: token ? 'Bearer [token]' : 'No token' });

    return this.http.post('http://localhost:3000/api/whatsapp/public/enviar-mensaje-cliente', payload, { headers });
  }

  // ==================== UTILIDADES ====================

  /**
   * Formatear precio en formato mexicano
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(precio);
  }

  /**
   * Formatear fecha en formato legible
   */
  formatearFecha(fecha: string | Date): string {
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return fechaObj.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatear teléfono (remover @s.whatsapp.net y @lid)
   */
  formatearTelefono(telefono: string): string {
    if (!telefono) return '';
    return telefono
      .replace('@s.whatsapp.net', '')
      .replace('@lid', '')
      .replace('@g.us', '')
      .trim();
  }

  /**
   * Obtener color CSS según el estado
   */
  getEstadoColor(estado: Pedido['estado']): string {
    const colores: Record<Pedido['estado'], string> = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      en_proceso: 'bg-blue-100 text-blue-800 border-blue-300',
      entregado: 'bg-green-100 text-green-800 border-green-300',
      cancelado: 'bg-red-100 text-red-800 border-red-300'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtener emoji según el estado
   */
  getEstadoEmoji(estado: Pedido['estado']): string {
    const emojis: Record<Pedido['estado'], string> = {
      pendiente: '⏳',
      en_proceso: '🔄',
      entregado: '✅',
      cancelado: '❌'
    };
    return emojis[estado] || '📦';
  }

  /**
   * Obtener texto legible del estado
   */
  getEstadoTexto(estado: Pedido['estado']): string {
    const textos: Record<Pedido['estado'], string> = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };
    return textos[estado] || estado;
  }

  /**
   * Validar si un estado es válido
   */
  esEstadoValido(estado: string): estado is Pedido['estado'] {
    return ['pendiente', 'en_proceso', 'entregado', 'cancelado'].includes(estado);
  }

  /**
   * Obtener cantidad de pedidos por estado
   */
  getCantidadPorEstado(estadisticas: Estadisticas | null, estado: string): number {
    if (!estadisticas) return 0;
    const stat = estadisticas.por_estado.find(e => e.estado === estado);
    return stat ? stat.cantidad : 0;
  }

  /**
   * Obtener total de ventas por estado
   */
  getTotalVentasPorEstado(estadisticas: Estadisticas | null, estado: string): number {
    if (!estadisticas) return 0;
    const stat = estadisticas.por_estado.find(e => e.estado === estado);
    return stat ? stat.total_ventas : 0;
  }

  /**
   * Calcular porcentaje de un estado respecto al total
   */
  getPorcentajeEstado(estadisticas: Estadisticas | null, estado: string): number {
    if (!estadisticas || !estadisticas.totales.total_pedidos) return 0;
    const cantidad = this.getCantidadPorEstado(estadisticas, estado);
    return Math.round((cantidad / estadisticas.totales.total_pedidos) * 100);
  }

  /**
   * Filtrar pedidos por término de búsqueda
   */
  filtrarPedidos(pedidos: Pedido[], termino: string): Pedido[] {
    if (!termino.trim()) return pedidos;

    const terminoLower = termino.toLowerCase();
    return pedidos.filter(pedido =>
      pedido.nombre_cliente.toLowerCase().includes(terminoLower) ||
      pedido.telefono_cliente.toLowerCase().includes(terminoLower) ||
      pedido.id.toString().includes(terminoLower)
    );
  }

  /**
   * Ordenar pedidos por fecha (más recientes primero)
   */
  ordenarPorFecha(pedidos: Pedido[]): Pedido[] {
    return [...pedidos].sort((a, b) => {
      return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
    });
  }

  /**
   * Ordenar pedidos por total (mayor a menor)
   */
  ordenarPorTotal(pedidos: Pedido[]): Pedido[] {
    return [...pedidos].sort((a, b) => b.total - a.total);
  }

  /**
   * Obtener nombre del cliente para mensaje
   */
  obtenerNombreCliente(pedido: Pedido): string {
    return pedido.nombre_cliente || (pedido as any).push_name || 'Cliente';
  }

  /**
   * Obtener JID válido del pedido (prioriza jid_whatsapp sobre telefono)
   */
  obtenerJidValido(pedido: Pedido): string | null {
    const jid = (pedido as any).jid_whatsapp || pedido.telefono_cliente;
    return jid && jid.trim() ? jid : null;
  }
}
