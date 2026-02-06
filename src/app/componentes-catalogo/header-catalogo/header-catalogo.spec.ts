import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderCatalogo } from './header-catalogo';

describe('HeaderCatalogo', () => {
  let component: HeaderCatalogo;
  let fixture: ComponentFixture<HeaderCatalogo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderCatalogo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderCatalogo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
