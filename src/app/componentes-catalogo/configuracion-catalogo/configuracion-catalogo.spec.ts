import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfiguracionCatalogo } from './configuracion-catalogo';

describe('ConfiguracionCatalogo', () => {
  let component: ConfiguracionCatalogo;
  let fixture: ComponentFixture<ConfiguracionCatalogo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionCatalogo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfiguracionCatalogo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
