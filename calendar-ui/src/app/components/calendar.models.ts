export type CalendarTheme = 'purple' | 'green' | 'blue' | 'yellow' | 'pink' | 'violet';

export type CalendarSlot = {
  dayIndex: number;
  timeIndex: number;
  dayLabel: string;
  timeLabel: string;
  dateLabel: string;
  gridColumn: string;
  gridRow: string;
  eventGridRow: string;
};

export type CalendarEvent = {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: 'Personal' | 'Work' | 'Health';
  selectedTags: string[];
  selectedMembers: string[];
  theme: CalendarTheme;
  gridColumn: string;
  gridRow: string;
};
