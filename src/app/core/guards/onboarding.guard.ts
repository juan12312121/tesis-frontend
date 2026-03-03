import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Autenticacion } from '../servicios/autenticacion/autenticacion';

export const onboardingGuard: CanActivateFn = () => {
  const authService = inject(Autenticacion);
  const router = inject(Router);

  // Si no está autenticado, el authGuard ya lo maneja
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Si completó el onboarding, dejar pasar
  if (authService.onboardingCompletado()) {
    return true;
  }

  // Si no, redirigir al onboarding con el empresaId
  const empresaId = authService.getEmpresaId();
  router.navigate(['/onboarding', empresaId]);
  return false;
};
