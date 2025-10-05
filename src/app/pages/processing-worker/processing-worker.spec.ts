import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessingWorker } from './processing-worker';

describe('ProcessingWorker', () => {
  let component: ProcessingWorker;
  let fixture: ComponentFixture<ProcessingWorker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessingWorker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessingWorker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
