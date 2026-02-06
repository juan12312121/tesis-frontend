// theme.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject: BehaviorSubject<Theme>;
  public theme$: Observable<Theme>;

  constructor() {
    // Cargar tema guardado o usar 'light' por defecto
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'light';
    this.themeSubject = new BehaviorSubject<Theme>(savedTheme);
    this.theme$ = this.themeSubject.asObservable();

    // Aplicar tema inicial
    this.applyTheme(savedTheme);
  }

  /**
   * Obtiene el tema actual
   */
  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  /**
   * Cambia el tema
   */
  setTheme(theme: Theme): void {
    // Aplicar primero al DOM
    this.applyTheme(theme);

    // Luego notificar a los suscriptores
    this.themeSubject.next(theme);

    // Guardar en localStorage
    localStorage.setItem('theme', theme);
  }

  /**
   * Alterna entre tema claro y oscuro
   */
  toggleTheme(): void {
    const newTheme = this.getCurrentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Verifica si el tema actual es oscuro
   */
  isDarkTheme(): boolean {
    return this.getCurrentTheme() === 'dark';
  }

  /**
   * Aplica el tema al documento
   */
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
