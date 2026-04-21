import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CalendarGrid } from '../calendar-grid/calendar-grid';
import { CalendarEvent, CalendarSlot, CalendarTheme } from '../calendar.models';
import { EventModal, EventModalValue } from '../event-modal/event-modal';
import { DateSyncService } from '../../services/date-sync.service';

type CalendarView = 'month' | 'week' | 'day';

const VIEW_OPTIONS = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
] as const;

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
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DEFAULT_SLOTS = [
  { gridColumn: '7', gridRow: '1 / span 2' },
  { gridColumn: '5', gridRow: '2 / span 2' },
  { gridColumn: '2', gridRow: '4 / span 2' },
  { gridColumn: '4', gridRow: '6 / span 2' },
] as const;

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 1,
    title: 'Booking taxi app',
    date: 'Monday, 17 June',
    startTime: '06:00',
    endTime: '07:30',
    location: 'North Wing Studio',
    category: 'Work',
    selectedTags: ['Design', 'Developer task'],
    selectedMembers: ['Alya', 'Mika'],
    theme: 'purple',
    gridColumn: '1',
    gridRow: '1 / span 2',
  },
  {
    id: 2,
    title: 'Design onboarding',
    date: 'Monday, 17 June',
    startTime: '06:00',
    endTime: '07:10',
    location: 'Remote',
    category: 'Personal',
    selectedTags: ['Personal project'],
    selectedMembers: ['Alya', 'Noah'],
    theme: 'green',
    gridColumn: '4',
    gridRow: '2 / span 2',
  },
  {
    id: 3,
    title: 'Development meet',
    date: 'Monday, 17 June',
    startTime: '08:40',
    endTime: '10:00',
    location: 'Main board room',
    category: 'Work',
    selectedTags: ['Developer task'],
    selectedMembers: ['Mika', 'Noah'],
    theme: 'blue',
    gridColumn: '1',
    gridRow: '4 / span 3',
  },
  {
    id: 4,
    title: 'Design session',
    date: 'Tuesday, 18 December',
    startTime: '07:50',
    endTime: '09:30',
    location: 'Park Lane Office',
    category: 'Work',
    selectedTags: ['Design', 'Personal project'],
    selectedMembers: ['Alya', 'Mika', 'Noah'],
    theme: 'yellow',
    gridColumn: '3',
    gridRow: '5 / span 4',
  },
  {
    id: 5,
    title: 'Design our website',
    date: 'Wednesday, 19 June',
    startTime: '08:30',
    endTime: '10:50',
    location: 'Creative studio',
    category: 'Personal',
    selectedTags: ['Design'],
    selectedMembers: ['Alya'],
    theme: 'pink',
    gridColumn: '6',
    gridRow: '5 / span 3',
  },
];

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

  readonly selectedView = signal<CalendarView>('week');
  readonly activeDate = signal(new Date());

  readonly events = signal<CalendarEvent[]>(INITIAL_EVENTS);
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
    return `${MONTH_NAMES[date.getMonth()]}, ${date.getFullYear()}`;
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
    return this.weekdays[(date.getDay() + 6) % 7];
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
    return date.getTime() === active.getTime();
  }

  onSlotSelected(slot: CalendarSlot): void {
    this.selectedSlot.set(slot);
    this.editingEvent.set(null);
    this.modalValue.set(this.buildValueFromSlot(slot));
    this.isModalOpen.set(true);
  }

  onViewRequested(event: CalendarEvent): void {
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
    const dayIndex = Number(event.gridColumn) - 1;
    const timeIndex = Number(event.gridRow.split(' ')[0]) - 1;
    const weekDates = this.weekDates();
    const date = weekDates[dayIndex] ?? this.activeDate();

    return {
      dayIndex,
      timeIndex,
      dayLabel: this.weekdays[dayIndex] ?? 'Mon',
      timeLabel: event.startTime,
      dateLabel: formatDateLabel(date),
      gridColumn: event.gridColumn,
      gridRow: event.gridRow,
      eventGridRow: event.gridRow,
    };
  }

  private defaultSlotForIndex(): CalendarSlot {
    const slot = DEFAULT_SLOTS[this.events().length % DEFAULT_SLOTS.length];

    return {
      dayIndex: Number(slot.gridColumn) - 1,
      timeIndex: Number(slot.gridRow.split(' ')[0]) - 1,
      dayLabel: this.weekdays[Number(slot.gridColumn) - 1] ?? 'Mon',
      timeLabel: '06:00',
      dateLabel: formatDateLabel(this.weekDates()[Number(slot.gridColumn) - 1] ?? this.activeDate()),
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
