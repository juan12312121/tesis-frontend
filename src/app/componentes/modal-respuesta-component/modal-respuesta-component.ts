import { Component, EventEmitter, Input, Output, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../core/servicios/configuracion/configuracion';

export interface RespuestaAutomatica {
  id?: number;
  texto_disparador: string;
  respuesta: string;
  tipo_respuesta: 'texto' | 'imagen' | 'documento' | 'enlace';
  empresa_id?: number;
  fecha_creacion?: string;
}

export interface TipoRespuesta {
  valor: string;
  etiqueta: string;
  icono: string;
}

@Component({
  selector: 'app-modal-respuesta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-respuesta-component.html'
})
export class ModalRespuestaComponent implements OnChanges {
  private chatbotService = inject(ChatbotService);

  @Input() isOpen = false;
  @Input() editingRespuesta: RespuestaAutomatica | null = null;
  @Input() isSaving = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<RespuestaAutomatica>();

  formRespuesta: RespuestaAutomatica = {
    texto_disparador: '',
    respuesta: '',
    tipo_respuesta: 'texto'
  };

  tiposRespuesta: TipoRespuesta[] = [];

  constructor() {
    // Obtener tipos de respuesta del servicio y filtrar solo "texto"
    const tiposFromService = this.chatbotService.obtenerTiposRespuesta();

    // Filtrar solo tipo "texto"
    const tipoTexto = tiposFromService.find(t => t.valor === 'texto');

    if (tipoTexto) {
      this.tiposRespuesta = [{
        valor: tipoTexto.valor,
        etiqueta: tipoTexto.etiqueta,
        icono: this.mapearIconoFontAwesome(tipoTexto.icono)
      }];
    }

    // Si por alguna razón no se encuentra, usar valor por defecto
    if (this.tiposRespuesta.length === 0) {
      this.tiposRespuesta = [
        { valor: 'texto', etiqueta: 'Texto', icono: 'fa-comment' }
      ];
    }
  }

  private mapearIconoFontAwesome(emoji: string): string {
    const mapaIconos: { [key: string]: string } = {
      '💬': 'fa-comment',
      '🖼️': 'fa-image',
      '📄': 'fa-file-alt',
      '🔗': 'fa-link'
    };
    return mapaIconos[emoji] || 'fa-comment';
  }

  ngOnChanges() {
    if (this.isOpen && this.editingRespuesta) {
      this.formRespuesta = { ...this.editingRespuesta };
    } else if (this.isOpen && !this.editingRespuesta) {
      this.resetForm();
    }
  }

  resetForm() {
    this.formRespuesta = {
      texto_disparador: '',
      respuesta: '',
      tipo_respuesta: 'texto'
    };
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  onSave() {
    if (!this.formRespuesta.texto_disparador.trim() || !this.formRespuesta.respuesta.trim()) {
      return;
    }
    this.save.emit(this.formRespuesta);
  }

  isFormValid(): boolean {
    return !!(this.formRespuesta.texto_disparador?.trim() && this.formRespuesta.respuesta?.trim());
  }

  getSelectedTipoIcono(): string {
    const tipo = this.tiposRespuesta.find(t => t.valor === this.formRespuesta.tipo_respuesta);
    return `fas ${tipo?.icono || 'fa-comment'} mr-2 text-blue-600`;
  }

  getSelectedTipoEtiqueta(): string {
    const tipo = this.tiposRespuesta.find(t => t.valor === this.formRespuesta.tipo_respuesta);
    return tipo?.etiqueta || 'Texto';
  }
}
