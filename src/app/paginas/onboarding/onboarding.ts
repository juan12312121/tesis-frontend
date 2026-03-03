// onboarding.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Autenticacion } from '../../core/servicios/autenticacion/autenticacion';
import { EmpresaService } from '../../core/servicios/empresa/empresa';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './onboarding.html',
  styleUrls: ['./onboarding.css']
})
export class OnboardingComponent implements OnInit {
  empresaId: string = '';
  tipoSeleccionado: 'productos' | 'servicios' | null = null;
  guardando = false;
  hoveredCard: 'productos' | 'servicios' | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: Autenticacion,
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    this.empresaId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Si ya completó el onboarding, ir al dashboard
    if (this.authService.onboardingCompletado()) {
      this.router.navigate(['/dashboard', this.empresaId]);
    }
  }

  seleccionar(tipo: 'productos' | 'servicios') {
    this.tipoSeleccionado = tipo;
  }

  async confirmar() {
    if (!this.tipoSeleccionado || this.guardando) return;

    this.guardando = true;

    this.empresaService.completarOnboarding(this.tipoSeleccionado).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Actualizar el tipo en el servicio de auth local
          this.authService.actualizarTipoNegocio(this.tipoSeleccionado!);
          this.router.navigate(['/dashboard', this.empresaId]);
        } else {
          this.guardando = false;
        }
      },
      error: () => {
        this.guardando = false;
      }
    });
  }

  getNombreTipo(tipo: 'productos' | 'servicios'): string {
    return tipo === 'productos' ? 'Productos' : 'Servicios';
  }
}
