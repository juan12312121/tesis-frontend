import { TestBed } from '@angular/core/testing';

import { Instancias } from './instancias';

describe('Instancias', () => {
  let service: Instancias;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Instancias);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
