import { Component, signal } from '@angular/core';
import { Sidebar } from './components/sidebar/sidebar';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [Sidebar],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  protected readonly title = signal('calendar-ui');
}
