import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarGrid } from './calendar-grid';
import { CalendarEvent } from '../calendar.models';

describe('CalendarGrid', () => {
  let component: CalendarGrid;
  let fixture: ComponentFixture<CalendarGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarGrid],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarGrid);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should place week events in the column for their date', () => {
    component.selectedView = 'week';
    component.weekDates = [
      new Date(2026, 3, 27),
      new Date(2026, 3, 28),
      new Date(2026, 3, 29),
      new Date(2026, 3, 30),
      new Date(2026, 4, 1),
      new Date(2026, 4, 2),
      new Date(2026, 4, 3),
    ];

    const event = {
      id: 1,
      title: 'Planning',
      dateKey: '2026-04-30',
      date: 'Thursday, 30 April',
      startTime: '06:00',
      endTime: '07:00',
      location: '',
      category: 'Work',
      selectedTags: [],
      selectedMembers: [],
      theme: 'blue',
      gridColumn: '1',
      gridRow: '1 / span 2',
    } satisfies CalendarEvent;

    expect(component.eventGridColumn(event)).toBe('4');
  });

  it('should keep day view events in the first column', () => {
    component.selectedView = 'day';
    component.weekDates = [new Date(2026, 4, 3)];

    const event = {
      id: 2,
      title: 'Focus',
      dateKey: '2026-05-03',
      date: 'Sunday, 3 May',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      category: 'Personal',
      selectedTags: [],
      selectedMembers: [],
      theme: 'green',
      gridColumn: '6',
      gridRow: '3 / span 2',
    } satisfies CalendarEvent;

    expect(component.eventGridColumn(event)).toBe('1');
  });
});
