import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horarios.html',
  styleUrl: './horarios.css',
})
export class Horarios {
  @Input() configuracion: any = {
    mensaje_bienvenida: '',
    mensaje_fuera_horario: '',
    horario_inicio: '09:00',
    horario_fin: '18:00',
    dias_laborales: []
  };
  @Input() hasConfiguration: boolean = false;
  @Input() diasSemana: any[] = [];
  @Input() isSaving: boolean = false;

  @Output() editarConfig = new EventEmitter<void>();
  @Output() eliminarConfig = new EventEmitter<void>();
  @Output() crearConfig = new EventEmitter<void>();

  onEditarClick() {
    this.editarConfig.emit();
  }

  onEliminarClick() {
    this.eliminarConfig.emit();
  }

  onCrearClick() {
    this.crearConfig.emit();
  }

  getDiasLaboralesTexto(): string {
    return this.diasSemana
      .filter(d => d.activo)
      .map(d => d.nombre)
      .join(', ');
  }
}
