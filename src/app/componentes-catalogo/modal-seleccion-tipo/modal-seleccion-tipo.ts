// modal-seleccion-tipo.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-seleccion-tipo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-seleccion-tipo.html',
  styleUrl: './modal-seleccion-tipo.css',
})
export class ModalSeleccionTipo {
  // ==================== INPUTS ====================
  @Input() mostrarModal = false;

  // NUEVO: Configuración de tipos habilitados
  @Input() productosHabilitados = true;
  @Input() serviciosHabilitados = true;

  // ==================== OUTPUTS ====================
  @Output() cerrarModalEvent = new EventEmitter<void>();
  @Output() seleccionarTipoEvent = new EventEmitter<'producto' | 'servicio'>();

  // ==================== MÉTODOS ====================
  cerrarModal() {
    this.cerrarModalEvent.emit();
  }

  seleccionarTipo(tipo: 'producto' | 'servicio') {
    // Validar que el tipo esté habilitado
    if (tipo === 'producto' && !this.productosHabilitados) {
      alert('Los productos están deshabilitados en tu configuración. Por favor, habilítalos en ajustes.');
      return;
    }
    if (tipo === 'servicio' && !this.serviciosHabilitados) {
      alert('Los servicios están deshabilitados en tu configuración. Por favor, habilítalos en ajustes.');
      return;
    }

    this.seleccionarTipoEvent.emit(tipo);
  }

  // Prevenir cierre del modal al hacer click dentro
  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  // Obtener clases CSS para botones deshabilitados
  getBotonClasses(tipo: 'producto' | 'servicio'): string {
    const habilitado = tipo === 'producto' ? this.productosHabilitados : this.serviciosHabilitados;
    const colorBase = tipo === 'producto' ? 'green' : 'purple';

    if (!habilitado) {
      return `group bg-gray-100 border-2 border-gray-300 rounded-xl p-4 sm:p-8 cursor-not-allowed opacity-50`;
    }

    return `group bg-gradient-to-br from-${colorBase}-50 to-${colorBase}-100 border-2 border-${colorBase}-200 rounded-xl p-4 sm:p-8 hover:shadow-lg hover:border-${colorBase}-400 transition-all transform hover:-translate-y-1`;
  }
}
