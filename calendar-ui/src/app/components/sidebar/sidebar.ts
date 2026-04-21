import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DateSyncService } from '../../services/date-sync.service';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function cloneDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
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
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly selectedDate = signal(cloneDate(new Date()));
  readonly activeMonthDate = signal(startOfMonth(new Date()));
  readonly myCalendarsOpen = signal(true);
  readonly categoriesOpen = signal(true);
  readonly weekdays = WEEKDAYS;

  readonly monthLabel = computed(() => {
    const monthDate = this.activeMonthDate();
    return `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
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

  selectDate(day: number): void {
    const date = new Date(this.activeMonthDate().getFullYear(), this.activeMonthDate().getMonth(), day);
    this.selectedDate.set(date);
    this.dateSyncService.setSelectedDate(date);
    this.activeMonthDate.set(startOfMonth(date));
    this.closeMobile();
  }

  isSelected(day: number): boolean {
    return isSameDay(this.selectedDate(), this.dateFor(day));
  }

  isToday(day: number): boolean {
    const today = new Date();
    return isSameDay(today, this.dateFor(day));
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

