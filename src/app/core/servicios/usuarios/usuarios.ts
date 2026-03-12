import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Autenticacion } from '../autenticacion/autenticacion';
import { API_URL } from '../../config/api.config';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  telefono?: string;
  empresa_id: string;
  activo: boolean;
  fecha_creacion: string;
}

interface ActualizarUsuarioData {
  nombre?: string;
  telefono?: string;
  email?: string;
}

interface CambiarPasswordData {
  passwordActual: string;
  passwordNueva: string;
}

@Injectable({
  providedIn: 'root',
})
export class Usuarios {
  private readonly API_URL = API_URL;

  constructor(
    private http: HttpClient,
    private auth: Autenticacion
  ) {}

  // ==================== OBTENER PERFIL ====================
  obtenerPerfil(): Observable<any> {
    return this.http.get(`${this.API_URL}/usuarios/perfil`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== OBTENER USUARIO POR ID ====================
  obtenerUsuario(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/usuarios/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== ACTUALIZAR PERFIL ====================
  actualizarPerfil(data: ActualizarUsuarioData): Observable<any> {
    return this.http.put(`${this.API_URL}/usuarios/perfil`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== CAMBIAR CONTRASEÑA ====================
  cambiarPassword(data: CambiarPasswordData): Observable<any> {
    return this.http.put(`${this.API_URL}/usuarios/cambiar-password`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== LISTAR USUARIOS DE LA EMPRESA ====================
  listarUsuariosEmpresa(): Observable<any> {
    const empresaId = this.auth.getEmpresaId();
    return this.http.get(`${this.API_URL}/usuarios/empresa/${empresaId}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== CREAR USUARIO (ADMIN) ====================
  crearUsuario(data: {
    nombre: string;
    email: string;
    password: string;
    rol: string;
    telefono?: string;
  }): Observable<any> {
    const empresaId = this.auth.getEmpresaId();
    return this.http.post(`${this.API_URL}/usuarios`, {
      ...data,
      empresa_id: empresaId
    }, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== ACTUALIZAR USUARIO (ADMIN) ====================
  actualizarUsuario(id: string, data: ActualizarUsuarioData): Observable<any> {
    return this.http.put(`${this.API_URL}/usuarios/${id}`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== CAMBIAR ROL (ADMIN) ====================
  cambiarRol(id: string, nuevoRol: string): Observable<any> {
    return this.http.put(`${this.API_URL}/usuarios/${id}/rol`, {
      rol: nuevoRol
    }, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== ACTIVAR/DESACTIVAR USUARIO (ADMIN) ====================
  toggleActivarUsuario(id: string, activo: boolean): Observable<any> {
    return this.http.put(`${this.API_URL}/usuarios/${id}/estado`, {
      activo
    }, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== ELIMINAR USUARIO (ADMIN) ====================
  eliminarUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/usuarios/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== SUBIR FOTO DE PERFIL ====================
  subirFotoPerfil(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('foto', file);

    return this.http.post(`${this.API_URL}/usuarios/foto-perfil`, formData, {
      headers: {
        'Authorization': `Bearer ${this.auth.getToken()}`
      }
    });
  }

  // ==================== OBTENER ESTADÍSTICAS DE USUARIO ====================
  obtenerEstadisticas(usuarioId?: string): Observable<any> {
    const id = usuarioId || this.auth.getUsuario()?.id;
    return this.http.get(`${this.API_URL}/usuarios/${id}/estadisticas`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==================== VERIFICAR SI ES ADMIN ====================
  esAdmin(): boolean {
    const usuario = this.auth.getUsuario();
    return usuario?.rol === 'administrador' || usuario?.rol === 'admin';
  }

  // ==================== OBTENER INICIALES DEL USUARIO ====================
 obtenerIniciales(nombre?: string): string {
  const nombreUsuario = nombre || this.auth.getUsuario()?.nombre || 'Usuario';
  return nombreUsuario
    .split(' ')
    .map((word: string) => word[0])  //  Agrega el tipo aquí
    .join('')
    .substring(0, 2)
    .toUpperCase();
}
}
