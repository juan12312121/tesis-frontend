import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { API_URL } from '../../config/api.config';

interface RegistroData {
  nombre_empresa: string;
  correo_empresa?: string;
  telefono_empresa?: string;
  nombre_usuario: string;
  correo_usuario: string;
  contraseña_usuario: string;
  telefono_usuario?: string;
}

interface LoginData {
  correo: string;
  contraseña: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  usuario?: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    empresa_id: string;
    empresa?: {
      id: string;
      nombre: string;
      tipo_negocio: 'productos' | 'servicios' | null;
      onboarding_completado: boolean;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class Autenticacion {
  private readonly API_URL = API_URL;

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ==================== REGISTRO ====================
  registro(data: RegistroData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/registro`, data);
  }

  // ==================== LOGIN ====================
  login(data: LoginData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, data)
      .pipe(
        tap(response => {
          if (response.success && response.token && response.usuario) {
            this.setSession(response.token, response.usuario);
          }
        })
      );
  }

  // ==================== LOGOUT ====================
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('empresaId');
    localStorage.removeItem('usuario');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ==================== GESTIÓN DE SESIÓN ====================
  private setSession(token: string, usuario: any): void {
    localStorage.setItem('token', token);
    localStorage.setItem('empresaId', usuario.empresa_id);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(usuario);
  }

  // ==================== UTILIDADES ====================
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getEmpresaId(): string | null {
    return localStorage.getItem('empresaId');
  }

  getUsuario(): any {
    return this.getUserFromStorage();
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  // ── NUEVO ──────────────────────────────────────────────────
  // Lee tipo_negocio del objeto usuario guardado en localStorage.
  // Lo usa el frontend para personalizar la UI sin hacer un GET extra.
  getTipoNegocio(): 'productos' | 'servicios' | null {
    return this.getUsuario()?.empresa?.tipo_negocio ?? null;
  }

  esNegocioProductos(): boolean {
    return this.getTipoNegocio() === 'productos';
  }

  esNegocioServicios(): boolean {
    return this.getTipoNegocio() === 'servicios';
  }

  onboardingCompletado(): boolean {
    return this.getUsuario()?.empresa?.onboarding_completado === true;
  }

  // Actualiza el usuario en localStorage después del onboarding
  // sin necesidad de hacer logout/login
  actualizarTipoNegocio(tipo_negocio: 'productos' | 'servicios'): void {
    const usuario = this.getUsuario();
    if (usuario) {
      if (!usuario.empresa) usuario.empresa = {};
      usuario.empresa.tipo_negocio = tipo_negocio;
      usuario.empresa.onboarding_completado = true;
      localStorage.setItem('usuario', JSON.stringify(usuario));
      this.currentUserSubject.next(usuario);
    }
  }
  // ── FIN NUEVO ──────────────────────────────────────────────

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private getUserFromStorage(): any {
    const user = localStorage.getItem('usuario');
    return user ? JSON.parse(user) : null;
  }

  // ==================== HEADERS PARA PETICIONES ====================
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ==================== VERIFICAR EMAIL ====================
  verificarEmail(token: string) {
    return this.http.get(`${this.API_URL}/auth/verificar-email?token=${token}`);
  }

  // ==================== RECUPERAR CONTRASEÑA ====================
  solicitarRecuperacion(correo: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/recuperar-password`, { correo });
  }

  cambiarPassword(token: string, nuevaPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/cambiar-password`, { token, nuevaPassword });
  }
}
