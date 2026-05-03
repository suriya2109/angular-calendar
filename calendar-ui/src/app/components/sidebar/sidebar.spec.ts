import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show 29 days for February in a leap year', () => {
    component.activeMonthDate.set(new Date(2024, 1, 1));

    const days = component.monthGrid().filter((day): day is number => day !== null);

    expect(days.length).toBe(29);
    expect(days[days.length - 1]).toBe(29);
  });

  it('should move by year when using year navigation', () => {
    component.activeMonthDate.set(new Date(2024, 1, 1));

    component.prevYear();
    expect(component.activeMonthDate().getFullYear()).toBe(2023);
    expect(component.activeMonthDate().getMonth()).toBe(1);

    component.nextYear();
    component.nextYear();
    expect(component.activeMonthDate().getFullYear()).toBe(2025);
    expect(component.activeMonthDate().getMonth()).toBe(1);
  });

  it('should allow selecting February 29 on leap years', () => {
    component.activeMonthDate.set(new Date(2024, 1, 1));
    component.selectDate(29);

    expect(component.selectedDate().getFullYear()).toBe(2024);
    expect(component.selectedDate().getMonth()).toBe(1);
    expect(component.selectedDate().getDate()).toBe(29);
  });

  it('should update the display timezone when selected', () => {
    component.setTimeZone('UTC');

    expect(component.selectedTimeZone()).toBe('UTC');
  });
});
