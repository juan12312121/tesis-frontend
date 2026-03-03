// app.routes.ts
import { Routes } from '@angular/router';
import { InicioComponent } from './paginas/inicio/inicio';
import { RegistroComponent } from './autenticacion/registro/registro';
import { Login } from './autenticacion/login/login';
import { DashboardComponent } from './paginas/dashboard/dashboard';
import { ConfigurarBotComponent } from './paginas/configurar-bot/configurar-bot';
import { CatalogosUniversal } from './paginas/catalogos-universal/catalogos-universal';
import { ConfiguracionCatalogo } from './componentes-catalogo/configuracion-catalogo/configuracion-catalogo';
import { Pedidos } from './paginas/pedidos/pedidos';
import { OnboardingComponent } from './paginas/onboarding/onboarding';
import { authGuard } from './core/guards/auth.guard';
import { onboardingGuard } from './core/guards/onboarding.guard';

export const routes: Routes = [
  // ── RUTAS PÚBLICAS ──────────────────────────────────
  {
    path: '',
    component: InicioComponent,
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'registro',
    component: RegistroComponent
  },

  // ── ONBOARDING (requiere auth pero NO onboarding completado) ──
  {
    path: 'onboarding/:id',
    component: OnboardingComponent,
    canActivate: [authGuard]
  },

  // ── RUTAS PROTEGIDAS (requieren auth + onboarding completado) ──
  {
    path: 'dashboard/:id',
    component: DashboardComponent,
    canActivate: [authGuard, onboardingGuard]
  },
  {
    path: ':id/configuracion-bot',
    component: ConfigurarBotComponent,
    canActivate: [authGuard, onboardingGuard]
  },
  {
    path: ':id/catalogos',
    component: CatalogosUniversal,
    canActivate: [authGuard, onboardingGuard]
  },
  {
    path: 'configuracion/:id',
    component: ConfiguracionCatalogo,
    canActivate: [authGuard, onboardingGuard]
  },
  {
    path: ':id/pedidos',
    component: Pedidos,
    canActivate: [authGuard, onboardingGuard]
  },

  // ── FALLBACK ────────────────────────────────────────
  {
    path: '**',
    redirectTo: ''
  }
];
