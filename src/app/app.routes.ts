// app.routes.ts
import { Routes } from '@angular/router';
import { InicioComponent } from './paginas/inicio/inicio';
import { RegistroComponent } from './autenticacion/registro/registro';
import { Login } from './autenticacion/login/login';
import { DashboardComponent } from './paginas/dashboard/dashboard';
import { ConfigurarBotComponent } from './paginas/configurar-bot/configurar-bot';
import { CatalogosUniversal } from './paginas/catalogos-universal/catalogos-universal';
import { ConfiguracionCatalogo } from './componentes-catalogo/configuracion-catalogo/configuracion-catalogo'; // ← NUEVO IMPORT
import { Pedidos } from './paginas/pedidos/pedidos';

export const routes: Routes = [
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
  {
    path: 'dashboard/:id',
    component: DashboardComponent
  },
  {
    path: ':id/configuracion-bot',
    component: ConfigurarBotComponent
  },
  {
    path: ':id/catalogos',
    component: CatalogosUniversal
  },
  // ← NUEVA RUTA DE CONFIGURACIÓN
  {
    path: 'configuracion/:id',
    component: ConfiguracionCatalogo
  },
  {
    path: ':id/pedidos',
    component: Pedidos
  },
  // Redirección para rutas no encontradas
  {
    path: '**',
    redirectTo: ''
  }
];
