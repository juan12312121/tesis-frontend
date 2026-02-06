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
  // Inputs - datos que recibe del componente padre
  @Input() itemsPaginados: CatalogoItem[] = [];
  @Input() itemsFiltrados: CatalogoItem[] = [];
  @Input() paginaActual = 1;
  @Input() totalPaginas = 1;
  @Input() rangoItems = '';
  @Input() terminoBusqueda = '';
  @Input() productosHabilitados = true;
  @Input() serviciosHabilitados = true;

  // Outputs - eventos que emite hacia el componente padre
  @Output() editarItemEvent = new EventEmitter<CatalogoItem>();
  @Output() eliminarItemEvent = new EventEmitter<CatalogoItem>();
  @Output() cambiarPaginaEvent = new EventEmitter<number>();
  @Output() limpiarBusquedaEvent = new EventEmitter<void>();
  @Output() mostrarModalTipoEvent = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['productosHabilitados'] || changes['serviciosHabilitados']) {
      console.log('🔄 GRID - Cambio detectado en configuración:');
      console.log('   📦 Productos habilitados:', this.productosHabilitados ? '✅ SÍ' : '❌ NO');
      console.log('   ⚙️  Servicios habilitados:', this.serviciosHabilitados ? '✅ SÍ' : '❌ NO');
      console.log('   📊 Items visibles:', this.itemsVisibles.length, 'de', this.itemsPaginados.length, 'totales');
    }

    if (changes['itemsPaginados']) {
      const productos = this.itemsPaginados.filter(i => i.tipo_item === 'producto').length;
      const servicios = this.itemsPaginados.filter(i => i.tipo_item === 'servicio').length;
      console.log('📊 GRID - Items recibidos:');
      console.log('   📦 Productos:', productos);
      console.log('   ⚙️  Servicios:', servicios);
      console.log('   📋 Total:', this.itemsPaginados.length);
    }
  }

  // ==================== GETTER para items filtrados por configuración ====================
  get itemsVisibles(): CatalogoItem[] {
    const visibles = this.itemsPaginados.filter(item => {
      if (item.tipo_item === 'producto' && !this.productosHabilitados) {
        console.log(`❌ FILTRADO - Producto "${item.nombre_item}" oculto (productos deshabilitados)`);
        return false;
      }
      if (item.tipo_item === 'servicio' && !this.serviciosHabilitados) {
        console.log(`❌ FILTRADO - Servicio "${item.nombre_item}" oculto (servicios deshabilitados)`);
        return false;
      }
      return true;
    });

    if (visibles.length !== this.itemsPaginados.length) {
      console.log(`🔍 FILTRO APLICADO: ${visibles.length} de ${this.itemsPaginados.length} items son visibles`);
    }

    return visibles;
  }

  // Métodos auxiliares para formateo
  formatearPrecio(precio: number | null | undefined): string {
    if (!precio && precio !== 0) return '';
    return `$${precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatearDuracion(minutos: number | null | undefined): string {
    if (!minutos) return '';
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  }

  tienePrecio(item: CatalogoItem): boolean {
    return item.precio !== null && item.precio !== undefined;
  }

  esProducto(item: CatalogoItem): boolean {
    return item.tipo_item === 'producto';
  }

  esServicio(item: CatalogoItem): boolean {
    return item.tipo_item === 'servicio';
  }

  // ==================== Validar si un item está habilitado ====================
  itemEstaHabilitado(item: CatalogoItem): boolean {
    if (item.tipo_item === 'producto' && !this.productosHabilitados) {
      return false;
    }
    if (item.tipo_item === 'servicio' && !this.serviciosHabilitados) {
      return false;
    }
    return true;
  }

  // Métodos que emiten eventos
  editarItem(item: CatalogoItem) {
    console.log('✏️ GRID - Intentando editar:', item.nombre_item, '- Tipo:', item.tipo_item);

    // Validar si el tipo está habilitado antes de editar
    if (!this.itemEstaHabilitado(item)) {
      console.log(`❌ GRID - Edición bloqueada: Los ${item.tipo_item}s están deshabilitados`);
      alert(`Los ${item.tipo_item}s están deshabilitados en la configuración`);
      return;
    }

    console.log('✅ GRID - Edición permitida, emitiendo evento...');
    this.editarItemEvent.emit(item);
  }

  eliminarItem(item: CatalogoItem) {
    console.log('🗑️ GRID - Eliminando:', item.nombre_item);
    this.eliminarItemEvent.emit(item);
  }

  cambiarPagina(pagina: number) {
    this.cambiarPaginaEvent.emit(pagina);
  }

  limpiarBusqueda() {
    this.limpiarBusquedaEvent.emit();
  }

  mostrarModalTipo() {
    console.log('➕ GRID - Abriendo modal de nuevo item');
    console.log('   Productos habilitados:', this.productosHabilitados);
    console.log('   Servicios habilitados:', this.serviciosHabilitados);
    this.mostrarModalTipoEvent.emit();
  }

  // Método para calcular páginas visibles
  get paginasVisibles(): number[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        paginas.push(i);
      }
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
