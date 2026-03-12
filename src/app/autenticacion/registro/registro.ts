import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Autenticacion } from '../../core/servicios/autenticacion/autenticacion';
import { InstanciasService } from '../../core/servicios/instancias/instancias';
import { EmpresaService } from '../../core/servicios/empresa/empresa';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})
export class RegistroComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(Autenticacion);
  private whatsappService = inject(InstanciasService);
  private empresaService = inject(EmpresaService);

  currentStep = 1;
  showPassword = false;
  showMessage = false;
  messageType: 'success' | 'error' = 'success';
  messageText = '';

  step1Form!: FormGroup;
  step2Form!: FormGroup;

  datosUsuario: any = {};
  qrCode: string = '';
  whatsappConnected = false;
  isGeneratingQR = false;
  isSubmitting = false;
  qrCheckInterval: any = null;
  verificacionEmailPendiente = false;

  ngOnInit(): void {
    this.initializeForms();
  }

  ngOnDestroy(): void {
    this.detenerVerificaciones();
  }

  initializeForms(): void {
    this.step1Form = this.fb.group({
      nombre_usuario: ['', [Validators.required, Validators.minLength(3)]],
      correo_usuario: ['', [Validators.required, Validators.email]],
      telefono_usuario: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{10,}$/)]],
      contraseña_usuario: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.step2Form = this.fb.group({
      nombre_empresa: ['', [Validators.required, Validators.minLength(3)]],
      correo_empresa: ['', [Validators.required, Validators.email]],
      telefono_empresa: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{10,}$/)]]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  getMainTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Crea tu cuenta';
      case 2: return 'Datos de tu empresa';
      case 3:
        if (this.verificacionEmailPendiente) {
          return 'Verifica tu correo';
        }
        return 'Conecta tu WhatsApp';
      case 4: return '¡Todo listo!';
      default: return '';
    }
  }

  getMainSubtitle(): string {
    switch (this.currentStep) {
      case 1: return 'Ingresa tus datos personales para comenzar';
      case 2: return 'Configura la información de tu negocio';
      case 3:
        if (this.verificacionEmailPendiente) {
          return 'Revisa tu correo para verificar tu cuenta antes de conectar WhatsApp';
        }
        return 'Escanea el código QR con WhatsApp para vincular tu cuenta';
      case 4: return 'Tu cuenta ha sido creada y WhatsApp conectado exitosamente';
      default: return '';
    }
  }

  getStepCircleClass(step: number): string {
    if (this.currentStep > step) {
      return 'bg-green-500 text-white';
    } else if (this.currentStep === step) {
      return 'bg-blue-600 text-white';
    } else {
      return 'bg-gray-200 text-gray-500';
    }
  }

  getStepTextClass(step: number): string {
    if (this.currentStep > step) {
      return 'text-green-500';
    } else if (this.currentStep === step) {
      return 'text-blue-600';
    } else {
      return 'text-gray-500';
    }
  }

  isStepComplete(step: number): boolean {
    return this.currentStep > step;
  }

  submitStep1(): void {
    if (this.step1Form.valid) {
      Object.assign(this.datosUsuario, this.step1Form.value);
      this.currentStep = 2;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  volverStep1(): void {
    this.currentStep = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverStep2(): void {
    this.currentStep = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Envia los datos completos del usuario y la empresa al backend para generar el registro.
   * Maneja el estado de carga y las validaciones de error. Tras un registro exitoso,
   * indica al componente que proceda con la verificacion por correo electronico.
   */
  async submitStep2(): Promise<void> {
    if (this.step2Form.valid && !this.isSubmitting) {
      Object.assign(this.datosUsuario, this.step2Form.value);
      this.isSubmitting = true;

      try {
        console.log(' Registrando usuario y empresa...', this.datosUsuario);

        // Llamar al servicio de registro
        this.authService.registro(this.datosUsuario).subscribe({
          next: (response) => {
            console.log(' Respuesta del registro:', response);

            if (response.success) {
              // Guardar información temporalmente
              if (response.usuario) {
                this.datosUsuario.usuario_id = response.usuario.id;
                this.datosUsuario.empresa_id = response.usuario.empresa_id;
              }

              // Mostrar mensaje de verificación de correo
              this.displayMessage(
                'success',
                `¡Registro exitoso! Se ha enviado un correo de verificación a ${this.datosUsuario.correo_usuario}. Por favor, verifica tu cuenta.`
              );

              // Marcar que está pendiente la verificación
              this.verificacionEmailPendiente = true;

              // Ir al paso 3 (espera de verificación)
              this.currentStep = 3;
              this.isSubmitting = false;
              window.scrollTo({ top: 0, behavior: 'smooth' });

              // Iniciar verificación automática del email
              this.iniciarVerificacionEmail();

            } else {
              this.displayMessage('error', response.message || 'Error al crear la cuenta');
              this.isSubmitting = false;
            }
          },
          error: (error) => {
            console.error(' Error en el registro:', error);
            this.displayMessage(
              'error',
              error.error?.message || 'Error al crear la cuenta. Por favor intenta nuevamente.'
            );
            this.isSubmitting = false;
          }
        });

      } catch (error) {
        console.error(' Error:', error);
        this.displayMessage('error', 'Error al crear la cuenta. Por favor intenta nuevamente.');
        this.isSubmitting = false;
      }
    }
  }

  // ==================== VERIFICACION DE EMAIL ====================

  /**
   * Inicia un temporizador que consulta de forma periodica al servidor para verificar
   * si el usuario activo ha validado su correo electronico haciendo clic en el enlace.
   * Tambien establece un tiempo maximo (timeout) tras el cual se detienen las consultas.
   */
  iniciarVerificacionEmail(): void {
    console.log(' Iniciando verificación automática de email...');

    // Verificar cada 5 segundos si el usuario verificó su email
    this.qrCheckInterval = setInterval(() => {
      this.verificarEstadoEmail();
    }, 5000);

    // Timeout de 10 minutos
    setTimeout(() => {
      if (this.verificacionEmailPendiente) {
        this.detenerVerificaciones();
        this.displayMessage(
          'error',
          'El tiempo de espera ha expirado. Por favor verifica tu correo y vuelve a iniciar sesión.'
        );
      }
    }, 600000); // 10 minutos
  }

  async verificarEstadoEmail(): Promise<void> {
    try {
      // Intentar hacer login para verificar si el email fue validado
      this.authService.login({
        correo: this.datosUsuario.correo_usuario,
        contraseña: this.datosUsuario.contraseña_usuario
      }).subscribe({
        next: (response) => {
          if (response.success && response.token) {
            // Email verificado exitosamente
            console.log(' Email verificado, procediendo a conectar WhatsApp');
            this.detenerVerificaciones();
            this.verificacionEmailPendiente = false;

            this.displayMessage('success', '¡Email verificado! Ahora conecta tu WhatsApp');

            // Generar QR de WhatsApp
            setTimeout(() => {
              this.generateQRCode();
            }, 2000);
          }
        },
        error: (error) => {
          // Si el error es por email no verificado, seguir esperando
          if (error.error?.message?.includes('verificado') || error.error?.message?.includes('verify')) {
            console.log('⏳ Esperando verificación de email...');
          } else {
            console.error('Error al verificar estado:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error en verificación:', error);
    }
  }

  // ==================== GENERACION DE QR WHATSAPP ====================

  /**
   * Solicita a la API la generacion de un codigo QR para vincular la cuenta de WhatsApp
   * de la empresa. Inicia de manera concurrente un intervalo de verificacion para 
   * detectar cuando el cliente realiza el escaneo del codigo desde su telefono.
   */
  async generateQRCode(): Promise<void> {
    try {
      this.isGeneratingQR = true;
      this.qrCode = '';

      console.log(' Solicitando código QR de WhatsApp...');

      this.whatsappService.obtenerQR().subscribe({
        next: (response) => {
          console.log(' Respuesta QR:', response);

          if (response.success && response.qrCode) {
            this.qrCode = response.qrCode;
            this.isGeneratingQR = false;

            this.displayMessage('success', 'Escanea el código QR con tu WhatsApp');

            // Iniciar verificación de conexión de WhatsApp
            this.startCheckingWhatsAppConnection();

          } else if (response.conectado) {
            // Ya está conectado
            console.log(' WhatsApp ya está conectado');
            this.onWhatsAppConnected();

          } else {
            this.displayMessage('error', response.message || 'Error al generar código QR');
            this.isGeneratingQR = false;
          }
        },
        error: (error) => {
          console.error(' Error al generar QR:', error);
          this.displayMessage('error', 'Error al generar código QR. Intenta nuevamente.');
          this.isGeneratingQR = false;
        }
      });

    } catch (error) {
      console.error(' Error al generar QR:', error);
      this.displayMessage('error', 'Error al generar código QR. Intenta nuevamente.');
      this.isGeneratingQR = false;
    }
  }

  startCheckingWhatsAppConnection(): void {
    // Limpiar cualquier intervalo previo
    this.detenerVerificaciones();

    console.log(' Iniciando verificación de conexión WhatsApp...');

    // Verificar conexión cada 3 segundos
    this.qrCheckInterval = setInterval(() => {
      this.checkWhatsAppStatus();
    }, 3000);

    // Timeout de 2 minutos para el QR
    setTimeout(() => {
      if (!this.whatsappConnected && this.qrCheckInterval) {
        this.detenerVerificaciones();
        this.displayMessage('error', 'El código QR ha expirado. Genera uno nuevo.');
      }
    }, 120000); // 2 minutos
  }

  async checkWhatsAppStatus(): Promise<void> {
    try {
      this.whatsappService.obtenerEstado().subscribe({
        next: (response) => {
          if (response.success && response.data.conectado) {
            console.log(' WhatsApp conectado exitosamente');
            this.onWhatsAppConnected();
          }
        },
        error: (error) => {
          console.error('Error al verificar estado de WhatsApp:', error);
        }
      });
    } catch (error) {
      console.error('Error al verificar estado de WhatsApp:', error);
    }
  }

  onWhatsAppConnected(): void {
    this.detenerVerificaciones();

    this.whatsappConnected = true;
    this.whatsappService.guardarEstadoConexion('conectado');

    this.displayMessage('success', '¡WhatsApp conectado exitosamente!');

    // Esperar 2 segundos y luego ir al paso final
    setTimeout(() => {
      this.currentStep = 4;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2000);
  }

  goToDashboard(): void {
    // Navegar al dashboard con el ID de la empresa recién creada
    if (this.datosUsuario.empresa_id) {
      this.router.navigate(['/dashboard', this.datosUsuario.empresa_id]);
    } else {
      // Si no hay empresa_id, ir a login
      this.router.navigate(['/login']);
    }
  }

  regenerateQR(): void {
    this.whatsappConnected = false;
    this.qrCode = '';
    this.detenerVerificaciones();
    this.generateQRCode();
  }

  // Método para reenviar email de verificación
  reenviarVerificacion(): void {
    this.isSubmitting = true;

    this.authService.registro(this.datosUsuario).subscribe({
      next: (response) => {
        if (response.success) {
          this.displayMessage('success', 'Se ha reenviado el correo de verificación');
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.displayMessage('error', 'Error al reenviar el correo');
        this.isSubmitting = false;
      }
    });
  }

  // Continuar sin verificar email (solo si es permitido por el backend)
  continuarSinVerificar(): void {
    this.detenerVerificaciones();
    this.verificacionEmailPendiente = false;
    this.generateQRCode();
  }

  private detenerVerificaciones(): void {
    if (this.qrCheckInterval) {
      clearInterval(this.qrCheckInterval);
      this.qrCheckInterval = null;
    }
  }

  displayMessage(type: 'success' | 'error', text: string): void {
    this.messageType = type;
    this.messageText = text;
    this.showMessage = true;

    // Auto-cerrar mensaje después de 8 segundos
    setTimeout(() => {
      this.showMessage = false;
    }, 8000);
  }

  closeMessage(): void {
    this.showMessage = false;
  }
}
