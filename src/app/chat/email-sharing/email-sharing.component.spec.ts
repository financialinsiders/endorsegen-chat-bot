import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailSharingComponent } from './email-sharing.component';

describe('SocialSharingComponent', () => {
  let component: EmailSharingComponent;
  let fixture: ComponentFixture<EmailSharingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailSharingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailSharingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
