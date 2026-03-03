import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCategorias } from './modal-categorias';

describe('ModalCategorias', () => {
  let component: ModalCategorias;
  let fixture: ComponentFixture<ModalCategorias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCategorias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCategorias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
