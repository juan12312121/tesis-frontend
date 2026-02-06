import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalHorarios } from './modal-horarios';

describe('ModalHorarios', () => {
  let component: ModalHorarios;
  let fixture: ComponentFixture<ModalHorarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalHorarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalHorarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
