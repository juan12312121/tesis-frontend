import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Autenticacion } from '../autenticacion/autenticacion';

export interface Reservacion {
  id: number;
  empresa_id: number;
  servicio_id: number;
  nombre_cliente: string;
  telefono_cliente: string;
  fecha_reservacion: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  numero_personas?: number;
  notas?: string;
  servicio?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReservacionesService {
  private readonly API_URL = 'http://localhost:3000/api/reservaciones';

  constructor(private http: HttpClient, private authService: Autenticacion) {}

  obtenerReservaciones(empresaId: string | number, estado?: string, fecha?: string): Observable<any> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    if (fecha) params = params.set('fecha', fecha);

    return this.http.get(`${this.API_URL}/${empresaId}`, {
      headers: this.authService.getAuthHeaders(),
      params
    });
  }

  obtenerReservacionesCliente(telefono: string, empresaId: string | number): Observable<any> {
    return this.http.get(`${this.API_URL}/cliente/${telefono}/${empresaId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  crearReservacion(reservacion: Partial<Reservacion>): Observable<any> {
    return this.http.post(this.API_URL, reservacion, {
      headers: this.authService.getAuthHeaders()
    });
  }

  actualizarEstado(id: number, estado: 'pendiente' | 'confirmada' | 'cancelada'): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}/estado`, { estado }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  actualizarReservacion(id: number, reservacion: Partial<Reservacion>): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}`, reservacion, {
      headers: this.authService.getAuthHeaders()
    });
  }

  eliminarReservacion(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}


