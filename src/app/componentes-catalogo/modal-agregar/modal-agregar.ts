// modal-agregar.component.ts
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoItem } from '../../core/servicios/catalogos/catalogos';

@Component({
  selector: 'app-modal-agregar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-agregar.html',
  styleUrl: './modal-agregar.css',
})
export class ModalAgregar {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ==================== INPUTS ====================
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() itemActual: Partial<CatalogoItem> = {};
  @Input() categoriasDisponibles: string[] = [];
  @Input() guardando = false;
  @Input() imagenPreview: string | null = null;

  // NUEVO: Configuración de tipos habilitados
  @Input() productosHabilitados = true;
  @Input() serviciosHabilitados = true;

  // ==================== OUTPUTS ====================
  @Output() cerrarModalEvent = new EventEmitter<void>();
  @Output() guardarItemEvent = new EventEmitter<void>();
  @Output() onFileSelectedEvent = new EventEmitter<any>();
  @Output() eliminarImagenActualEvent = new EventEmitter<void>();
  @Output() cancelarImagenNuevaEvent = new EventEmitter<void>();
  @Output() abrirSelectorArchivoEvent = new EventEmitter<void>();

  // ==================== MÉTODOS ====================
  cerrarModal() {
    this.cerrarModalEvent.emit();
  }

  guardarItem() {
    this.guardarItemEvent.emit();
  }

  onFileSelected(event: any) {
    this.onFileSelectedEvent.emit(event);
  }

  eliminarImagenActual() {
    this.eliminarImagenActualEvent.emit();
  }

  cancelarImagenNueva() {
    this.cancelarImagenNuevaEvent.emit();
  }

  abrirSelectorArchivo() {
    this.abrirSelectorArchivoEvent.emit();
  }

  formatearCategoria(categoria: string | null | undefined): string {
    if (!categoria) return 'Sin categoría';
    return categoria
      .split('_')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
      .join(' ');
  }

  // Prevenir cierre del modal al hacer click dentro
  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  // Verificar si el tipo actual está habilitado
  get tipoActualHabilitado(): boolean {
    if (this.itemActual.tipo_item === 'producto') {
      return this.productosHabilitados;
    } else if (this.itemActual.tipo_item === 'servicio') {
      return this.serviciosHabilitados;
    }
    return true;
  }
}
