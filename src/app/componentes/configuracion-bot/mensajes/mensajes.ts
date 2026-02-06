import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface RespuestaAutomatica {
  id?: number;
  empresa_id: number;
  texto_disparador: string;
  respuesta: string;
  tipo_respuesta: 'texto' | 'imagen' | 'documento' | 'enlace';
  fecha_creacion?: string;
}

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.css',
})
export class Mensajes {
  @Input() respuestas: RespuestaAutomatica[] = [];
  @Input() filteredRespuestas: RespuestaAutomatica[] = [];
  @Input() loadingRespuestas: boolean = false;
  @Input() searchTerm: string = '';

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() crearRespuesta = new EventEmitter<void>();
  @Output() editarRespuesta = new EventEmitter<RespuestaAutomatica>();
  @Output() eliminarRespuesta = new EventEmitter<RespuestaAutomatica>();

  onSearchChange(value: string) {
    this.searchTermChange.emit(value);
  }

  onCrearClick() {
    this.crearRespuesta.emit();
  }

  onEditarClick(respuesta: RespuestaAutomatica) {
    this.editarRespuesta.emit(respuesta);
  }

  onEliminarClick(respuesta: RespuestaAutomatica) {
    this.eliminarRespuesta.emit(respuesta);
  }

  getTipoIcono(tipo: string): string {
    const iconMap: { [key: string]: string } = {
      'texto': 'fa-comment',
      'imagen': 'fa-image',
      'documento': 'fa-file-pdf',
      'enlace': 'fa-link'
    };
    return iconMap[tipo] || 'fa-comment';
  }
}
