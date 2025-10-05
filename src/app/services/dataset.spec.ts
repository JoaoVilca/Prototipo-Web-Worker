import { TestBed } from '@angular/core/testing';

import { Dataset } from './dataset';

describe('Dataset', () => {
  let service: Dataset;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dataset);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
