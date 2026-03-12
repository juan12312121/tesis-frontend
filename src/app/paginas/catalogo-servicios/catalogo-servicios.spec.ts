import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogosUniversal } from './catalogos-universal';

describe('CatalogosUniversal', () => {
  let component: CatalogosUniversal;
  let fixture: ComponentFixture<CatalogosUniversal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogosUniversal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogosUniversal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
