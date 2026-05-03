import { CalendarEvent } from '../components/calendar.models';
import { formatDateKey, formatDateLabel } from './timezone-format';

function cloneDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, offset: number): Date {
  const next = cloneDate(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function createSeedEvent(
  id: number,
  title: string,
  offsetDays: number,
  startTime: string,
  endTime: string,
  location: string,
  category: CalendarEvent['category'],
  selectedTags: string[],
  selectedMembers: string[],
  theme: CalendarEvent['theme'],
  gridColumn: string,
  gridRow: string,
): CalendarEvent {
  const date = addDays(new Date(), offsetDays);

  return {
    id,
    title,
    dateKey: formatDateKey(date, 'local'),
    date: formatDateLabel(date, 'local'),
    startTime,
    endTime,
    location,
    category,
    selectedTags,
    selectedMembers,
    theme,
    gridColumn,
    gridRow,
  };
}

export const INITIAL_EVENTS: CalendarEvent[] = [
  createSeedEvent(1, 'Booking taxi app', 0, '06:00', '07:30', 'North Wing Studio', 'Work', ['Design', 'Developer task'], ['Alya', 'Mika'], 'purple', '1', '1 / span 2'),
  createSeedEvent(2, 'Design onboarding', 1, '06:00', '07:10', 'Remote', 'Personal', ['Personal project'], ['Alya', 'Noah'], 'green', '4', '2 / span 2'),
  createSeedEvent(3, 'Development meet', 2, '08:40', '10:00', 'Main board room', 'Work', ['Developer task'], ['Mika', 'Noah'], 'blue', '1', '4 / span 3'),
  createSeedEvent(4, 'Design session', 3, '07:50', '09:30', 'Park Lane Office', 'Work', ['Design', 'Personal project'], ['Alya', 'Mika', 'Noah'], 'yellow', '3', '5 / span 4'),
  createSeedEvent(5, 'Design our website', 4, '08:30', '10:50', 'Creative studio', 'Personal', ['Design'], ['Alya'], 'pink', '6', '5 / span 3'),
];
