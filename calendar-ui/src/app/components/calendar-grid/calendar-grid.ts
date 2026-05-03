import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, effect, inject, signal } from '@angular/core';
import { CalendarEvent, CalendarSlot } from '../calendar.models';
import { TimeZoneService } from '../../services/timezone.service';
import { formatDateKey, formatDateLabel, isSameCalendarDay } from '../../services/timezone-format';

@Component({
  standalone: true,
  selector: 'app-calendar-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-grid.html',
  styleUrls: ['./calendar-grid.scss'],
})
export class CalendarGrid implements OnChanges {
  private readonly timeZoneService = inject(TimeZoneService);
  @Input() events: CalendarEvent[] = [];
  @Input() weekDates: Date[] = [];
  @Input() selectedSlot: CalendarSlot | null = null;
  @Input() selectedView: 'day' | 'week' | 'month' = 'week';
  @Input() activeDate: Date = new Date();

  @Output() slotSelected = new EventEmitter<CalendarSlot>();
  @Output() viewRequested = new EventEmitter<CalendarEvent>();

  readonly weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
  readonly times = [
    '6 am',
    '7 am',
    '8 am',
    '9 am',
    '10 am',
    '11 am',
    '12 pm',
    '1 pm',
    '2 pm',
    '3 pm',
    '4 pm',
    '5 pm',
    '6 pm',
    '7 pm',
    '8 pm',
    '9 pm',
    '10 pm',
  ] as const;

