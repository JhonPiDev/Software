import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialPruebasComponent } from './historial-pruebas.component';

describe('HistorialPruebasComponent', () => {
  let component: HistorialPruebasComponent;
  let fixture: ComponentFixture<HistorialPruebasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialPruebasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialPruebasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
