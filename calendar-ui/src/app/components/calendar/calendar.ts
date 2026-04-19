import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { CalendarGrid } from '../calendar-grid/calendar-grid';
import { CalendarEvent, CalendarSlot, CalendarTheme } from '../calendar.models';
import { EventModal, EventModalValue } from '../event-modal/event-modal';

const VIEW_OPTIONS = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
] as const;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 1,
    title: 'Booking taxi app',
    date: 'Monday, 17 June',
    startTime: '06:00',
    endTime: '07:30',
    location: 'North Wing Studio',
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

@Component({
  standalone: true,
  selector: 'app-calendar',
  imports: [CommonModule, CalendarGrid, EventModal],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
  host: { ngSkipHydration: 'true' },
})
export class Calendar {
  selectedView = signal<'month' | 'week' | 'day'>('week');
  activeDate = signal(new Date());

  readonly events = signal<CalendarEvent[]>(INITIAL_EVENTS);
  readonly selectedEvent = signal<CalendarEvent | null>(null);
  readonly selectedSlot = signal<CalendarSlot | null>(null);
  readonly isModalOpen = signal(false);
  readonly editingEvent = signal<CalendarEvent | null>(null);
  readonly modalValue = signal<EventModalValue>({ ...EMPTY_EVENT });

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
      this.activeDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    } else if (this.selectedView() === 'day') {
      this.activeDate.set(addDays(current, -1));
    } else {
      this.activeDate.set(addDays(current, -7));
    }
  }

  next() {
    const current = this.activeDate();
    if (this.selectedView() === 'month') {
      this.activeDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
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

  openAddEvent() {
    this.selectedEvent.set(null);
    this.editingEvent.set(null);
    this.selectedSlot.set(null);
    this.modalValue.set({ ...EMPTY_EVENT });
    this.isModalOpen.set(true);
  }

  onSlotSelected(slot: CalendarSlot) {
    this.selectedSlot.set(slot);
    this.editingEvent.set(null);
    this.selectedEvent.set(null);
    this.modalValue.set(this.buildValueFromSlot(slot));
    this.isModalOpen.set(true);
  }

  onViewRequested(event: CalendarEvent) {
    this.selectedEvent.set(event);
    this.editingEvent.set(event);
    this.selectedSlot.set(this.slotFromEvent(event));
    this.modalValue.set({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      selectedTags: [...event.selectedTags],
      selectedMembers: [...event.selectedMembers],
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingEvent.set(null);
  }

  saveEvent(value: EventModalValue) {
    const editing = this.editingEvent();

    if (editing) {
      this.events.update((items) => items.map((item) => (item.id === editing.id ? { ...item, ...value } : item)));
      this.selectedEvent.set({ ...editing, ...value });
    } else {
      const nextId = this.events().length > 0 ? Math.max(...this.events().map((event) => event.id)) + 1 : 1;
      const created = this.createEvent(value, nextId, this.selectedSlot());
      this.events.update((items) => [...items, created]);
      this.selectedEvent.set(created);
    }

    this.modalValue.set({ ...EMPTY_EVENT });
    this.selectedSlot.set(null);
    this.closeModal();
  }

  private createEvent(value: EventModalValue, id: number, slot: CalendarSlot | null): CalendarEvent {
    const position = slot ?? this.defaultSlotForIndex(id);
    return {
      id,
      ...value,
      theme: this.themeForIndex(id),
      gridColumn: position.gridColumn,
      gridRow: position.eventGridRow,
    };
  }

  private buildValueFromSlot(slot: CalendarSlot): EventModalValue {
    return {
      ...EMPTY_EVENT,
      date: slot.dateLabel,
      startTime: slot.timeLabel,
      endTime: slot.timeLabel,
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

  private defaultSlotForIndex(index: number): CalendarSlot {
    const slot = [
      { gridColumn: '7', gridRow: '1 / span 2' },
      { gridColumn: '5', gridRow: '2 / span 2' },
      { gridColumn: '2', gridRow: '4 / span 2' },
      { gridColumn: '4', gridRow: '6 / span 2' },
    ][(index - 1) % 4];

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

  private themeForIndex(index: number): CalendarTheme {
    const themes: CalendarTheme[] = ['violet', 'green', 'blue', 'yellow', 'pink'];
    return themes[(index - 1) % themes.length];
  }
}
