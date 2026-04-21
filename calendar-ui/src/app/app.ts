import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Sidebar } from './components/sidebar/sidebar';
import { Calendar } from './components/calendar/calendar';

@Component({
  standalone: true,
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Sidebar, Calendar],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
}
