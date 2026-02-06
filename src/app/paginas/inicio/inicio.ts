import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


@Component({
selector: 'app-inicio',
standalone: true,
imports: [CommonModule, RouterModule],
templateUrl: './inicio.html',
styleUrls: ['./inicio.css'],
})
export class InicioComponent {}
