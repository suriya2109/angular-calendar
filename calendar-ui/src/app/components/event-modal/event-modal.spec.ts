import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventModal } from './event-modal';

describe('EventModal', () => {
  let component: EventModal;
  let fixture: ComponentFixture<EventModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventModal],
    }).compileComponents();

    fixture = TestBed.createComponent(EventModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
