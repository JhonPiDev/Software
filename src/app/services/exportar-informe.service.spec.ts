import { TestBed } from '@angular/core/testing';

import { ExportarInformeService } from './exportar-informe.service';

describe('ExportarInformeService', () => {
  let service: ExportarInformeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportarInformeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
