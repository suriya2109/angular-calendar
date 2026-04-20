import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  OnChanges,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CalendarSlot } from '../calendar.models';

type Tag = {
  label: string;
  color: string;
};

type TeamMember = {
  name: string;
  initials: string;
  tone: string;
};

export type EventModalValue = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  selectedTags: string[];
  selectedMembers: string[];
};

@Component({
  standalone: true,
  selector: 'app-event-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-modal.html',
  styleUrls: ['./event-modal.scss'], // ✅ fixed typo (styleUrl → styleUrls)
})
export class EventModal implements OnChanges {
  private readonly fb = inject(FormBuilder);

  // 🔹 INPUT / OUTPUT
  @Input() open = false;
  @Input() value: EventModalValue | null = null;
  @Input() selectedSlot: CalendarSlot | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EventModalValue>();

  // 🔹 STATIC DATA
  readonly tags: Tag[] = [
    { label: 'Design', color: 'lavender' },
    { label: 'Personal project', color: 'sand' },
    { label: 'Developer task', color: 'sky' },
  ];

  readonly team: TeamMember[] = [
    { name: 'Alya', initials: 'A', tone: 'peach' },
    { name: 'Mika', initials: 'M', tone: 'mint' },
    { name: 'Noah', initials: 'N', tone: 'slate' },
  ];

  readonly leftEvents = [
    { title: 'Design session', time: '07:50 - 09:30', tone: 'gold' },
    { title: 'Design Review', time: '09:40 - 10:30', tone: 'blue' },
    { title: 'Onboarding meet', time: '10:50 - 12:00', tone: 'pink' },
  ];

  readonly timeOptions = [
    '06:00', '06:30',
    '07:00', '07:30',
    '08:00', '08:30',
    '09:00', '09:30',
    '10:00', '10:30',
    '11:00', '11:30',
    '12:00', '12:30',
    '13:00', '13:30',
    '14:00', '14:30',
    '15:00', '15:30',
    '16:00', '16:30',
    '17:00', '17:30',
    '18:00', '18:30',
    '19:00', '19:30',
    '20:00', '20:30',
    '21:00', '21:30',
    '22:00', '22:30',
    '23:00', '23:30',
    '00:00'
  ];

  // 🔹 DEFAULT VALUE (reusable)
  private readonly defaultValue: EventModalValue = {
    title: '',
    date: '',
    startTime: '06:00',
    endTime: '07:00',
    location: '',
    selectedTags: [],
    selectedMembers: [],
  };

  // 🔹 FORM
  readonly form = this.fb.nonNullable.group({
    title: this.fb.nonNullable.control(this.defaultValue.title),
    date: this.fb.nonNullable.control(this.defaultValue.date),
    startTime: this.fb.nonNullable.control(this.defaultValue.startTime),
    endTime: this.fb.nonNullable.control(this.defaultValue.endTime),
    location: this.fb.nonNullable.control(this.defaultValue.location),
    selectedTags: this.fb.nonNullable.control(this.defaultValue.selectedTags),
    selectedMembers: this.fb.nonNullable.control(this.defaultValue.selectedMembers),
  });

  // 🔹 HANDLE INPUT CHANGES
  ngOnChanges(changes: SimpleChanges) {
    if (!changes['value'] && !changes['selectedSlot']) return;

    this.form.reset(this.value ?? this.slotToValue(this.selectedSlot) ?? this.defaultValue);
  }

  // 🔹 HELPERS
  timeDisplay(time24: string): string {
    // Convert "06:00" to "6:00 AM", "13:00" to "1:00 PM"
    const [hours, minutes] = time24.split(':');
    let hours24 = parseInt(hours, 10);
    let ampm = 'AM';

    if (hours24 >= 12) {
      ampm = 'PM';
      if (hours24 > 12) {
        hours24 -= 12;
      }
    } else if (hours24 === 0) {
      hours24 = 12;
    }

    return `${hours24}:${minutes} ${ampm}`;
  }

  isTagSelected(label: string): boolean {
    return this.form.controls.selectedTags.value.includes(label);
  }

  isMemberSelected(name: string): boolean {
    return this.form.controls.selectedMembers.value.includes(name);
  }

  toggleTag(label: string) {
    const current = this.form.controls.selectedTags.value;

    const next = current.includes(label)
      ? current.filter((item) => item !== label)
      : [...current, label];

    this.form.controls.selectedTags.setValue(next);
  }

  toggleMember(name: string) {
    const current = this.form.controls.selectedMembers.value;

    const next = current.includes(name)
      ? current.filter((item) => item !== name)
      : [...current, name];

    this.form.controls.selectedMembers.setValue(next);
  }

  // 🔹 SUBMIT
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saved.emit(this.form.getRawValue());
  }

  // 🔹 CLOSE
  close() {
    this.closed.emit();
  }

  private slotToValue(slot: CalendarSlot | null): EventModalValue | null {
    if (!slot) {
      return null;
    }

    const startTime = this.timeLabel24Hour(slot.timeLabel);
    const endTime = this.addOneHour(startTime);

    return {
      title: '',
      date: slot.dateLabel,
      startTime,
      endTime,
      location: '',
      selectedTags: [],
      selectedMembers: [],
    };
  }

  private timeLabel24Hour(label: string): string {
    // Convert "6 am" to "06:00", "1 pm" to "13:00", etc.
    const match = label.match(/(\d+)\s*(am|pm)/i);
    if (!match) return '06:00';

    let hours = parseInt(match[1], 10);
    const isPm = match[2].toLowerCase() === 'pm';

    if (isPm && hours !== 12) {
      hours += 12;
    } else if (!isPm && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:00`;
  }

  private addOneHour(time: string): string {
    // Convert "06:00" to "07:00"
    const [hours, minutes] = time.split(':');
    const nextHour = (parseInt(hours, 10) + 1).toString().padStart(2, '0');
    return `${nextHour}:${minutes}`;
  }
}
