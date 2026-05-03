export type CalendarTimeZone = 'local' | string;

function resolvedTimeZone(timeZone: CalendarTimeZone): string | undefined {
  return timeZone === 'local' ? undefined : timeZone;
}

function dateParts(date: Date, timeZone: CalendarTimeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolvedTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup['year']),
    month: Number(lookup['month']),
    day: Number(lookup['day']),
  };
}

export function formatMonthLabel(date: Date, timeZone: CalendarTimeZone): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: resolvedTimeZone(timeZone),
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateLabel(date: Date, timeZone: CalendarTimeZone): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: resolvedTimeZone(timeZone),
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatDateKey(date: Date, timeZone: CalendarTimeZone): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolvedTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

export function formatWeekdayLabel(date: Date, timeZone: CalendarTimeZone, length: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: resolvedTimeZone(timeZone),
    weekday: length,
  }).format(date);
}

export function isSameCalendarDay(left: Date, right: Date, timeZone: CalendarTimeZone): boolean {
  const leftParts = dateParts(left, timeZone);
  const rightParts = dateParts(right, timeZone);

  return (
    leftParts.year === rightParts.year &&
    leftParts.month === rightParts.month &&
    leftParts.day === rightParts.day
  );
}
