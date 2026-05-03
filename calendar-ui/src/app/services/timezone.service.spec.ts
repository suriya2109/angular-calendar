import { TimeZoneService } from './timezone.service';

describe('TimeZoneService', () => {
  it('should default to the device timezone', () => {
    const service = new TimeZoneService();

    expect(service.selectedTimeZone()).toBe('local');
  });

  it('should update the selected timezone', () => {
    const service = new TimeZoneService();

    service.setTimeZone('Asia/Kolkata');

    expect(service.selectedTimeZone()).toBe('Asia/Kolkata');
    expect(service.selectedTimeZoneLabel()).toBe('Asia/Kolkata');
  });
});
