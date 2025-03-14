import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroPruebasComponent } from './registro-pruebas.component';

describe('RegistroPruebasComponent', () => {
  let component: RegistroPruebasComponent;
  let fixture: ComponentFixture<RegistroPruebasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroPruebasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroPruebasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
