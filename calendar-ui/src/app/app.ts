import { Component, signal } from '@angular/core';
import { Sidebar } from './components/sidebar/sidebar';
import { Calendar } from './components/calendar/calendar';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [Sidebar, Calendar],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  protected readonly title = signal('calendar-ui');
}
