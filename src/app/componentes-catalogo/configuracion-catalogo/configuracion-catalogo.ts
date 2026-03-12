// configuracion-catalogo.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Autenticacion } from '../../core/servicios/autenticacion/autenticacion';

@Component({
  selector: 'app-configuracion-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-catalogo.html',
  styleUrl: './configuracion-catalogo.css',
})
export class ConfiguracionCatalogo implements OnInit {
  empresaId: string = '';

  productosHabilitados = true;
  serviciosHabilitados = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: Autenticacion
  ) {
    console.log(' CONSTRUCTOR - Componente ConfiguracionCatalogo creado');
  }

  ngOnInit() {
    console.log(' ngOnInit - Inicializando configuración');

    this.empresaId = this.route.snapshot.paramMap.get('id') || '';
    console.log(' Empresa ID obtenido:', this.empresaId);

    this.cargarConfiguracion();
  }

  cargarConfiguracion() {
    console.log(' ========================================');
    console.log(' CARGANDO CONFIGURACIÓN ACTUAL');
    console.log(' ========================================');
    console.log(' Key de localStorage:', `config_${this.empresaId}`);

    // Cargar de localStorage
    const config = localStorage.getItem(`config_${this.empresaId}`);

    console.log(' Valor RAW de localStorage:', config);

    if (config) {
      try {
        const parsed = JSON.parse(config);
        console.log(' Config parseada:', parsed);

        this.productosHabilitados = parsed.productos ?? true;
        this.serviciosHabilitados = parsed.servicios ?? true;

        console.log(' Configuración cargada:');
        console.log('    Productos:', this.productosHabilitados ? ' HABILITADOS' : ' DESHABILITADOS');
        console.log('   ️  Servicios:', this.serviciosHabilitados ? ' HABILITADOS' : ' DESHABILITADOS');

      } catch (error) {
        console.error(' ERROR al parsear configuración:', error);
      }
    } else {
      console.log('️  No existe configuración previa');
      console.log(' Usando valores por defecto (ambos habilitados)');
    }

    console.log(' ========================================');
  }

  guardar() {
    console.log(' ========================================');
    console.log(' GUARDANDO CONFIGURACIÓN');
    console.log(' ========================================');
    console.log(' Empresa ID:', this.empresaId);
    console.log(' Productos habilitados:', this.productosHabilitados ? ' SÍ' : ' NO');
    console.log('️  Servicios habilitados:', this.serviciosHabilitados ? ' SÍ' : ' NO');

    // Validar que al menos uno esté activo
    if (!this.productosHabilitados && !this.serviciosHabilitados) {
      console.log(' VALIDACIÓN FALLIDA - Ambos están deshabilitados');
      alert('Debes tener al menos un tipo habilitado');
      return;
    }

    console.log(' Validación pasada - Guardando...');

    // Guardar en localStorage
    const config = {
      productos: this.productosHabilitados,
      servicios: this.serviciosHabilitados
    };

    const configJSON = JSON.stringify(config);
    const storageKey = `config_${this.empresaId}`;

    console.log(' Objeto a guardar:', config);
    console.log(' JSON a guardar:', configJSON);
    console.log(' Key de localStorage:', storageKey);

    localStorage.setItem(storageKey, configJSON);

    // Verificar que se guardó correctamente
    const verificacion = localStorage.getItem(storageKey);
    console.log(' Verificación - Valor guardado:', verificacion);

    if (verificacion === configJSON) {
      console.log(' ========================================');
      console.log(' CONFIGURACIÓN GUARDADA EXITOSAMENTE');
      console.log(' ========================================');
      alert('Configuración guardada exitosamente');

      // Opcional: Volver al catálogo
      console.log(' Redirigiendo a catálogo...');
      this.router.navigate([`/${this.empresaId}/catalogos`]);
    } else {
      console.log(' ERROR - La verificación falló');
      console.log('   Esperado:', configJSON);
      console.log('   Obtenido:', verificacion);
      alert('Error al guardar la configuración');
    }

    console.log(' ========================================');
  }
}
