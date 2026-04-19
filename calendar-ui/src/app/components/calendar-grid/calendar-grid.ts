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

  @Output() slotSelected = new EventEmitter<CalendarSlot>();
  @Output() viewRequested = new EventEmitter<CalendarEvent>();

  readonly weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly times = ['6 am', '7 am', '8 am', '9 am', '10 am', '11 am', '12 pm'];

  readonly slots = signal<CalendarSlot[]>([]);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['weekDates']) {
      this.slots.set(this.buildSlots());
    }
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
