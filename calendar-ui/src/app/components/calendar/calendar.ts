import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

const VIEW_OPTIONS = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
] as const;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function cloneDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, offset: number) {
  const next = cloneDate(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function startOfWeek(date: Date) {
  const cloned = cloneDate(date);
  const mondayIndex = (cloned.getDay() + 6) % 7;
  cloned.setDate(cloned.getDate() - mondayIndex);
  return cloned;
}

@Component({
  standalone: true,
  selector: 'app-calendar',
  imports: [CommonModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
  host: { ngSkipHydration: 'true' },
})
export class Calendar {
  selectedView = signal<'month' | 'week' | 'day'>('week');
  activeDate = signal(new Date());

  views = VIEW_OPTIONS;
  weekdays = WEEKDAYS;

  title = computed(() => {
    const date = this.activeDate();
    return `${MONTH_NAMES[date.getMonth()]}, ${date.getFullYear()}`;
  });

  weekDates = computed(() => {
    const start = startOfWeek(this.activeDate());
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  });

  setView(view: 'month' | 'week' | 'day') {
    this.selectedView.set(view);
  }

  selectDate(date: Date) {
    this.activeDate.set(cloneDate(date));
  }

  prev() {
    const current = this.activeDate();
    if (this.selectedView() === 'month') {
      const prevMonth = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      this.activeDate.set(prevMonth);
    } else if (this.selectedView() === 'day') {
      this.activeDate.set(addDays(current, -1));
    } else {
      this.activeDate.set(addDays(current, -7));
    }
  }

  next() {
    const current = this.activeDate();
    if (this.selectedView() === 'month') {
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      this.activeDate.set(nextMonth);
    } else if (this.selectedView() === 'day') {
      this.activeDate.set(addDays(current, 1));
    } else {
      this.activeDate.set(addDays(current, 7));
    }
  }

  gotoToday() {
    this.activeDate.set(new Date());
  }

  isSelected(date: Date) {
    const active = cloneDate(this.activeDate());
    return date.getTime() === active.getTime();
  }
}

