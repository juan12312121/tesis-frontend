// app.routes.ts
import { Routes } from '@angular/router';
import { InicioComponent } from './paginas/inicio/inicio';
import { RegistroComponent } from './autenticacion/registro/registro';
import { Login } from './autenticacion/login/login';
import { DashboardComponent } from './paginas/dashboard/dashboard';
import { ConfigurarBotComponent } from './paginas/configurar-bot/configurar-bot';
import { CatalogosUniversal } from './paginas/catalogos-universal/catalogos-universal';
import { CatalogoServiciosComponent } from './paginas/catalogo-servicios/catalogo-servicios';
import { ConfiguracionCatalogo } from './componentes-catalogo/configuracion-catalogo/configuracion-catalogo';
import { Pedidos } from './paginas/pedidos/pedidos';
import { ReservacionesComponent } from './paginas/reservaciones/reservaciones';
import { OnboardingComponent } from './paginas/onboarding/onboarding';
import { authGuard } from './core/guards/auth.guard';
import { onboardingGuard } from './core/guards/onboarding.guard';

export const routes: Routes = [
  // Rutas de acceso publico que no requieren autenticacion previa
  {
    path: '',
    component: InicioComponent,
    pathMatch: 'full' // Redirige a la pagina de inicio por defecto
  },
  {
    path: 'login',
    component: Login // Pagina de inicio de sesion para usuarios existentes
  },
  {
    path: 'registro',
    component: RegistroComponent // Pagina para registro de nuevos usuarios
  },

  // Flujo de incorporacion para nuevos usuarios que ya tienen una cuenta
  // pero que no han completado todos los pasos necesarios (ej. conexion WhatsApp)
  {
    path: 'onboarding/:id',
    component: OnboardingComponent,
    canActivate: [authGuard] // Protegido: solo accesible para usuarios autenticados
  },

  // Rutas principales del sistema que requieren autenticacion completa y
  // haber finalizado el proceso de incorporacion exitosamente
  {
    path: 'dashboard/:id',
    component: DashboardComponent,
    canActivate: [authGuard, onboardingGuard] // Panel de control principal
  },
  {
    path: ':id/configuracion-bot',
    component: ConfigurarBotComponent,
    canActivate: [authGuard, onboardingGuard] // Configuracion de respuestas automaticas
  },
  {
    path: ':id/catalogos',
    component: CatalogosUniversal,
    canActivate: [authGuard, onboardingGuard] // Gestion centralizada de productos
  },
  {
    path: ':id/catalogo-servicios',
    component: CatalogoServiciosComponent,
    canActivate: [authGuard, onboardingGuard] // Gestion centralizada de servicios
  },
  {
    path: 'configuracion/:id',
    component: ConfiguracionCatalogo,
    canActivate: [authGuard, onboardingGuard] // Configuracion avanzada del catalogo
  },
  {
    path: ':id/pedidos',
    component: Pedidos,
    canActivate: [authGuard, onboardingGuard] // Administracion de pedidos recibidos
  },
  {
    path: ':id/reservas',
    component: ReservacionesComponent,
    canActivate: [authGuard, onboardingGuard]
  },

  // Ruta de captura obligatoria (Fallback) para manejar URLs inexistentes
  {
    path: '**',
    redirectTo: '' // Retorna al inicio si la URL ingresada no coincide con ninguna
  }
];
