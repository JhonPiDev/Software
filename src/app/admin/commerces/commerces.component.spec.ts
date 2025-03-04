import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommercesComponent } from './commerces.component';

describe('CommercesComponent', () => {
  let component: CommercesComponent;
  let fixture: ComponentFixture<CommercesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommercesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommercesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
