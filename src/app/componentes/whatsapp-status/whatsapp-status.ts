import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { InstanciasService } from '../../core/servicios/instancias/instancias';
import { API_BASE_URL } from '../../core/config/api.config';

interface EstadoWhatsApp {
  conectado: boolean;
  numero?: string;
  nombre?: string;
  qr?: string;
  mensaje?: string;
  ultimaVerificacion?: Date;
}

interface Notificacion {
  mostrar: boolean;
  tipo: 'success' | 'error' | 'info';
  titulo: string;
  mensaje: string;
}

@Component({
  selector: 'app-whatsapp-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-status.html',
  styleUrl: './whatsapp-status.css'
})
export class WhatsappStatus implements OnInit, OnDestroy {
  @Input() empresaId!: string;

  estado: EstadoWhatsApp = {
    conectado: false,
    mensaje: 'Inicializando...'
  };

  verificando = false;
  conectando = false;
  desconectando = false;
  regenerando = false;

  autoVerificacionActiva = true;
  intervaloVerificacion = 10000; // 10 segundos
  private verificacionSubscription?: Subscription;

  get isMobile(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  }

  notificacion: Notificacion = {
    mostrar: false,
    tipo: 'info',
    titulo: '',
    mensaje: ''
  };

  constructor(private instanciasService: InstanciasService) {}

  ngOnInit(): void {
    this.verificarEstado();
    this.iniciarAutoVerificacion();
  }

  ngOnDestroy(): void {
    this.detenerAutoVerificacion();
  }

  async verificarEstado(): Promise<void> {
    if (this.verificando) return;

    this.verificando = true;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/whatsapp/public/estado/${this.empresaId}/empresa_${this.empresaId}`
      );

      const data = await response.json();

      if (data.success) {
        this.estado = {
          conectado: data.conectado,
          numero: data.numero,
          nombre: data.nombre,
          ultimaVerificacion: new Date()
        };

        // Si no está conectado, intentar obtener QR
        if (!this.estado.conectado) {
          try {
            const qrResponse = await fetch(
              `${API_BASE_URL}/api/whatsapp/public/obtener-qr/${this.empresaId}/empresa_${this.empresaId}`
            );
            const qrData = await qrResponse.json();

            if (qrData.success && qrData.qr) {
              this.estado.qr = qrData.qr;
            }
          } catch (qrError) {
            console.log('No hay QR disponible');
          }
        }
      } else {
        this.estado = {
          conectado: false,
          mensaje: data.mensaje || 'Error al verificar el estado',
          ultimaVerificacion: new Date()
        };
      }
    } catch (error: any) {
      console.error('Error verificando estado:', error);
      this.estado = {
        conectado: false,
        mensaje: 'Error de conexión con el servidor',
        ultimaVerificacion: new Date()
      };
    } finally {
      this.verificando = false;
    }
  }

  async iniciarConexion(): Promise<void> {
    this.conectando = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/public/iniciar-sesion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: this.empresaId,
          nombreSesion: `empresa_${this.empresaId}`
        })
      });

      const data = await response.json();

      if (data.success) {
        this.mostrarNotificacion('success', 'Conexión iniciada', 'Esperando escaneo de QR...');

        // Esperar 2 segundos y verificar estado (debería tener QR)
        setTimeout(() => {
          this.verificarEstado();
        }, 2000);
      } else {
        throw new Error(data.message || 'Error al iniciar conexión');
      }
    } catch (error: any) {
      console.error('Error iniciando conexión:', error);
      this.mostrarNotificacion('error', 'Error', error.message || 'No se pudo iniciar la conexión');
    } finally {
      this.conectando = false;
    }
  }

  async regenerarQR(): Promise<void> {
    this.regenerando = true;

    try {
      // Primero cerrar la sesión actual
      await fetch(
        `${API_BASE_URL}/api/whatsapp/public/cerrar-sesion/${this.empresaId}/empresa_${this.empresaId}`,
        { method: 'POST' }
      );

      // Esperar 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Iniciar nueva sesión
      await this.iniciarConexion();

      this.mostrarNotificacion('info', 'QR Regenerado', 'Escanea el nuevo código QR');
    } catch (error: any) {
      console.error('Error regenerando QR:', error);
      this.mostrarNotificacion('error', 'Error', 'No se pudo regenerar el QR');
    } finally {
      this.regenerando = false;
    }
  }

  async desconectar(): Promise<void> {
    if (!confirm('¿Estás seguro de que deseas desconectar WhatsApp? Tendrás que escanear el QR nuevamente.')) {
      return;
    }

    this.desconectando = true;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/whatsapp/public/cerrar-sesion/${this.empresaId}/empresa_${this.empresaId}`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (data.success) {
        this.estado = {
          conectado: false,
          mensaje: 'Sesión cerrada correctamente',
          ultimaVerificacion: new Date()
        };
        this.mostrarNotificacion('success', 'Desconectado', 'WhatsApp ha sido desconectado');
      } else {
        throw new Error(data.message || 'Error al desconectar');
      }
    } catch (error: any) {
      console.error('Error desconectando:', error);
      this.mostrarNotificacion('error', 'Error', error.message || 'No se pudo desconectar');
    } finally {
      this.desconectando = false;
    }
  }

  async cancelarConexion(): Promise<void> {
    await this.desconectar();
  }

  iniciarAutoVerificacion(): void {
    if (this.autoVerificacionActiva) {
      this.verificacionSubscription = interval(this.intervaloVerificacion).subscribe(() => {
        this.verificarEstado();
      });
    }
  }

  detenerAutoVerificacion(): void {
    if (this.verificacionSubscription) {
      this.verificacionSubscription.unsubscribe();
    }
  }

  toggleAutoVerificacion(): void {
    this.autoVerificacionActiva = !this.autoVerificacionActiva;

    if (this.autoVerificacionActiva) {
      this.iniciarAutoVerificacion();
      this.mostrarNotificacion('info', 'Auto-verificación activada', 'El estado se verificará automáticamente');
    } else {
      this.detenerAutoVerificacion();
      this.mostrarNotificacion('info', 'Auto-verificación desactivada', 'Verifica el estado manualmente');
    }
  }

  getEstadoTexto(): string {
    if (this.estado.conectado) {
      return 'Activo y funcionando correctamente';
    } else if (this.estado.qr) {
      return 'Esperando escaneo de código QR';
    } else {
      return 'Conexión no establecida';
    }
  }

  mostrarNotificacion(tipo: 'success' | 'error' | 'info', titulo: string, mensaje: string): void {
    this.notificacion = {
      mostrar: true,
      tipo,
      titulo,
      mensaje
    };

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      this.cerrarNotificacion();
    }, 5000);
  }

  cerrarNotificacion(): void {
    this.notificacion.mostrar = false;
  }
}
