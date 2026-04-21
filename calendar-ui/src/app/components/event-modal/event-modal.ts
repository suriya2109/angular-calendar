import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CalendarSlot } from '../calendar.models';

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
  category: 'Personal' | 'Work' | 'Health';
  selectedTags: string[];
  selectedMembers: string[];
};

@Component({
  standalone: true,
  selector: 'app-event-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './event-modal.html',
  styleUrls: ['./event-modal.scss'],
})
export class EventModal implements OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly document = inject(DOCUMENT);
  private previousBodyOverflow = '';

  readonly tagOptions = ['Design', 'Personal project', 'Developer task'] as const;
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
    '00:00',
  ] as const;

  private readonly baseMembers: TeamMember[] = [
    { name: 'Alya', initials: 'A', tone: 'peach' },
    { name: 'Mika', initials: 'M', tone: 'mint' },
    { name: 'Noah', initials: 'N', tone: 'slate' },
  ];

  @Input() open = false;
  @Input() value: EventModalValue | null = null;
  @Input() selectedSlot: CalendarSlot | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EventModalValue>();

  private readonly defaultValue: EventModalValue = {
    title: '',
    date: '',
    startTime: '06:00',
    endTime: '07:00',
    location: '',
    category: 'Personal',
    selectedTags: [...this.tagOptions],
    selectedMembers: [],
  };

  team: TeamMember[] = [...this.baseMembers];
  memberName = '';
  memberPickerOpen = false;
  private selectedTags: string[] = [];

  readonly form = this.fb.nonNullable.group({
    title: this.fb.nonNullable.control(this.defaultValue.title),
    date: this.fb.nonNullable.control(this.defaultValue.date),
    startTime: this.fb.nonNullable.control(this.defaultValue.startTime),
    endTime: this.fb.nonNullable.control(this.defaultValue.endTime),
    location: this.fb.nonNullable.control(this.defaultValue.location),
    category: this.fb.nonNullable.control(this.defaultValue.category),
    selectedMembers: this.fb.nonNullable.control<string[]>([]),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] || changes['value'] || changes['selectedSlot']) {
      this.syncForm();
    }

    if (changes['open']) {
      this.syncBodyScroll();
    }
  }

  timeDisplay(time24: string): string {
    const [hoursPart, minutes] = time24.split(':');
    const hours = Number(hoursPart);
    const hours12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';

    return `${hours12}:${minutes} ${ampm}`;
  }

  isMemberSelected(name: string): boolean {
    return this.form.controls.selectedMembers.value.includes(name);
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  toggleMemberPicker(): void {
    this.memberPickerOpen = !this.memberPickerOpen;

    if (!this.memberPickerOpen) {
      this.memberName = '';
    }
  }

  onMemberNameInput(event: Event): void {
    this.memberName = (event.target as HTMLInputElement).value;
  }

  addMember(): void {
    const name = this.memberName.trim();
    if (!name) {
      return;
    }

    const selectedMembers = this.form.controls.selectedMembers.value;
    if (!selectedMembers.includes(name)) {
      this.form.controls.selectedMembers.setValue([...selectedMembers, name]);
    }

    this.ensureTeamMember(name);
    this.memberName = '';
    this.memberPickerOpen = false;
  }

  toggleMember(name: string): void {
    const current = this.form.controls.selectedMembers.value;

    const next = current.includes(name)
      ? current.filter((item) => item !== name)
      : [...current, name];

    this.form.controls.selectedMembers.setValue(next);
  }

  toggleTag(tag: string): void {
    this.selectedTags = this.selectedTags.includes(tag)
      ? this.selectedTags.filter((item) => item !== tag)
      : [...this.selectedTags, tag];
  }

  submit(): void {
    this.saved.emit({
      ...this.form.getRawValue(),
      selectedTags: [...this.selectedTags],
    });
  }

  close(): void {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.restoreBodyScroll();
  }

  private syncForm(): void {
    if (!this.open) {
      return;
    }

    const nextValue = this.value ?? this.valueFromSlot(this.selectedSlot) ?? this.defaultValue;

    this.selectedTags = nextValue.selectedTags.length > 0 ? [...nextValue.selectedTags] : [...this.tagOptions];
    this.team = this.buildTeam(nextValue.selectedMembers);
    this.memberName = '';
    this.memberPickerOpen = false;

    this.form.reset({
      title: nextValue.title,
      date: nextValue.date,
      startTime: nextValue.startTime,
      endTime: nextValue.endTime,
      location: nextValue.location,
      category: nextValue.category,
      selectedMembers: [...nextValue.selectedMembers],
    });
  }

  private syncBodyScroll(): void {
    if (this.open) {
      this.previousBodyOverflow = this.document.body.style.overflow;
      this.document.body.style.overflow = 'hidden';
      return;
    }

    this.restoreBodyScroll();
  }

  private restoreBodyScroll(): void {
    this.document.body.style.overflow = this.previousBodyOverflow;
  }

  private buildTeam(selectedMembers: string[]): TeamMember[] {
    const team = [...this.baseMembers];
    const seen = new Set(this.baseMembers.map((member) => member.name));

    for (const name of selectedMembers.map((member) => member.trim()).filter(Boolean)) {
      if (seen.has(name)) {
        continue;
      }

      seen.add(name);
      team.push(this.createTeamMember(name));
    }

    return team;
  }

  private ensureTeamMember(name: string): void {
    if (!this.team.some((member) => member.name === name)) {
      this.team = [...this.team, this.createTeamMember(name)];
    }
  }

  private createTeamMember(name: string): TeamMember {
    return {
      name,
      initials: this.getInitials(name),
      tone: this.getTone(name),
    };
  }

  private getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }

    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  }

  private getTone(name: string): TeamMember['tone'] {
    const tones: TeamMember['tone'][] = ['peach', 'mint', 'slate'];
    const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return tones[hash % tones.length];
  }

  private valueFromSlot(slot: CalendarSlot | null): EventModalValue | null {
    if (!slot) {
      return null;
    }

    const startTime = this.to24Hour(slot.timeLabel);

    return {
      title: '',
      date: slot.dateLabel,
      startTime,
      endTime: this.plusOneHour(startTime),
      location: '',
      category: 'Personal',
      selectedTags: [...this.tagOptions],
      selectedMembers: [],
    };
  }

  private to24Hour(label: string): string {
    const match = label.match(/(\d+)\s*(am|pm)/i);
    if (!match) {
      return '06:00';
    }

    let hours = parseInt(match[1], 10);
    const isPm = match[2].toLowerCase() === 'pm';

    if (isPm && hours !== 12) {
      hours += 12;
    } else if (!isPm && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:00`;
  }

  private plusOneHour(time: string): string {
    const [hours, minutes] = time.split(':');
    const nextHour = (parseInt(hours, 10) + 1) % 24;
    return `${nextHour.toString().padStart(2, '0')}:${minutes}`;
  }
}
