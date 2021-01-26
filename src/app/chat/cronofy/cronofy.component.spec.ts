import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CronofyComponent } from './cronofy.component';

describe('CronofyComponent', () => {
  let component: CronofyComponent;
  let fixture: ComponentFixture<CronofyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CronofyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CronofyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
