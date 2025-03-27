import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialAtsComponent } from './historial-ats.component';

describe('HistorialAtsComponent', () => {
  let component: HistorialAtsComponent;
  let fixture: ComponentFixture<HistorialAtsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialAtsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialAtsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
