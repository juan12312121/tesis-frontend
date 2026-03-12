import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


/**
 * Componente principal para la pagina de inicio o landing page.
 * Punto de entrada para usuarios no autenticados.
 */
@Component({
    selector: 'app-inicio',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './inicio.html',
    styleUrls: ['./inicio.css'],
})
export class InicioComponent { }
