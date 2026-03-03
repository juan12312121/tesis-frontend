import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Autenticacion } from '../autenticacion/autenticacion';

// ── NUEVO: categoria ahora es un objeto, no un string enum ──
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activa?: boolean;
}

export interface CatalogoItem {
  id?: number;
  empresa_id?: number;
  nombre_item: string;
  descripcion?: string | null;
  precio?: number | null;
  tipo_item: 'producto' | 'servicio';
  imagen_url?: string | null;

  // Campos para PRODUCTOS
  stock?: number | null;
  disponible?: boolean;

  // Campos para SERVICIOS
  duracion_minutos?: number | null;
  requiere_agendamiento?: boolean;

  // ── NUEVO: categoria_id en lugar del enum categoria ──
  categoria_id?: number | null;
  categoria?: Categoria | null;  // viene del include del backend

  tags?: string | null;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface CatalogoResponse {
  success: boolean;
  message?: string;
  total?: number;
  data?: CatalogoItem | CatalogoItem[];
}

export interface EstadisticasCatalogo {
  success: boolean;
  data?: {
    totalProductos: number;
    totalServicios: number;
    sinStock: number;
    stockBajo: number;
  };
}

export interface CategoriasResponse {
  success: boolean;
  data?: Categoria[];
}

@Injectable({
  providedIn: 'root',
})
export class Catalogos {
  private readonly API_URL = 'http://localhost:3000/api/catalogo';

  constructor(
    private http: HttpClient,
    private authService: Autenticacion
  ) {}

  // ==================== CATEGORÍAS ====================

  // Obtener categorías reales de la empresa (tabla categorias_productos)
  obtenerCategorias(): Observable<CategoriasResponse> {
    return this.http.get<CategoriasResponse>(`${this.API_URL}/categorias`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Crear nueva categoría
  agregarCategoria(nombre: string, descripcion?: string): Observable<CatalogoResponse> {
    return this.http.post<CatalogoResponse>(
      `${this.API_URL}/categorias`,
      { nombre, descripcion },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  // Eliminar (desactivar) categoría
  eliminarCategoria(id: number): Observable<CatalogoResponse> {
    return this.http.delete<CatalogoResponse>(`${this.API_URL}/categorias/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // ==================== CATÁLOGO ====================

  obtenerCatalogo(params?: {
    tipo?: 'producto' | 'servicio';
    categoria_id?: number;
    disponible?: boolean;
  }): Observable<CatalogoResponse> {
    let httpParams = new HttpParams();
    if (params?.tipo) httpParams = httpParams.set('tipo', params.tipo);
    if (params?.categoria_id) httpParams = httpParams.set('categoria_id', params.categoria_id.toString());
    if (params?.disponible !== undefined) httpParams = httpParams.set('disponible', params.disponible.toString());

    return this.http.get<CatalogoResponse>(this.API_URL, {
      headers: this.authService.getAuthHeaders(),
      params: httpParams
    });
  }

  obtenerItem(id: number): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  crearItem(item: Omit<CatalogoItem, 'id' | 'empresa_id' | 'fecha_creacion' | 'fecha_actualizacion' | 'categoria'>): Observable<CatalogoResponse> {
    return this.http.post<CatalogoResponse>(this.API_URL, item, {
      headers: this.authService.getAuthHeaders()
    });
  }

  actualizarItem(id: number, item: Partial<CatalogoItem>): Observable<CatalogoResponse> {
    return this.http.put<CatalogoResponse>(`${this.API_URL}/${id}`, item, {
      headers: this.authService.getAuthHeaders()
    });
  }

  eliminarItem(id: number): Observable<CatalogoResponse> {
    return this.http.delete<CatalogoResponse>(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  buscarItems(query: string, params?: {
    tipo?: 'producto' | 'servicio';
    categoria_id?: number;
  }): Observable<CatalogoResponse> {
    let httpParams = new HttpParams().set('busqueda', query);
    if (params?.tipo) httpParams = httpParams.set('tipo', params.tipo);
    if (params?.categoria_id) httpParams = httpParams.set('categoria_id', params.categoria_id.toString());

    return this.http.get<CatalogoResponse>(`${this.API_URL}/buscar`, {
      headers: this.authService.getAuthHeaders(),
      params: httpParams
    });
  }

  obtenerEstadisticas(): Observable<EstadisticasCatalogo> {
    return this.http.get<EstadisticasCatalogo>(`${this.API_URL}/estadisticas`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  actualizarStock(id: number, stock: number): Observable<CatalogoResponse> {
    return this.http.patch<CatalogoResponse>(`${this.API_URL}/${id}/stock`, { stock }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // ==================== FILTROS ====================
  obtenerProductos(params?: { categoria_id?: number; disponible?: boolean }): Observable<CatalogoResponse> {
    return this.obtenerCatalogo({ tipo: 'producto', ...params });
  }

  obtenerServicios(params?: { categoria_id?: number; disponible?: boolean }): Observable<CatalogoResponse> {
    return this.obtenerCatalogo({ tipo: 'servicio', ...params });
  }

  // ==================== UTILIDADES ====================
  formatearPrecio(precio: number | null | undefined): string {
    if (!precio) return 'Sin precio';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precio);
  }

  formatearDuracion(minutos: number | null | undefined): string {
    if (!minutos) return 'No especificada';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0 && mins > 0) return `${horas}h ${mins}min`;
    if (horas > 0) return `${horas}h`;
    return `${mins}min`;
  }

  obtenerTags(item: CatalogoItem): string[] {
    if (!item.tags) return [];
    return item.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  esProducto(item: CatalogoItem): boolean { return item.tipo_item === 'producto'; }
  esServicio(item: CatalogoItem): boolean { return item.tipo_item === 'servicio'; }
  tieneStock(item: CatalogoItem): boolean { return (item.stock ?? 0) > 0; }
  estaDisponible(item: CatalogoItem): boolean { return item.disponible === true; }
}
