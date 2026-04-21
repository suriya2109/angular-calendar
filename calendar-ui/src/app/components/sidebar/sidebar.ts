import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { DateSyncService } from '../../services/date-sync.service';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  host: { ngSkipHydration: 'true' },
})
export class Sidebar {
  private dateSyncService = inject(DateSyncService);
  collapsed = signal(false);
  mobileOpen = signal(false);
  selectedDate = signal(new Date());
  rangeStart = signal(new Date());
  rangeEnd = signal(new Date());
  rangePreset = signal<'today' | 'week' | 'month' | 'next7' | 'single'>('today');
  activeMonth = signal(new Date().getMonth());
  activeYear = signal(new Date().getFullYear());
  myCalendarsOpen = signal(true);
  categoriesOpen = signal(true);
  weekdays = WEEKDAYS;

  monthLabel = computed(() => `${MONTH_NAMES[this.activeMonth()]} ${this.activeYear()}`);

  monthGrid = computed(() => {
    const year = this.activeYear();
    const month = this.activeMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (first.getDay() + 6) % 7; // Monday-first week
    const grid: Array<number | null> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(day);
    }
    return grid;
  });

  today = computed(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  });

  rangeLabel = computed(() => {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    const formatDate = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return start.getTime() === end.getTime()
      ? `Selected: ${formatDate(start)}`
      : `Selected range: ${formatDate(start)} — ${formatDate(end)}`;
  });

  setRangePreset(preset: 'today' | 'week' | 'month' | 'next7' | 'single') {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let end = new Date(start);
    if (preset === 'single') {
      this.rangePreset.set('single');
      return;
    }

    if (preset === 'week') {
      const weekday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - weekday);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
    } else if (preset === 'month') {
      start.setDate(1);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    } else if (preset === 'next7') {
      end.setDate(end.getDate() + 6);
    }

    this.rangeStart.set(new Date(start));
    this.rangeEnd.set(new Date(end));
    this.rangePreset.set(preset);
    this.selectedDate.set(new Date(start));
    this.activeMonth.set(start.getMonth());
    this.activeYear.set(start.getFullYear());
  }

  dateFor(day: number) {
    return new Date(this.activeYear(), this.activeMonth(), day);
  }

  isInRange(day: number) {
    const date = this.dateFor(day);
    return date >= this.rangeStart() && date <= this.rangeEnd();
  }

  toggleCollapse() {
    this.collapsed.update(value => !value);
  }

  toggleMobile() {
    this.mobileOpen.update(value => !value);
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }

  prevMonth() {
    let month = this.activeMonth();
    let year = this.activeYear();
    if (month === 0) {
      month = 11;
      year -= 1;
    } else {
      month -= 1;
    }
    this.activeMonth.set(month);
    this.activeYear.set(year);
  }

  nextMonth() {
    let month = this.activeMonth();
    let year = this.activeYear();
    if (month === 11) {
      month = 0;
      year += 1;
    } else {
      month += 1;
    }
    this.activeMonth.set(month);
    this.activeYear.set(year);
  }

  selectDate(day: number) {
    const date = new Date(this.activeYear(), this.activeMonth(), day);
    const currentStart = this.rangeStart();
    const currentEnd = this.rangeEnd();
    const isSingleSelection = currentStart.getTime() === currentEnd.getTime();

    if (isSingleSelection) {
      if (date.getTime() < currentStart.getTime()) {
        this.rangeStart.set(date);
        this.rangeEnd.set(currentStart);
      } else if (date.getTime() > currentStart.getTime()) {
        this.rangeStart.set(currentStart);
        this.rangeEnd.set(date);
      } else {
        this.rangeStart.set(date);
        this.rangeEnd.set(date);
      }
    } else {
      if (date.getTime() < currentStart.getTime()) {
        this.rangeStart.set(date);
      } else if (date.getTime() > currentEnd.getTime()) {
        this.rangeEnd.set(date);
      } else {
        this.rangeStart.set(date);
        this.rangeEnd.set(date);
      }
    }

    this.selectedDate.set(date);
    this.dateSyncService.setSelectedDate(date);
    this.rangePreset.set('single');
    this.closeMobile();
  }

  isRangeStart(day: number) {
    const date = this.dateFor(day);
    const start = this.rangeStart();
    return date.getTime() === start.getTime();
  }

  isRangeEnd(day: number) {
    const date = this.dateFor(day);
    const end = this.rangeEnd();
    return date.getTime() === end.getTime();
  }

  isSelected(day: number) {
    const selected = this.selectedDate();
    return selected.getFullYear() === this.activeYear() && selected.getMonth() === this.activeMonth() && selected.getDate() === day;
  }

  isToday(day: number) {
    const today = this.today();
    return today.year === this.activeYear() && today.month === this.activeMonth() && today.day === day;
  }

  toggleMyCalendars() {
    this.myCalendarsOpen.update(value => !value);
  }

  toggleCategories() {
    this.categoriesOpen.update(value => !value);
  }
}

