import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Autenticacion } from '../autenticacion/autenticacion';

interface Empresa {
  id: string;
  nombre: string;
  correo?: string;
  telefono?: string;
  tipo: string;
  logo?: string;
  modulos: {
    pedidos: boolean;
    reservas: boolean;
    catalogo: boolean;
  };
  fecha_creacion: string;
  activo: boolean;
}

interface ActualizarEmpresaData {
  nombre?: string;
  correo?: string;
  telefono?: string;
  tipo?: string;
  logo?: string;
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
  private readonly API_URL = 'http://localhost:3000/api/empresa'; // 👈 Ruta correcta

  constructor(
    private http: HttpClient,
    private auth: Autenticacion
  ) {}

  // ==================== OBTENER EMPRESA ====================
  obtenerEmpresa(): Observable<any> {
    return this.http.get(`${this.API_URL}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== ACTUALIZAR EMPRESA ====================
  actualizarEmpresa(data: ActualizarEmpresaData): Observable<any> {
    return this.http.put(`${this.API_URL}`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== OBTENER ESTADÍSTICAS ====================
  obtenerEstadisticas(): Observable<any> {
    return this.http.get(`${this.API_URL}/estadisticas`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== LISTAR USUARIOS DE LA EMPRESA ====================
  listarUsuarios(): Observable<any> {
    return this.http.get(`${this.API_URL}/usuarios`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== CREAR USUARIO ====================
  crearUsuario(data: UsuarioEmpresa): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== ACTUALIZAR USUARIO ====================
  actualizarUsuario(id: string, data: Partial<UsuarioEmpresa>): Observable<any> {
    return this.http.put(`${this.API_URL}/usuarios/${id}`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== ELIMINAR USUARIO ====================
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

  private obtenerEmpresaLocal(): any {
    const empresaStr = localStorage.getItem('empresa');
    return empresaStr ? JSON.parse(empresaStr) : null;
  }

  guardarEmpresaLocal(empresa: Empresa): void {
    localStorage.setItem('empresa', JSON.stringify(empresa));
  }

  limpiarEmpresaLocal(): void {
    localStorage.removeItem('empresa');
  }
}
