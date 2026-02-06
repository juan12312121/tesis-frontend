import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalSeleccionTipo } from './modal-seleccion-tipo';

describe('ModalSeleccionTipo', () => {
  let component: ModalSeleccionTipo;
  let fixture: ComponentFixture<ModalSeleccionTipo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalSeleccionTipo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalSeleccionTipo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
