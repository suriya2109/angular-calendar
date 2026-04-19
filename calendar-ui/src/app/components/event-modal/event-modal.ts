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

  readonly timeOptions = ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30'];

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

    return {
      title: '',
      date: slot.dateLabel,
      startTime: slot.timeLabel,
      endTime: slot.timeLabel,
      location: '',
      selectedTags: [],
      selectedMembers: [],
    };
  }
}
