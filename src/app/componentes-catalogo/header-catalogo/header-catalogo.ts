// header-catalogo.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header-catalogo.html',
  styleUrl: './header-catalogo.css',
})
export class HeaderCatalogo {
  // Inputs - datos que recibe del componente padre
  @Input() terminoBusqueda = '';
  @Input() filtroTipo: 'todos' | 'producto' | 'servicio' = 'todos';
  @Input() filtroCategoria: string = 'todas';
  @Input() filtroDisponible: 'todos' | 'disponible' | 'no_disponible' = 'todos';
  @Input() ordenamiento: 'nombre' | 'precio' | 'fecha' | 'categoria' = 'fecha';
  @Input() categoriasDisponibles: string[] = [];
  @Input() sidebarOpen = true;
  @Input() empresaId: string = '';
  @Input() productosHabilitados = true;  // ← NUEVO
  @Input() serviciosHabilitados = true;  // ← NUEVO

  // Outputs - eventos que emite hacia el componente padre
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  @Output() mostrarModalTipoEvent = new EventEmitter<void>();
  @Output() buscarEvent = new EventEmitter<string>();
  @Output() limpiarBusquedaEvent = new EventEmitter<void>();
  @Output() cambiarFiltroTipoEvent = new EventEmitter<'todos' | 'producto' | 'servicio'>();
  @Output() cambiarFiltroCategoriaEvent = new EventEmitter<string>();
  @Output() cambiarFiltroDisponibleEvent = new EventEmitter<'todos' | 'disponible' | 'no_disponible'>();
  @Output() cambiarOrdenamientoEvent = new EventEmitter<'nombre' | 'precio' | 'fecha' | 'categoria'>();
  @Output() terminoBusquedaChange = new EventEmitter<string>();

  constructor(private router: Router) {}

  // Métodos que emiten eventos
  toggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  mostrarModalTipo() {
    this.mostrarModalTipoEvent.emit();
  }

  buscar() {
    this.buscarEvent.emit(this.terminoBusqueda);
  }

  limpiarBusqueda() {
    this.limpiarBusquedaEvent.emit();
  }

  cambiarFiltroTipo(tipo: 'todos' | 'producto' | 'servicio') {
    // Validar si el tipo está habilitado
    if (tipo === 'producto' && !this.productosHabilitados) {
      console.log('⚠️ HEADER - Intento de filtrar por productos (deshabilitados)');
      return;
    }
    if (tipo === 'servicio' && !this.serviciosHabilitados) {
      console.log('⚠️ HEADER - Intento de filtrar por servicios (deshabilitados)');
      return;
    }

    console.log('🔀 HEADER - Cambiando filtro a:', tipo);
    this.cambiarFiltroTipoEvent.emit(tipo);
  }

  cambiarFiltroCategoria(categoria: string) {
    this.cambiarFiltroCategoriaEvent.emit(categoria);
  }

  cambiarFiltroDisponible(disponible: 'todos' | 'disponible' | 'no_disponible') {
    this.cambiarFiltroDisponibleEvent.emit(disponible);
  }

  cambiarOrdenamiento() {
    this.cambiarOrdenamientoEvent.emit(this.ordenamiento);
  }

  onTerminoBusquedaChange() {
    this.terminoBusquedaChange.emit(this.terminoBusqueda);
  }

  irAConfiguracion() {
    this.router.navigate(['/configuracion', this.empresaId]);
  }

  // ==================== MÉTODOS AUXILIARES ====================
  get mostrarFiltroProductos(): boolean {
    return this.productosHabilitados;
  }

  get mostrarFiltroServicios(): boolean {
    return this.serviciosHabilitados;
  }

  get mostrarFiltroTodos(): boolean {
    return this.productosHabilitados && this.serviciosHabilitados;
  }
}
