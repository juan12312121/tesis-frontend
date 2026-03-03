// modal-categorias.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria, Catalogos } from '../../core/servicios/catalogos/catalogos';

@Component({
  selector: 'app-modal-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-categorias.html',
})
export class ModalCategorias implements OnChanges {
  @Input() mostrarModal = false;
  @Input() categorias: Categoria[] = [];

  @Output() cerrarModalEvent = new EventEmitter<void>();
  @Output() categoriasActualizadasEvent = new EventEmitter<void>();

  nuevaCategoriaNombre = '';
  nuevaCategoriaDescripcion = '';
  guardando = false;
  eliminando: number | null = null;
  error = '';

  constructor(private catalogoService: Catalogos) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mostrarModal']?.currentValue === true) {
      this.resetForm();
    }
  }

  resetForm() {
    this.nuevaCategoriaNombre = '';
    this.nuevaCategoriaDescripcion = '';
    this.error = '';
  }

  cerrarModal() {
    this.cerrarModalEvent.emit();
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  agregarCategoria() {
    if (!this.nuevaCategoriaNombre.trim()) {
      this.error = 'El nombre de la categoría es requerido';
      return;
    }

    this.guardando = true;
    this.error = '';

    this.catalogoService.agregarCategoria(
      this.nuevaCategoriaNombre.trim(),
      this.nuevaCategoriaDescripcion.trim() || undefined
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.resetForm();
          this.categoriasActualizadasEvent.emit();
        } else {
          this.error = response.message || 'Error al crear la categoría';
        }
        this.guardando = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al crear la categoría';
        this.guardando = false;
      }
    });
  }

  eliminarCategoria(cat: Categoria) {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"? Los items con esta categoría quedarán sin categoría.`)) return;

    this.eliminando = cat.id;

    this.catalogoService.eliminarCategoria(cat.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.categoriasActualizadasEvent.emit();
        } else {
          this.error = response.message || 'Error al eliminar la categoría';
        }
        this.eliminando = null;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al eliminar la categoría';
        this.eliminando = null;
      }
    });
  }
}
