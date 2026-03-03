// modal-agregar.component.ts
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoItem, Categoria } from '../../core/servicios/catalogos/catalogos';

@Component({
  selector: 'app-modal-agregar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-agregar.html',
  styleUrl: './modal-agregar.css',
})
export class ModalAgregar {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() itemActual: Partial<CatalogoItem> = {};
  // ✅ CORREGIDO: ahora es Categoria[] en lugar de string[]
  @Input() categoriasDisponibles: Categoria[] = [];
  @Input() guardando = false;
  @Input() imagenPreview: string | null = null;
  @Input() productosHabilitados = true;
  @Input() serviciosHabilitados = true;

  @Output() cerrarModalEvent = new EventEmitter<void>();
  @Output() guardarItemEvent = new EventEmitter<void>();
  @Output() onFileSelectedEvent = new EventEmitter<any>();
  @Output() eliminarImagenActualEvent = new EventEmitter<void>();
  @Output() cancelarImagenNuevaEvent = new EventEmitter<void>();
  @Output() abrirSelectorArchivoEvent = new EventEmitter<void>();

  cerrarModal() { this.cerrarModalEvent.emit(); }
  guardarItem() { this.guardarItemEvent.emit(); }
  onFileSelected(event: any) { this.onFileSelectedEvent.emit(event); }
  eliminarImagenActual() { this.eliminarImagenActualEvent.emit(); }
  cancelarImagenNueva() { this.cancelarImagenNuevaEvent.emit(); }
  abrirSelectorArchivo() { this.abrirSelectorArchivoEvent.emit(); }
  stopPropagation(event: Event) { event.stopPropagation(); }

  get tipoActualHabilitado(): boolean {
    if (this.itemActual.tipo_item === 'producto') return this.productosHabilitados;
    if (this.itemActual.tipo_item === 'servicio') return this.serviciosHabilitados;
    return true;
  }
}
