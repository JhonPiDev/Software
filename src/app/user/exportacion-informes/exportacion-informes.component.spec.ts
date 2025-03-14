import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportacionInformesComponent } from './exportacion-informes.component';

describe('ExportacionInformesComponent', () => {
  let component: ExportacionInformesComponent;
  let fixture: ComponentFixture<ExportacionInformesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportacionInformesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportacionInformesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
