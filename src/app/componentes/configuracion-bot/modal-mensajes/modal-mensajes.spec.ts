import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalMensajes } from './modal-mensajes';

describe('ModalMensajes', () => {
  let component: ModalMensajes;
  let fixture: ComponentFixture<ModalMensajes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalMensajes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalMensajes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
