// header-catalogo.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Categoria } from '../../core/servicios/catalogos/catalogos';

@Component({
  selector: 'app-header-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header-catalogo.html',
  styleUrl: './header-catalogo.css',
})
export class HeaderCatalogo {
  @Input() terminoBusqueda = '';
  @Input() filtroTipo: 'todos' | 'producto' | 'servicio' = 'todos';
  @Input() filtroCategoria: string = 'todas';
  @Input() filtroDisponible: 'todos' | 'disponible' | 'no_disponible' = 'todos';
  @Input() ordenamiento: 'nombre' | 'precio' | 'fecha' | 'categoria' = 'fecha';

  // ✅ CORREGIDO: Categoria[] en lugar de string[]
  @Input() categoriasDisponibles: Categoria[] = [];

  @Input() sidebarOpen = true;
  @Input() empresaId: string = '';
  @Input() productosHabilitados = true;
  @Input() serviciosHabilitados = true;

  @Output() toggleSidebarEvent = new EventEmitter<void>();
  @Output() mostrarModalTipoEvent = new EventEmitter<void>();
  @Output() buscarEvent = new EventEmitter<string>();
  @Output() limpiarBusquedaEvent = new EventEmitter<void>();
  @Output() cambiarFiltroTipoEvent = new EventEmitter<'todos' | 'producto' | 'servicio'>();
  @Output() cambiarFiltroCategoriaEvent = new EventEmitter<string>();
  @Output() cambiarFiltroDisponibleEvent = new EventEmitter<'todos' | 'disponible' | 'no_disponible'>();
  @Output() cambiarOrdenamientoEvent = new EventEmitter<'nombre' | 'precio' | 'fecha' | 'categoria'>();
  @Output() terminoBusquedaChange = new EventEmitter<string>();
  // ✅ NUEVO: evento para abrir modal de categorías
  @Output() gestionarCategoriasEvent = new EventEmitter<void>();

  constructor(private router: Router) {}

  toggleSidebar() { this.toggleSidebarEvent.emit(); }
  mostrarModalTipo() { this.mostrarModalTipoEvent.emit(); }
  buscar() { this.buscarEvent.emit(this.terminoBusqueda); }
  limpiarBusqueda() { this.limpiarBusquedaEvent.emit(); }
  gestionarCategorias() { this.gestionarCategoriasEvent.emit(); }

  cambiarFiltroTipo(tipo: 'todos' | 'producto' | 'servicio') {
    if (tipo === 'producto' && !this.productosHabilitados) return;
    if (tipo === 'servicio' && !this.serviciosHabilitados) return;
    this.cambiarFiltroTipoEvent.emit(tipo);
  }

  cambiarFiltroCategoria(categoriaId: string) {
    this.cambiarFiltroCategoriaEvent.emit(categoriaId);
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

  get mostrarFiltroProductos(): boolean { return this.productosHabilitados; }
  get mostrarFiltroServicios(): boolean { return this.serviciosHabilitados; }
  get mostrarFiltroTodos(): boolean { return this.productosHabilitados && this.serviciosHabilitados; }
}
