import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CalendarCategory } from '../calendar.models';
import { CalendarEventsService } from '../../services/calendar-events.service';
import { DateSyncService } from '../../services/date-sync.service';
import { TimeZoneService } from '../../services/timezone.service';
import { CalendarTimeZone, formatMonthLabel, isSameCalendarDay } from '../../services/timezone-format';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

function cloneDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function shiftYear(date: Date, offset: number): Date {
  return new Date(date.getFullYear() + offset, date.getMonth(), 1);
}

@Component({
  standalone: true,
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  host: { ngSkipHydration: 'true' },
})
export class Sidebar {
  private dateSyncService = inject(DateSyncService);
  private calendarEventsService = inject(CalendarEventsService);
  private timeZoneService = inject(TimeZoneService);
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly selectedDate = signal(cloneDate(new Date()));
  readonly activeMonthDate = signal(startOfMonth(new Date()));
  readonly myCalendarsOpen = signal(true);
  readonly categoriesOpen = signal(true);
  readonly weekdays = WEEKDAYS;
  readonly categories = this.calendarEventsService.categories;
  readonly timeZoneOptions = this.timeZoneService.timeZoneOptions;
  readonly selectedTimeZone = this.timeZoneService.selectedTimeZone;

  readonly monthLabel = computed(() => {
    const monthDate = this.activeMonthDate();
    return formatMonthLabel(monthDate, this.selectedTimeZone());
  });

  readonly monthGrid = computed(() => {
    const monthDate = this.activeMonthDate();
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (first.getDay() + 6) % 7; // Monday-first week
    return [
      ...Array.from({ length: firstDayIndex }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ] as Array<number | null>;
  });

  readonly categoryStats = computed(() => {
    const events = this.calendarEventsService.events();
    const total = events.length;

    return this.categories.map((category) => {
      const categoryEvents = events.filter((event) => event.category === category);
      const count = categoryEvents.length;
      const percentage = total > 0 ? Math.max(count > 0 ? 12 : 0, (count / total) * 100) : 0;
      return {
        category,
        count,
        percentage,
        latestTitle: categoryEvents[0]?.title ?? 'No events yet',
      };
    });
  });

  isCalendarVisible(category: CalendarCategory): boolean {
    return this.calendarEventsService.isCategoryVisible(category);
  }

  selectCalendar(category: CalendarCategory): void {
    this.calendarEventsService.toggleCategoryVisibility(category);
  }

  setTimeZone(timeZone: CalendarTimeZone): void {
    this.timeZoneService.setTimeZone(timeZone);
  }

  constructor() {
    effect(() => {
      const syncedDate = cloneDate(this.dateSyncService.selectedDate());
      this.selectedDate.set(syncedDate);
      this.activeMonthDate.set(startOfMonth(syncedDate));
    });
  }

  toggleCollapse(): void {
    this.collapsed.update((value) => !value);
  }

  toggleMobile(): void {
    this.mobileOpen.update((value) => !value);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  prevMonth(): void {
    this.activeMonthDate.set(shiftMonth(this.activeMonthDate(), -1));
  }

  nextMonth(): void {
    this.activeMonthDate.set(shiftMonth(this.activeMonthDate(), 1));
  }

  prevYear(): void {
    this.activeMonthDate.set(shiftYear(this.activeMonthDate(), -1));
  }

  nextYear(): void {
    this.activeMonthDate.set(shiftYear(this.activeMonthDate(), 1));
  }

  selectDate(day: number): void {
    const date = new Date(this.activeMonthDate().getFullYear(), this.activeMonthDate().getMonth(), day);
    this.selectedDate.set(date);
    this.dateSyncService.setSelectedDate(date);
    this.activeMonthDate.set(startOfMonth(date));
    this.closeMobile();
  }

  isSelected(day: number): boolean {
    return isSameCalendarDay(this.selectedDate(), this.dateFor(day), this.selectedTimeZone());
  }

  isToday(day: number): boolean {
    const today = new Date();
    return isSameCalendarDay(today, this.dateFor(day), this.selectedTimeZone());
  }

  toggleMyCalendars(): void {
    this.myCalendarsOpen.update((value) => !value);
  }

  toggleCategories(): void {
    this.categoriesOpen.update((value) => !value);
  }

  private dateFor(day: number): Date {
    const monthDate = this.activeMonthDate();
    return new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
  }
}

