import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-horarios.html',
  styleUrl: './modal-horarios.css',
})
export class ModalHorarios {
  @Input() isOpen: boolean = false;
  @Input() configuracion: any = {
    mensaje_bienvenida: '',
    mensaje_fuera_horario: '',
    horario_inicio: '09:00',
    horario_fin: '18:00',
    dias_laborales: []
  };
  @Input() diasSemana: any[] = [];
  @Input() hasConfiguration: boolean = false;
  @Input() isSaving: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
  @Output() diaToggled = new EventEmitter<number>(); // ✅ CAMBIADO: de string a number

  onClose() {
    this.close.emit();
  }

  onSave() {
    this.save.emit(this.configuracion);
  }

  toggleDia(diaId: number) { // ✅ CAMBIADO: de string a number
    this.diaToggled.emit(diaId);
  }

  getDiasLaboralesTexto(): string {
    return this.diasSemana
      .filter(d => d.activo)
      .map(d => d.nombre)
      .join(', ');
  }

  onBackdropClick() {
    this.onClose();
  }

  onModalClick(event: Event) {
    event.stopPropagation();
  }
}