  readonly slots = signal<CalendarSlot[]>([]);
  readonly monthDays = signal<(Date | null)[]>([]);
  readonly displayedEvents = signal<CalendarEvent[]>([]);
  readonly maxVisibleMonthEvents = 3;
  readonly expandedMonthDayKey = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.timeZoneService.selectedTimeZone();
      this.slots.set(this.buildSlots());
      this.monthDays.set(this.buildMonthDays());
      this.displayedEvents.set(this.buildDisplayedEvents());
      this.expandedMonthDayKey.set(null);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['weekDates'] || changes['selectedView'] || changes['activeDate'] || changes['events']) {
      this.slots.set(this.buildSlots());
      this.monthDays.set(this.buildMonthDays());
      this.displayedEvents.set(this.buildDisplayedEvents());
      this.expandedMonthDayKey.set(null);
    }
  }

  getMonthDayEvents(day: Date | null): CalendarEvent[] {
    return day
      ? [...this.events.filter((event) => this.eventMatchesDay(event, day))].sort((left, right) => {
          const leftMinutes = this.timeToMinutes(left.startTime);
          const rightMinutes = this.timeToMinutes(right.startTime);
          if (leftMinutes !== rightMinutes) {
            return leftMinutes - rightMinutes;
          }
          return left.title.localeCompare(right.title);
        })
      : [];
  }

  getMonthEventTooltip(event: CalendarEvent): string {
    return `${event.date} - ${event.startTime} to ${event.endTime}`;
  }

  isMonthDayExpanded(day: Date): boolean {
    return this.expandedMonthDayKey() === this.monthDayKey(day);
  }

  toggleMonthDayEvents(day: Date): void {
    const key = this.monthDayKey(day);
    this.expandedMonthDayKey.update((current) => (current === key ? null : key));
  }

  private buildMonthDays(): (Date | null)[] {
    const year = this.activeDate.getFullYear();
    const month = this.activeDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: (Date | null)[] = [];
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date.getMonth() === month ? date : null);
    }
    return days;
  }

  isSelectedSlot(slot: CalendarSlot): boolean {
    const selected = this.selectedSlot;
    return !!selected && selected.dayIndex === slot.dayIndex && selected.timeIndex === slot.timeIndex && selected.dateLabel === slot.dateLabel && selected.timeLabel === slot.timeLabel;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return isSameCalendarDay(date, today, this.timeZoneService.selectedTimeZone());
  }

  isTodayByIndex(dayIndex: number): boolean {
    return !!this.weekDates[dayIndex] && this.isToday(this.weekDates[dayIndex]);
  }

  selectSlot(slot: CalendarSlot): void {
    this.expandedMonthDayKey.set(null);
    this.slotSelected.emit(slot);
  }

  requestView(event: CalendarEvent): void {
    this.expandedMonthDayKey.set(null);
    this.viewRequested.emit(event);
  }

  eventGridColumn(event: CalendarEvent): string {
    const dayIndex = this.resolveEventDayIndex(event);
    return String(dayIndex + 1);
  }

  getMemberNamesLabel(event: CalendarEvent): string {
    return event.selectedMembers.length ? event.selectedMembers.join(', ') : 'No person added';
  }

  getMemberInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  getMemberTone(index: number): 'peach' | 'mint' | 'slate' {
    const tones: Array<'peach' | 'mint' | 'slate'> = ['peach', 'mint', 'slate'];
    return tones[index % tones.length];
  }

  selectMonthDay(day: Date): void {
    this.slotSelected.emit(this.buildMonthSlot(day));
  }

  private buildSlots(): CalendarSlot[] {
    const dates = this.weekDates.length ? this.weekDates : this.buildFallbackWeek();

    return dates.flatMap((date, dayIndex) =>
      this.times.map((timeLabel, timeIndex) => {
        return {
          dayIndex,
          timeIndex,
          dayLabel: this.weekdays[dayIndex],
          timeLabel,
          dateKey: this.formatDateKey(date),
          dateLabel: this.formatDateLabel(date),
          gridColumn: String(dayIndex + 1),
          gridRow: String(timeIndex + 1),
          eventGridRow: `${timeIndex + 1} / span 2`,
        } satisfies CalendarSlot;
      }),
    );
  }

  private buildFallbackWeek(): Date[] {
    return Array.from({ length: 7 }, (_, index) => new Date(2026, 5, index + 1));
  }

  private buildMonthSlot(day: Date): CalendarSlot {
    const dayIndex = (day.getDay() + 6) % 7;

    return {
      dayIndex,
      timeIndex: 0,
      dayLabel: this.weekdays[dayIndex],
      timeLabel: '6 am',
      dateKey: this.formatDateKey(day),
      dateLabel: this.formatDateLabel(day),
      gridColumn: String(dayIndex + 1),
      gridRow: '1',
      eventGridRow: '1 / span 2',
    };
  }

  private formatDateLabel(date: Date): string {
    return formatDateLabel(date, this.timeZoneService.selectedTimeZone());
  }

  private formatDateKey(date: Date): string {
    return formatDateKey(date, this.timeZoneService.selectedTimeZone());
  }

  private buildDisplayedEvents(): CalendarEvent[] {
    if (this.selectedView === 'month') {
      return this.events;
    }

    const visibleDates = new Set(this.weekDates.map((date) => this.formatDateKey(date)));
    const activeDateKey = this.formatDateKey(this.activeDate);

    return this.events.filter((event) => {
      if (this.selectedView === 'day') {
        return this.eventKey(event) === activeDateKey;
      }

      return visibleDates.has(this.eventKey(event));
    });
  }

  monthDayLabel(day: Date): string {
    return this.formatDateLabel(day);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((part) => Number(part));
    return hours * 60 + minutes;
  }

  private monthDayKey(date: Date): string {
    return this.formatDateKey(date);
  }

  private eventKey(event: CalendarEvent): string {
    return event.dateKey || event.date;
  }

  private eventMatchesDay(event: CalendarEvent, day: Date): boolean {
    const dayKey = this.formatDateKey(day);
    return this.eventKey(event) === dayKey || event.date === this.formatDateLabel(day);
  }

  private resolveEventDayIndex(event: CalendarEvent): number {
    if (this.selectedView === 'day') {
      return 0;
    }

    const eventKey = this.eventKey(event);
    const dayIndex = this.weekDates.findIndex((date) => this.formatDateKey(date) === eventKey);
    return dayIndex >= 0 ? dayIndex : Number(event.gridColumn) - 1;
  }
}
