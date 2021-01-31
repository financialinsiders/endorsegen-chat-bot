import { TestBed } from '@angular/core/testing';

import { IntroductionService } from './introduction.service';

describe('IntroductionService', () => {
  let service: IntroductionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IntroductionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
