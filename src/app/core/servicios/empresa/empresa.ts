import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Autenticacion } from '../autenticacion/autenticacion';

interface ActualizarEmpresaData {
  nombre?: string;
  correo?: string;
  telefono?: string;
}

interface UsuarioEmpresa {
  nombre: string;
  email: string;
  password: string;
  rol: string;
  telefono?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmpresaService {
  private readonly API_URL = 'http://localhost:3000/api/empresa';

  constructor(
    private http: HttpClient,
    private auth: Autenticacion
  ) {}

  // ==================== EMPRESA ====================
  obtenerEmpresa(): Observable<any> {
    return this.http.get(`${this.API_URL}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  actualizarEmpresa(data: ActualizarEmpresaData): Observable<any> {
    return this.http.put(`${this.API_URL}`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  obtenerEstadisticas(): Observable<any> {
    return this.http.get(`${this.API_URL}/estadisticas`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ── NUEVO: Onboarding ─────────────────────────────────────
  // GET /api/empresa/onboarding
  // Verifica si la empresa completó el onboarding.
  // El guard del dashboard lo llama al cargar.
  obtenerDatosOnboarding(): Observable<any> {
    return this.http.get(`${this.API_URL}/onboarding`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // PUT /api/empresa/onboarding
  // Guarda tipo_negocio y marca onboarding como completado.
  completarOnboarding(tipo_negocio: 'productos' | 'servicios'): Observable<any> {
    return this.http.put(`${this.API_URL}/onboarding`, { tipo_negocio }, {
      headers: this.auth.getAuthHeaders()
    });
  }
  // ─────────────────────────────────────────────────────────

  // ==================== USUARIOS ====================
  listarUsuarios(): Observable<any> {
    return this.http.get(`${this.API_URL}/usuarios`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  crearUsuario(data: UsuarioEmpresa): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  actualizarUsuario(id: string, data: Partial<UsuarioEmpresa>): Observable<any> {
    return this.http.put(`${this.API_URL}/usuarios/${id}`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  eliminarUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/usuarios/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== UTILIDADES ====================
  obtenerIniciales(nombre?: string): string {
    const nombreEmpresa = nombre || 'Empresa';
    return nombreEmpresa
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
