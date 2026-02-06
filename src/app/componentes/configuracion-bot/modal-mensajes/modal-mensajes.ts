import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RespuestaAutomatica } from '../mensajes/mensajes';

@Component({
  selector: 'app-modal-mensajes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-mensajes.html',
  styleUrl: './modal-mensajes.css',
})
export class ModalMensajes implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingRespuesta: RespuestaAutomatica | null = null;
  @Input() empresaId!: number;
  @Input() isSaving = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<RespuestaAutomatica>();

  // Formulario
  formData: RespuestaAutomatica = {
    empresa_id: 0,
    texto_disparador: '',
    respuesta: '',
    tipo_respuesta: 'texto'
  };

  // Validación
  errors = {
    texto_disparador: '',
    respuesta: ''
  };

  ngOnInit() {
    if (this.editingRespuesta) {
      this.formData = { ...this.editingRespuesta };
    } else {
      this.resetForm();
    }
  }

  ngOnChanges() {
    if (this.isOpen) {
      if (this.editingRespuesta) {
        this.formData = { ...this.editingRespuesta };
      } else {
        this.resetForm();
      }
    }
  }

  resetForm() {
    this.formData = {
      empresa_id: this.empresaId,
      texto_disparador: '',
      respuesta: '',
      tipo_respuesta: 'texto'
    };
    this.errors = {
      texto_disparador: '',
      respuesta: ''
    };
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  validateForm(): boolean {
    let isValid = true;
    this.errors = {
      texto_disparador: '',
      respuesta: ''
    };

    if (!this.formData.texto_disparador.trim()) {
      this.errors.texto_disparador = 'El texto disparador es obligatorio';
      isValid = false;
    }

    if (!this.formData.respuesta.trim()) {
      this.errors.respuesta = 'La respuesta es obligatoria';
      isValid = false;
    }

    return isValid;
  }

  onSave() {
    if (this.validateForm()) {
      this.save.emit(this.formData);
    }
  }

  onBackdropClick() {
    this.onClose();
  }

  onModalClick(event: Event) {
    event.stopPropagation();
  }

  get modalTitle(): string {
    return this.editingRespuesta ? 'Editar Respuesta Automática' : 'Nueva Respuesta Automática';
  }

  get caracteresRestantesDisparador(): number {
    return 100 - (this.formData.texto_disparador?.length || 0);
  }

  get caracteresRestantesRespuesta(): number {
    return 500 - (this.formData.respuesta?.length || 0);
  }
}
