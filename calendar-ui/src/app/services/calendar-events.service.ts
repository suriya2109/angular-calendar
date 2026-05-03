import { Injectable, signal } from '@angular/core';
import { CalendarCategory, CalendarEvent } from '../components/calendar.models';
import { INITIAL_EVENTS } from './calendar-events.seed';

@Injectable({
  providedIn: 'root',
})
export class CalendarEventsService {
  readonly categories = ['Personal', 'Work', 'Health'] as const;
  readonly events = signal<CalendarEvent[]>(INITIAL_EVENTS);
  readonly visibleCategories = signal<Record<CalendarCategory, boolean>>({
    Personal: true,
    Work: true,
    Health: true,
  });

  toggleCategoryVisibility(category: CalendarCategory): void {
    this.visibleCategories.update((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  isCategoryVisible(category: CalendarCategory): boolean {
    return this.visibleCategories()[category];
  }
}
