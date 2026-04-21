import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateSyncService {
  selectedDate = signal(new Date());

  setSelectedDate(date: Date) {
    this.selectedDate.set(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
  }
}
