import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisponibilidadService, DisponibilidadServicio } from '../../core/servicios/disponibilidad/disponibilidad';

@Component({
  selector: 'app-modal-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-horarios.html',
  styleUrl: './modal-horarios.css'
})
export class ModalHorarios implements OnChanges {
  @Input() mostrarModal = false;
  @Input() servicioId: number | null = null;
  @Input() empresaId: string = '';
  @Input() nombreServicio: string = '';

  @Output() cerrarModalEvent = new EventEmitter<void>();

  guardando = false;
  cargando = false;

  diasSemana = [
    { id: 1, nombre: 'Lunes' },
    { id: 2, nombre: 'Martes' },
    { id: 3, nombre: 'Miércoles' },
    { id: 4, nombre: 'Jueves' },
    { id: 5, nombre: 'Viernes' },
    { id: 6, nombre: 'Sábado' },
    { id: 0, nombre: 'Domingo' }
  ];

  horarios: { activo: boolean; dia_semana: number; hora_inicio: string; hora_fin: string; }[] = [];

  constructor(private disponibilidadService: DisponibilidadService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mostrarModal'] && this.mostrarModal && this.servicioId) {
      this.cargarHorarios();
    } else if (!this.mostrarModal) {
      this.resetearHorarios();
    }
  }

  resetearHorarios() {
    this.horarios = this.diasSemana.map(d => ({
      activo: false,
      dia_semana: d.id,
      hora_inicio: '09:00',
      hora_fin: '18:00'
    }));
  }

  cargarHorarios() {
    this.cargando = true;
    this.resetearHorarios();

    if (!this.servicioId) return;

    this.disponibilidadService.obtenerDisponibilidad(this.servicioId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const horariosBdd = res.data;
          
          this.horarios.forEach(h => {
            const encontrado = horariosBdd.find((b: any) => b.dia_semana === h.dia_semana);
            if (encontrado) {
              h.activo = true;
              h.hora_inicio = encontrado.hora_inicio.substring(0, 5); // Ej: 09:00:00 -> 09:00
              h.hora_fin = encontrado.hora_fin.substring(0, 5);
            }
          });
        }
        this.cargando = false;
      },
      error: () => {
        console.error("Error al cargar configuración de horarios");
        this.cargando = false;
      }
    });
  }

  guardar() {
    if (!this.servicioId || !this.empresaId) return;
    this.guardando = true;

    const seleccionados = this.horarios
      .filter(h => h.activo)
      .map(h => ({
        empresa_id: parseInt(this.empresaId),
        dia_semana: h.dia_semana,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
        activo: true
      }));

    this.disponibilidadService.reemplazarDisponibilidad(this.servicioId, this.empresaId, seleccionados).subscribe({
      next: (res) => {
        if (res.success) {
          this.cerrarModal();
        } else {
          console.error("No se pudo guardar", res);
        }
        this.guardando = false;
      },
      error: () => {
        console.error("Error al guardar en el servidor");
        this.guardando = false;
      }
    });
  }

  cerrarModal() {
    this.cerrarModalEvent.emit();
  }

  getNombreDia(diaId: number): string {
    return this.diasSemana.find(d => d.id === diaId)?.nombre || '';
  }
}
