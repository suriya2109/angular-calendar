import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Calendar } from './calendar';
import { CalendarEvent, CalendarSlot } from '../calendar.models';

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Calendar],
    }).compileComponents();

    fixture = TestBed.createComponent(Calendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sync the active date when an event is opened', () => {
    const event = {
      id: 1,
      title: 'Planning',
      dateKey: '2026-05-03',
      date: 'Sunday, 3 May',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      category: 'Work',
      selectedTags: [],
      selectedMembers: [],
      theme: 'blue',
      gridColumn: '6',
      gridRow: '3 / span 2',
    } satisfies CalendarEvent;

    component.onViewRequested(event);

    expect(component.activeDate()).toEqual(new Date(2026, 4, 3));
    expect(component.selectedSlot()?.dateKey).toBe('2026-05-03');
  });

  it('should sync the active date when a slot is selected', () => {
    const slot = {
      dayIndex: 4,
      timeIndex: 2,
      dayLabel: 'Fri',
      timeLabel: '8 am',
      dateKey: '2026-05-01',
      dateLabel: 'Friday, 1 May',
      gridColumn: '5',
      gridRow: '3',
      eventGridRow: '3 / span 2',
    } satisfies CalendarSlot;

    component.onSlotSelected(slot);

    expect(component.activeDate()).toEqual(new Date(2026, 4, 1));
    expect(component.selectedSlot()).toEqual(slot);
  });

  it('should keep all visible events in week view', () => {
    component.events.set([
      {
        id: 1,
        title: 'Sunday event',
        dateKey: '2026-05-03',
        date: 'Sunday, 3 May',
        startTime: '06:00',
        endTime: '07:00',
        location: '',
        category: 'Work',
        selectedTags: [],
        selectedMembers: [],
        theme: 'blue',
        gridColumn: '1',
        gridRow: '1 / span 2',
      },
      {
        id: 2,
        title: 'Monday event',
        dateKey: '2026-05-04',
        date: 'Monday, 4 May',
        startTime: '08:00',
        endTime: '09:00',
        location: '',
        category: 'Work',
        selectedTags: [],
        selectedMembers: [],
        theme: 'green',
        gridColumn: '2',
        gridRow: '3 / span 2',
      },
    ]);

    component.activeDate.set(new Date(2026, 4, 3));
    component.setView('week');

    expect(component.visibleEvents().map((event) => event.title)).toEqual(['Sunday event', 'Monday event']);
  });

  it('should only show events for the active day in day view', () => {
    component.events.set([
      {
        id: 1,
        title: 'Sunday event',
        dateKey: '2026-05-03',
        date: 'Sunday, 3 May',
        startTime: '06:00',
        endTime: '07:00',
        location: '',
        category: 'Work',
        selectedTags: [],
        selectedMembers: [],
        theme: 'blue',
        gridColumn: '1',
        gridRow: '1 / span 2',
      },
      {
        id: 2,
        title: 'Monday event',
        dateKey: '2026-05-04',
        date: 'Monday, 4 May',
        startTime: '08:00',
        endTime: '09:00',
        location: '',
        category: 'Work',
        selectedTags: [],
        selectedMembers: [],
        theme: 'green',
        gridColumn: '2',
        gridRow: '3 / span 2',
      },
    ]);

    component.activeDate.set(new Date(2026, 4, 3));
    component.setView('day');

    expect(component.visibleEvents().map((event) => event.title)).toEqual(['Sunday event']);
  });
});
