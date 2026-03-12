import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Autenticacion } from '../../core/servicios/autenticacion/autenticacion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(Autenticacion);
  private router = inject(Router);

  loginForm: FormGroup;
  showPassword = false;
  responseMessage: { show: boolean; success: boolean; text: string } = {
    show: false,
    success: false,
    text: ''
  };
  isSubmitting = false;

  constructor() {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      recordar: [false]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Maneja el evento de envio del formulario de inicio de sesion.
   * Valida que el formulario sea correcto antes de proceder con la autenticacion.
   */
  onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }
    this.isSubmitting = true;
    this.iniciarSesion();
  }

  /**
   * Ejecuta el proceso de autenticacion comunicandose con el servicio correspondiente.
   * Verifica el estado del onboarding del usuario para redirigirlo a la pantalla adecuada.
   */
  private iniciarSesion(): void {
    const { correo, password } = this.loginForm.value;

    this.authService.login({
      correo,
      contraseña: password
    }).subscribe({
      next: (response) => {
        if (response.success && response.token && response.usuario) {
          this.showMessage(true, '¡Inicio de sesión exitoso! Redirigiendo...');

          const empresaId = response.usuario.empresa_id;

          // Nota: si el usuario no ha completado el flujo de configuracion inicial (onboarding),
          // se le redirige a dicha pantalla antes de permitirle acceder al dashboard.
          const onboardingCompletado = response.usuario.empresa?.onboarding_completado;

          setTimeout(() => {
            if (!onboardingCompletado) {
              this.router.navigate(['/onboarding', empresaId]);
            } else {
              this.router.navigate(['/dashboard', empresaId]);
            }
          }, 1500);

        } else {
          this.showMessage(false, response.message || 'Error al iniciar sesión');
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        console.error('Error de login:', error);
        const mensaje = error.error?.message ||
          error.message ||
          'Error al iniciar sesión. Por favor intenta nuevamente.';
        this.showMessage(false, mensaje);
        this.isSubmitting = false;
      }
    });
  }

  showMessage(success: boolean, message: string): void {
    this.responseMessage = { show: true, success, text: message };
  }

  hideMessage(): void {
    this.responseMessage.show = false;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  get correo() { return this.loginForm.get('correo'); }
  get password() { return this.loginForm.get('password'); }
}
