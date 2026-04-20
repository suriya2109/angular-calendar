import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { CalendarEvent, CalendarSlot } from '../calendar.models';

@Component({
  standalone: true,
  selector: 'app-calendar-grid',
  imports: [CommonModule],
  templateUrl: './calendar-grid.html',
  styleUrls: ['./calendar-grid.scss'],
})
export class CalendarGrid implements OnChanges {
  @Input() events: CalendarEvent[] = [];
  @Input() weekDates: Date[] = [];
  @Input() selectedSlot: CalendarSlot | null = null;
  @Input() selectedView: 'day' | 'week' | 'month' = 'week';
  @Input() activeDate: Date = new Date();

  @Output() slotSelected = new EventEmitter<CalendarSlot>();
  @Output() viewRequested = new EventEmitter<CalendarEvent>();

  readonly weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly times = ['6 am', '7 am', '8 am', '9 am', '10 am', '11 am', '12 pm','1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm', '7 pm', '8 pm', '9 pm', '10 pm'];

  readonly slots = signal<CalendarSlot[]>([]);
  readonly daySlots = signal<CalendarSlot[]>([]);
  readonly monthDays = signal<(Date | null)[]>([]);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['weekDates'] || changes['selectedView'] || changes['activeDate']) {
      this.slots.set(this.buildSlots());
      this.daySlots.set(this.buildDaySlots());
      this.monthDays.set(this.buildMonthDays());
    }
  }

  getMonthDayEvents(day: Date | null): CalendarEvent[] {
    if (!day) return [];
    const dateLabel = day.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return this.events.filter((event) => event.date === dateLabel);
  }

  private buildMonthDays(): (Date | null)[] {
    const year = this.activeDate.getFullYear();
    const month = this.activeDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: (Date | null)[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      if (date.getMonth() === month) {
        days.push(date);
      } else {
        days.push(null);
      }
    }
    return days;
  }

  private buildDaySlots(): CalendarSlot[] {
    const date = this.activeDate;
    const dateLabel = date.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    return this.times.map((timeLabel, timeIndex) => ({
      dayIndex: 0,
      timeIndex,
      dayLabel: this.weekdays[date.getDay() === 0 ? 6 : date.getDay() - 1],
      timeLabel,
      dateLabel,
      gridColumn: '1',
      gridRow: String(timeIndex + 1),
      eventGridRow: `${timeIndex + 1} / span 2`,
    }));
  }

  isSelectedSlot(slot: CalendarSlot) {
    const selected = this.selectedSlot;
    return (
      !!selected &&
      selected.dayIndex === slot.dayIndex &&
      selected.timeIndex === slot.timeIndex &&
      selected.dateLabel === slot.dateLabel &&
      selected.timeLabel === slot.timeLabel
    );
  }

  selectSlot(slot: CalendarSlot) {
    this.slotSelected.emit(slot);
  }

  requestView(event: CalendarEvent) {
    this.viewRequested.emit(event);
  }

  private buildSlots() {
    const dates = this.weekDates.length ? this.weekDates : Array.from({ length: 7 }, (_, index) => new Date(2026, 5, index + 1));

    return dates.flatMap((date, dayIndex) =>
      this.times.map((timeLabel, timeIndex) => {
        const dateLabel = date.toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });

        return {
          dayIndex,
          timeIndex,
          dayLabel: this.weekdays[dayIndex],
          timeLabel,
          dateLabel,
          gridColumn: String(dayIndex + 1),
          gridRow: String(timeIndex + 1),
          eventGridRow: `${timeIndex + 1} / span 2`,
        } satisfies CalendarSlot;
      }),
    );
  }
}
