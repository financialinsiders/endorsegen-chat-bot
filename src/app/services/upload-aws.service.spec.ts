import { TestBed } from '@angular/core/testing';

import { UploadAwsService } from './upload-aws.service';

describe('UploadAwsService', () => {
  let service: UploadAwsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UploadAwsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
