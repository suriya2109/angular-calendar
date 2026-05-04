import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { CalendarTimeZone } from './timezone-format';

export type TimeZoneOption = {
  value: CalendarTimeZone;
  label: string;
  description: string;
};

const TIME_ZONE_OPTIONS: TimeZoneOption[] = [
  {
    value: 'local',
    label: 'Use device time zone',
    description: 'Automatically follows the user’s browser or device location.',
  },
  {
    value: 'UTC',
    label: 'UTC',
    description: 'Use a stable universal reference time.',
  },
  {
    value: 'Asia/Kolkata',
    label: 'Asia/Kolkata',
    description: 'India Standard Time.',
  },
  {
    value: 'Europe/London',
    label: 'Europe/London',
    description: 'United Kingdom time.',
  },
  {
    value: 'America/New_York',
    label: 'America/New_York',
    description: 'US Eastern time.',
  },
  {
    value: 'America/Los_Angeles',
    label: 'America/Los_Angeles',
    description: 'US Pacific time.',
  },
  {
    value: 'Asia/Tokyo',
    label: 'Asia/Tokyo',
    description: 'Japan Standard Time.',
  },
  {
    value: 'Australia/Sydney',
    label: 'Australia/Sydney',
    description: 'Australian Eastern time.',
  },
];

@Injectable({
  providedIn: 'root',
})
export class TimeZoneService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'calendar-ui.timezone';
  readonly timeZoneOptions = TIME_ZONE_OPTIONS;
  readonly selectedTimeZone = signal<CalendarTimeZone>(this.readStoredTimeZone());
  readonly selectedTimeZoneLabel = computed(() => {
    return this.timeZoneOptions.find((option) => option.value === this.selectedTimeZone())?.label ?? 'Use device time zone';
  });

  constructor() {
    effect(() => {
      this.writeStoredTimeZone(this.selectedTimeZone());
    });
  }

  setTimeZone(timeZone: CalendarTimeZone): void {
    this.selectedTimeZone.set(timeZone);
  }

  private readStoredTimeZone(): CalendarTimeZone {
    if (!this.isBrowser()) {
      return 'local';
    }

    const storedTimeZone = globalThis.localStorage.getItem(this.storageKey);
    return this.isValidTimeZone(storedTimeZone) ? storedTimeZone : 'local';
  }

  private writeStoredTimeZone(timeZone: CalendarTimeZone): void {
    if (!this.isBrowser()) {
      return;
    }

    globalThis.localStorage.setItem(this.storageKey, timeZone);
  }

  private isValidTimeZone(timeZone: string | null): timeZone is CalendarTimeZone {
    return !!timeZone && this.timeZoneOptions.some((option) => option.value === timeZone);
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
