import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ChatAvatarComponent } from './chat-avatar.component';

describe('ChatWidgetAvatarComponent', () => {
  let component: ChatAvatarComponent;
  let fixture: ComponentFixture<ChatAvatarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatAvatarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
