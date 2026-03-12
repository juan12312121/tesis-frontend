import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Autenticacion } from '../autenticacion/autenticacion';

export interface CategoriaServicio {
  id?: number;
  empresa_id: number;
  nombre: string;
  descripcion?: string;
  activa?: boolean;
}

export interface CatalogoServicio {
  id?: number;
  empresa_id: number;
  categoria_id?: number;
  nombre: string;
  descripcion?: string;
  precio?: number;
  duracion_minutos?: number;
  requiere_agendamiento?: boolean;
  disponible?: boolean;
  imagen_url?: string;
  tags?: string;
  categoria?: CategoriaServicio;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoServiciosService {
  private readonly API_URL_SERVICIOS = 'http://localhost:3000/api/catalogo-servicios';
  private readonly API_URL_CATEGORIAS = 'http://localhost:3000/api/categorias-servicios';

  constructor(private http: HttpClient, private authService: Autenticacion) {}

  // ==================== CATEGORIAS DE SERVICIOS ====================

  obtenerCategorias(empresaId: string | number): Observable<any> {
    return this.http.get(`${this.API_URL_CATEGORIAS}/${empresaId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  crearCategoria(categoria: Partial<CategoriaServicio>): Observable<any> {
    return this.http.post(this.API_URL_CATEGORIAS, categoria, {
      headers: this.authService.getAuthHeaders()
    });
  }

  actualizarCategoria(id: number, categoria: Partial<CategoriaServicio>): Observable<any> {
    return this.http.put(`${this.API_URL_CATEGORIAS}/${id}`, categoria, {
      headers: this.authService.getAuthHeaders()
    });
  }

  eliminarCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL_CATEGORIAS}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // ==================== CATALOGO DE SERVICIOS ====================

  obtenerServicios(empresaId: string | number): Observable<any> {
    return this.http.get(`${this.API_URL_SERVICIOS}/${empresaId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  obtenerServiciosPublico(empresaId: string | number): Observable<any> {
    return this.http.get(`${this.API_URL_SERVICIOS}/publico/${empresaId}`);
  }

  obtenerDetalleServicio(id: number): Observable<any> {
    return this.http.get(`${this.API_URL_SERVICIOS}/detalle/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  crearServicio(servicio: Partial<CatalogoServicio>): Observable<any> {
    return this.http.post(this.API_URL_SERVICIOS, servicio, {
      headers: this.authService.getAuthHeaders()
    });
  }

  actualizarServicio(id: number, servicio: Partial<CatalogoServicio>): Observable<any> {
    return this.http.put(`${this.API_URL_SERVICIOS}/${id}`, servicio, {
      headers: this.authService.getAuthHeaders()
    });
  }

  eliminarServicio(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL_SERVICIOS}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}


