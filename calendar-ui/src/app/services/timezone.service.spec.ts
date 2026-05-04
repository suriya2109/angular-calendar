import { TimeZoneService } from './timezone.service';

describe('TimeZoneService', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('should default to the device timezone', () => {
    const service = new TimeZoneService();

    expect(service.selectedTimeZone()).toBe('local');
  });

  it('should update the selected timezone', () => {
    const service = new TimeZoneService();

    service.setTimeZone('Asia/Kolkata');

    expect(service.selectedTimeZone()).toBe('Asia/Kolkata');
    expect(service.selectedTimeZoneLabel()).toBe('Asia/Kolkata');
    expect(globalThis.localStorage.getItem('calendar-ui.timezone')).toBe('Asia/Kolkata');
  });

  it('should restore the timezone from local storage', () => {
    globalThis.localStorage.setItem('calendar-ui.timezone', 'Australia/Sydney');

    const service = new TimeZoneService();

    expect(service.selectedTimeZone()).toBe('Australia/Sydney');
    expect(service.selectedTimeZoneLabel()).toBe('Australia/Sydney');
  });

  it('should ignore invalid stored timezone values', () => {
    globalThis.localStorage.setItem('calendar-ui.timezone', 'Invalid/Zone');

    const service = new TimeZoneService();

    expect(service.selectedTimeZone()).toBe('local');
    expect(globalThis.localStorage.getItem('calendar-ui.timezone')).toBe('local');
  });
});
