// catalogos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Autenticacion } from '../autenticacion/autenticacion';

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
  sku?: string | null;
  disponible?: boolean;

  // Campos para SERVICIOS
  duracion_minutos?: number | null;
  requiere_agendamiento?: boolean;

  // Campos comunes
  categoria?: string | null;
  tags?: string | null;
  notas_adicionales?: string | null;

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
    total_items: number;
    total_productos: number;
    total_servicios: number;
    items_disponibles: number;
    items_con_stock: number;
    categorias: string[];
    items_con_precio: number;
    precio_promedio: string | null;
    precio_minimo: string | null;
    precio_maximo: string | null;
  };
}

export interface CategoriaEnUso {
  categoria: string;
  total: number;
}

export interface CategoriasResponse {
  success: boolean;
  total?: number;
  data?: string[] | CategoriaEnUso[];
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

  // Obtener todas las categorías disponibles del ENUM
  obtenerCategoriasDisponibles(): Observable<CategoriasResponse> {
    return this.http.get<CategoriasResponse>(`${this.API_URL}/categorias-disponibles`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Obtener categorías en uso por la empresa
  obtenerCategoriasEnUso(): Observable<CategoriasResponse> {
    return this.http.get<CategoriasResponse>(`${this.API_URL}/categorias`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Agregar nueva categoría al ENUM
  agregarCategoria(categoria: string): Observable<CatalogoResponse> {
    return this.http.post<CatalogoResponse>(`${this.API_URL}/categorias`,
      { categoria },
      {
        headers: this.authService.getAuthHeaders()
      }
    );
  }

  // ==================== OBTENER TODO EL CATÁLOGO ====================

  obtenerCatalogo(params?: {
    tipo_item?: 'producto' | 'servicio';
    categoria?: string;
    disponible?: boolean;
    orden?: 'nombre' | 'precio' | 'fecha' | 'categoria';
  }): Observable<CatalogoResponse> {
    let httpParams = new HttpParams();

    if (params?.tipo_item) {
      httpParams = httpParams.set('tipo_item', params.tipo_item);
    }
    if (params?.categoria) {
      httpParams = httpParams.set('categoria', params.categoria);
    }
    if (params?.disponible !== undefined) {
      httpParams = httpParams.set('disponible', params.disponible.toString());
    }
    if (params?.orden) {
      httpParams = httpParams.set('orden', params.orden);
    }

    return this.http.get<CatalogoResponse>(this.API_URL, {
      headers: this.authService.getAuthHeaders(),
      params: httpParams
    });
  }

  // ==================== OBTENER ITEM POR ID ====================

  obtenerItem(id: number): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // ==================== CREAR NUEVO ITEM ====================

  crearItem(item: Omit<CatalogoItem, 'id' | 'empresa_id' | 'fecha_creacion' | 'fecha_actualizacion'>): Observable<CatalogoResponse> {
    return this.http.post<CatalogoResponse>(this.API_URL, item, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // ==================== ACTUALIZAR ITEM ====================

  actualizarItem(id: number, item: Partial<CatalogoItem>): Observable<CatalogoResponse> {
    return this.http.put<CatalogoResponse>(`${this.API_URL}/${id}`, item, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // ==================== ELIMINAR ITEM ====================

  eliminarItem(id: number): Observable<CatalogoResponse> {
    return this.http.delete<CatalogoResponse>(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // ==================== BUSCAR ITEMS ====================

  buscarItems(query: string, params?: {
    tipo_item?: 'producto' | 'servicio';
    categoria?: string;
  }): Observable<CatalogoResponse> {
    let httpParams = new HttpParams().set('q', query);

    if (params?.tipo_item) {
      httpParams = httpParams.set('tipo_item', params.tipo_item);
    }
    if (params?.categoria) {
      httpParams = httpParams.set('categoria', params.categoria);
    }

    return this.http.get<CatalogoResponse>(`${this.API_URL}/buscar`, {
      headers: this.authService.getAuthHeaders(),
      params: httpParams
    });
  }

  // ==================== OBTENER ESTADÍSTICAS ====================

  obtenerEstadisticas(): Observable<EstadisticasCatalogo> {
    return this.http.get<EstadisticasCatalogo>(`${this.API_URL}/estadisticas`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // ==================== FILTROS ESPECÍFICOS ====================

  obtenerProductos(params?: { categoria?: string; disponible?: boolean }): Observable<CatalogoResponse> {
    return this.obtenerCatalogo({
      tipo_item: 'producto',
      ...params
    });
  }

  obtenerServicios(params?: { categoria?: string; disponible?: boolean }): Observable<CatalogoResponse> {
    return this.obtenerCatalogo({
      tipo_item: 'servicio',
      ...params
    });
  }

  obtenerPorCategoria(categoria: string): Observable<CatalogoResponse> {
    return this.obtenerCatalogo({ categoria });
  }

  obtenerDisponibles(): Observable<CatalogoResponse> {
    return this.obtenerCatalogo({ disponible: true });
  }

  // ==================== UTILIDADES ====================

  tienePrecio(item: CatalogoItem): boolean {
    return item.precio !== null && item.precio !== undefined && item.precio > 0;
  }

  formatearPrecio(precio: number | null | undefined): string {
    if (!precio) return 'Sin precio';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(precio);
  }

  esProducto(item: CatalogoItem): boolean {
    return item.tipo_item === 'producto';
  }

  esServicio(item: CatalogoItem): boolean {
    return item.tipo_item === 'servicio';
  }

  tieneStock(item: CatalogoItem): boolean {
    return item.stock !== null && item.stock !== undefined && item.stock > 0;
  }

  estaDisponible(item: CatalogoItem): boolean {
    return item.disponible === true;
  }

  formatearDuracion(minutos: number | null | undefined): string {
    if (!minutos) return 'No especificada';

    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    if (horas > 0 && mins > 0) {
      return `${horas}h ${mins}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${mins}min`;
    }
  }

  formatearCategoria(categoria: string | null | undefined): string {
    if (!categoria) return 'Sin categoría';

    // Convertir snake_case a formato legible
    return categoria
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  obtenerTags(item: CatalogoItem): string[] {
    if (!item.tags) return [];
    return item.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  validarItem(item: Partial<CatalogoItem>): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!item.nombre_item || item.nombre_item.trim() === '') {
      errores.push('El nombre del item es obligatorio');
    }

    if (item.nombre_item && item.nombre_item.length > 255) {
      errores.push('El nombre no puede exceder 255 caracteres');
    }

    if (item.tipo_item && !['producto', 'servicio'].includes(item.tipo_item)) {
      errores.push('El tipo debe ser "producto" o "servicio"');
    }

    if (item.precio && item.precio < 0) {
      errores.push('El precio no puede ser negativo');
    }

    if (item.stock && item.stock < 0) {
      errores.push('El stock no puede ser negativo');
    }

    if (item.duracion_minutos && item.duracion_minutos <= 0) {
      errores.push('La duración debe ser mayor a 0 minutos');
    }

    // Validaciones específicas por tipo
    if (item.tipo_item === 'producto') {
      if (item.stock === null || item.stock === undefined) {
        errores.push('Los productos deben tener stock definido');
      }
    }

    if (item.tipo_item === 'servicio') {
      if (!item.duracion_minutos) {
        errores.push('Los servicios deben tener duración definida');
      }
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  // Validar SKU único (puedes implementar validación contra el backend)
  validarSKU(sku: string): Observable<boolean> {
    // Implementar si necesitas validación de SKU único
    return new Observable(observer => {
      observer.next(true);
      observer.complete();
    });
  }
}
