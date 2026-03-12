// grid-catalogo.component.ts
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoItem } from '../../core/servicios/catalogos/catalogos';

@Component({
  selector: 'app-grid-catalogo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class catalogo implements OnChanges {
  @Input() itemsPaginados: CatalogoItem[] = [];
  @Input() itemsFiltrados: CatalogoItem[] = [];
  @Input() paginaActual = 1;
  @Input() totalPaginas = 1;
  @Input() rangoItems = '';
  @Input() terminoBusqueda = '';
  @Input() productosHabilitados = true;
  @Input() serviciosHabilitados = true;

  @Output() editarItemEvent = new EventEmitter<CatalogoItem>();
  @Output() eliminarItemEvent = new EventEmitter<CatalogoItem>();
  @Output() cambiarPaginaEvent = new EventEmitter<number>();
  @Output() limpiarBusquedaEvent = new EventEmitter<void>();
  @Output() mostrarModalTipoEvent = new EventEmitter<void>();
  @Output() configurarHorariosEvent = new EventEmitter<CatalogoItem>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['itemsPaginados']) {
      console.log(' GRID - Items recibidos:', this.itemsPaginados.length);
    }
  }

  get itemsVisibles(): CatalogoItem[] {
    return this.itemsPaginados;
  }

  formatearPrecio(precio: number | null | undefined): string {
    if (!precio && precio !== 0) return '';
    return `$${precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  tienePrecio(item: CatalogoItem): boolean {
    return item.precio !== null && item.precio !== undefined;
  }

  editarItem(item: CatalogoItem) {
    this.editarItemEvent.emit(item);
  }

  eliminarItem(item: CatalogoItem) {
    this.eliminarItemEvent.emit(item);
  }

  configurarHorarios(item: CatalogoItem) {
    this.configurarHorariosEvent.emit(item);
  }

  cambiarPagina(pagina: number) {
    this.cambiarPaginaEvent.emit(pagina);
  }

  limpiarBusqueda() {
    this.limpiarBusquedaEvent.emit();
  }

  mostrarModalAgregar() {
    this.mostrarModalTipoEvent.emit();
  }

  get paginasVisibles(): number[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) paginas.push(i);
    } else {
      if (actual <= 4) {
        for (let i = 1; i <= 5; i++) paginas.push(i);
        paginas.push(-1);
        paginas.push(total);
      } else if (actual >= total - 3) {
        paginas.push(1);
        paginas.push(-1);
        for (let i = total - 4; i <= total; i++) paginas.push(i);
      } else {
        paginas.push(1);
        paginas.push(-1);
        for (let i = actual - 1; i <= actual + 1; i++) paginas.push(i);
        paginas.push(-1);
        paginas.push(total);
      }
    }

    return paginas;
  }
}
