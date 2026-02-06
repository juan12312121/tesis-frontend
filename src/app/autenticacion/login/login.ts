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
    // Inicializar formulario con validaciones
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      recordar: [false]
    });
  }

  // Toggle para mostrar/ocultar contraseña
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // Método principal de submit del formulario
  onSubmit(): void {
    // Validar formulario antes de enviar
    if (this.loginForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isSubmitting = true;
    this.iniciarSesion();
  }

  // Lógica de inicio de sesión
  private iniciarSesion(): void {
    const { correo, password } = this.loginForm.value;

    // Llamar al servicio de autenticación
    this.authService.login({
      correo,
      contraseña: password  // Mapear 'password' a 'contraseña' para el backend
    }).subscribe({
      next: (response) => {
        if (response.success && response.token && response.usuario) {
          // Login exitoso
          this.showMessage(true, '¡Inicio de sesión exitoso! Redirigiendo...');

          // Obtener el ID de la empresa del usuario
          const empresaId = response.usuario.empresa_id;

          // Redireccionar al dashboard específico de la empresa
          setTimeout(() => {
            this.router.navigate(['/dashboard', empresaId]);
          }, 1500);
        } else {
          // Error en la respuesta del servidor
          this.showMessage(false, response.message || 'Error al iniciar sesión');
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        // Error de conexión o servidor
        console.error('Error de login:', error);

        // Extraer mensaje de error del backend si existe
        const mensaje = error.error?.message ||
                       error.message ||
                       'Error al iniciar sesión. Por favor intenta nuevamente.';

        this.showMessage(false, mensaje);
        this.isSubmitting = false;
      }
    });
  }

  // Mostrar mensaje de éxito o error
  showMessage(success: boolean, message: string): void {
    this.responseMessage = {
      show: true,
      success,
      text: message
    };
  }

  // Ocultar mensaje
  hideMessage(): void {
    this.responseMessage.show = false;
  }

  // Marcar todos los campos como tocados para mostrar validaciones
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para acceder fácilmente a los controles del formulario en el template
  get correo() {
    return this.loginForm.get('correo');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
