// aside.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/servicios/temas';
import { Subscription } from 'rxjs';

interface Empresa {
  id: string;
  nombre: string;
  tipo: string;
  modulos?: {
    pedidos: boolean;
    reservas: boolean;
    catalogo: boolean;
  };
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aside.html',
  styleUrls: ['./aside.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  @Input() sidebarOpen: boolean = true;
  @Input() empresa: Empresa | null = null;
  @Input() usuario: Usuario | null = null;
  @Input() currentRoute: string = 'dashboard';
  @Input() unreadMessages: number = 0;

  @Output() navigate = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();
  @Output() toggleSidebarEvent = new EventEmitter<void>();

  isDarkMode: boolean = false;
  private themeSubscription?: Subscription;

  ngOnInit(): void {
    // Obtener tema inicial
    this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';

    // Suscribirse a los cambios de tema
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.isDarkMode = theme === 'dark';
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  getEmpresaIniciales(): string {
    if (!this.empresa) return 'E';
    return this.empresa.nombre
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getUserIniciales(): string {
    if (!this.usuario) return 'U';
    return this.usuario.nombre
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  navigateTo(route: string): void {
    if (!this.empresa?.id) {
      console.error('No hay empresa ID disponible');
      return;
    }

    // Emitir el evento primero
    this.navigate.emit(route);

    // Navegación según la ruta
    const routes: { [key: string]: string } = {
      'dashboard': `/dashboard/${this.empresa.id}`,
      'mensajes': `/${this.empresa.id}/mensajes`,
      'catalogo': `/${this.empresa.id}/catalogos`,
      'catalogo-servicios': `/${this.empresa.id}/catalogo-servicios`,
      'pedidos': `/${this.empresa.id}/pedidos`,
      'reservas': `/${this.empresa.id}/reservas`,
      'chatbot': `/${this.empresa.id}/configuracion-bot`
    };

    const path = routes[route];
    if (path) {
      this.router.navigate([path]);
    } else {
      console.warn(`Ruta no definida: ${route}`);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onLogout(): void {
    this.logout.emit();
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }
}
