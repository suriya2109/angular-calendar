import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CalendarGrid } from '../calendar-grid/calendar-grid';
import { CalendarEvent, CalendarSlot, CalendarTheme } from '../calendar.models';
import { EventModal, EventModalValue } from '../event-modal/event-modal';
import { DateSyncService } from '../../services/date-sync.service';
import { CalendarEventsService } from '../../services/calendar-events.service';
import { TimeZoneService } from '../../services/timezone.service';
import { formatDateKey, formatDateLabel as formatDateLabelInZone, formatMonthLabel, formatWeekdayLabel, isSameCalendarDay } from '../../services/timezone-format';

type CalendarView = 'month' | 'week' | 'day';

const VIEW_OPTIONS = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
] as const;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DEFAULT_SLOTS = [
  { gridColumn: '7', gridRow: '1 / span 2' },
  { gridColumn: '5', gridRow: '2 / span 2' },
  { gridColumn: '2', gridRow: '4 / span 2' },
  { gridColumn: '4', gridRow: '6 / span 2' },
] as const;

const EMPTY_EVENT: EventModalValue = {
  title: '',
  date: '',
  startTime: '06:00',
  endTime: '07:00',
  location: '',
  category: 'Personal',
  selectedTags: [],
  selectedMembers: [],
};

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

function formatDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function timeLabel24Hour(label: string): string {
  const match = label.match(/(\d+)\s*(am|pm)/i);
  if (!match) return '06:00';

  let hours = parseInt(match[1], 10);
  const isPm = match[2].toLowerCase() === 'pm';

  if (isPm && hours !== 12) {
    hours += 12;
  } else if (!isPm && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:00`;
}

function addOneHour(time: string): string {
  const [hours, minutes] = time.split(':');
  const nextHour = (parseInt(hours, 10) + 1).toString().padStart(2, '0');
  return `${nextHour}:${minutes}`;
}

@Component({
  standalone: true,
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarGrid, EventModal],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
  host: { ngSkipHydration: 'true' },
})
export class Calendar {
  private dateSyncService = inject(DateSyncService);
  private calendarEventsService = inject(CalendarEventsService);
  private timeZoneService = inject(TimeZoneService);

  readonly selectedView = signal<CalendarView>('week');
  readonly activeDate = signal(new Date());
  readonly selectedTimeZone = this.timeZoneService.selectedTimeZone;

  readonly events = this.calendarEventsService.events;
  readonly filteredEvents = computed(() => {
    const visibleCategories = this.calendarEventsService.visibleCategories();
    return this.events().filter((event) => visibleCategories[event.category]);
  });
  readonly visibleEvents = computed(() => {
    const events = this.filteredEvents();
    const view = this.selectedView();

    if (view === 'month') {
      return events;
    }

    if (view === 'day') {
      const activeDateKey = this.formatDateKey(this.activeDate());
      return events.filter((event) => this.eventDateKey(event) === activeDateKey);
    }

    return events;
  });
  readonly selectedSlot = signal<CalendarSlot | null>(null);
  readonly isModalOpen = signal(false);
  readonly editingEvent = signal<CalendarEvent | null>(null);
  readonly modalValue = signal<EventModalValue>({ ...EMPTY_EVENT });

  readonly views = VIEW_OPTIONS;
  readonly weekdays = WEEKDAYS;

  constructor() {
    effect(() => {
      const serviceDate = this.dateSyncService.selectedDate();
      this.activeDate.set(cloneDate(serviceDate));
    });
  }

  title = computed(() => {
    const date = this.activeDate();
    return formatMonthLabel(date, this.selectedTimeZone());
  });

  weekDates = computed(() => {
    switch (this.selectedView()) {
      case 'day':
        return [this.activeDate()];
      case 'month':
        return this.buildMonthDates();
      default:
        return this.buildWeekDates();
    }
  });

  weekdayLabel(date: Date): string {
    return formatWeekdayLabel(date, this.selectedTimeZone());
  }

  setView(view: CalendarView): void {
    this.selectedView.set(view);
  }

  selectDate(date: Date): void {
    this.syncActiveDate(date);
  }

  prev(): void {
    this.syncActiveDate(this.shiftDate(-1));
  }

  next(): void {
    this.syncActiveDate(this.shiftDate(1));
  }

  gotoToday(): void {
    this.syncActiveDate(new Date());
  }

  isSelected(date: Date): boolean {
    const active = this.activeDate();
    return isSameCalendarDay(date, active, this.selectedTimeZone());
  }

  onSlotSelected(slot: CalendarSlot): void {
    this.syncActiveDateFromKey(slot.dateKey);
    this.selectedSlot.set(slot);
    this.editingEvent.set(null);
    this.modalValue.set(this.buildValueFromSlot(slot));
    this.isModalOpen.set(true);
  }

  onViewRequested(event: CalendarEvent): void {
    this.syncActiveDateFromKey(event.dateKey);
    this.editingEvent.set(event);
    this.selectedSlot.set(this.slotFromEvent(event));
    this.modalValue.set(this.eventToValue(event));
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.resetModalState();
  }

  saveEvent(value: EventModalValue): void {
    const editing = this.editingEvent();

    if (editing) {
      this.events.update((items) => items.map((item) => (item.id === editing.id ? { ...item, ...value } : item)));
    } else {
      const nextId = this.nextEventId();
      const created = this.createEvent(value, nextId, this.selectedSlot());
      this.events.update((items) => [...items, created]);
    }

    this.resetModalState();
  }

  private createEvent(value: EventModalValue, id: number, slot: CalendarSlot | null): CalendarEvent {
    const position = slot ?? this.defaultSlotForIndex();
    return {
      id,
      ...value,
      dateKey: position.dateKey,
      theme: this.themeForIndex(id),
      gridColumn: position.gridColumn,
      gridRow: position.eventGridRow,
    };
  }

  private buildWeekDates(): Date[] {
    const start = startOfWeek(this.activeDate());
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }

  private buildMonthDates(): Date[] {
    const active = this.activeDate();
    const year = active.getFullYear();
    const month = active.getMonth();
    const lastDay = new Date(year, month + 1, 0);

    return Array.from({ length: lastDay.getDate() }, (_, index) => new Date(year, month, index + 1));
  }

  private shiftDate(direction: -1 | 1): Date {
    const current = this.activeDate();

    switch (this.selectedView()) {
      case 'month':
        return new Date(current.getFullYear(), current.getMonth() + direction, 1);
      case 'day':
        return addDays(current, direction);
      default:
        return addDays(current, direction * 7);
    }
  }

  private nextEventId(): number {
    return this.events().reduce((max, event) => Math.max(max, event.id), 0) + 1;
  }

  private buildValueFromSlot(slot: CalendarSlot): EventModalValue {
    const startTime = timeLabel24Hour(slot.timeLabel);
    const endTime = addOneHour(startTime);

    return {
      ...EMPTY_EVENT,
      date: slot.dateLabel,
      startTime,
      endTime,
    };
  }

  private eventToValue(event: CalendarEvent): EventModalValue {
    return {
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      category: event.category,
      selectedTags: [...event.selectedTags],
      selectedMembers: [...event.selectedMembers],
    };
  }

  private slotFromEvent(event: CalendarEvent): CalendarSlot {
    const dayIndex = this.resolveEventDayIndex(event);
    const timeIndex = Number(event.gridRow.split(' ')[0]) - 1;
    const weekDates = this.weekDates();
    const date = weekDates[dayIndex] ?? this.activeDate();

    return {
      dayIndex,
      timeIndex,
      dayLabel: this.weekdays[dayIndex] ?? 'Mon',
      timeLabel: event.startTime,
      dateKey: this.formatDateKey(date),
      dateLabel: formatDateLabelInZone(date, this.selectedTimeZone()),
      gridColumn: event.gridColumn,
      gridRow: event.gridRow,
      eventGridRow: event.gridRow,
    };
  }

  private resolveEventDayIndex(event: CalendarEvent): number {
    const dates = this.weekDates();
    const eventKey = event.dateKey;
    const index = eventKey ? dates.findIndex((date) => this.formatDateKey(date) === eventKey) : -1;

    if (index >= 0) {
      return index;
    }

    const fallbackIndex = Number(event.gridColumn) - 1;
    return Number.isFinite(fallbackIndex) && fallbackIndex >= 0 ? fallbackIndex : 0;
  }

  private defaultSlotForIndex(): CalendarSlot {
    const slot = DEFAULT_SLOTS[this.events().length % DEFAULT_SLOTS.length];

    return {
      dayIndex: Number(slot.gridColumn) - 1,
      timeIndex: Number(slot.gridRow.split(' ')[0]) - 1,
      dayLabel: this.weekdays[Number(slot.gridColumn) - 1] ?? 'Mon',
      timeLabel: '06:00',
      dateKey: this.formatDateKey(this.weekDates()[Number(slot.gridColumn) - 1] ?? this.activeDate()),
      dateLabel: formatDateLabelInZone(this.weekDates()[Number(slot.gridColumn) - 1] ?? this.activeDate(), this.selectedTimeZone()),
      gridColumn: slot.gridColumn,
      gridRow: slot.gridRow,
      eventGridRow: slot.gridRow,
    };
  }

  private syncActiveDate(date: Date) {
    const clonedDate = cloneDate(date);
    this.activeDate.set(clonedDate);
    this.dateSyncService.setSelectedDate(clonedDate);
  }

  private syncActiveDateFromKey(dateKey: string): void {
    const parsed = this.parseDateKey(dateKey);
    if (parsed) {
      this.syncActiveDate(parsed);
    }
  }

  private formatDateKey(date: Date): string {
    return formatDateKey(date, this.selectedTimeZone());
  }

  private eventDateKey(event: CalendarEvent): string {
    return event.dateKey;
  }

  private parseDateKey(dateKey: string): Date | null {
    const parsed = new Date(`${dateKey}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private resetModalState(): void {
    this.isModalOpen.set(false);
    this.editingEvent.set(null);
    this.selectedSlot.set(null);
    this.modalValue.set({ ...EMPTY_EVENT });
  }

  private themeForIndex(index: number): CalendarTheme {
    const themes: CalendarTheme[] = ['violet', 'green', 'blue', 'yellow', 'pink'];
    return themes[(index - 1) % themes.length];
  }
}
