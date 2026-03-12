import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Autenticacion } from '../autenticacion/autenticacion';

export interface DisponibilidadServicio {
  id?: number;
  servicio_id: number;
  empresa_id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DisponibilidadService {
  private readonly API_URL = 'http://localhost:3000/api/disponibilidad';

  constructor(private http: HttpClient, private authService: Autenticacion) {}

  obtenerDisponibilidad(servicioId: number): Observable<any> {
    return this.http.get(`${this.API_URL}/${servicioId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  crearDisponibilidad(disponibilidad: Partial<DisponibilidadServicio>): Observable<any> {
    return this.http.post(this.API_URL, disponibilidad, {
      headers: this.authService.getAuthHeaders()
    });
  }

  actualizarDisponibilidad(id: number, disponibilidad: Partial<DisponibilidadServicio>): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}`, disponibilidad, {
      headers: this.authService.getAuthHeaders()
    });
  }

  eliminarDisponibilidad(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  reemplazarDisponibilidad(servicioId: number, empresa_id: string | number, horarios: any[]): Observable<any> {
    return this.http.post(`${this.API_URL}/bulk/${servicioId}`, { empresa_id, horarios }, {
      headers: this.authService.getAuthHeaders()
    });
  }
}


