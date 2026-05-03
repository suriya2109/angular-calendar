export type CalendarTheme = 'purple' | 'green' | 'blue' | 'yellow' | 'pink' | 'violet';
export type CalendarCategory = 'Personal' | 'Work' | 'Health';

export type CalendarSlot = {
  dayIndex: number;
  timeIndex: number;
  dayLabel: string;
  timeLabel: string;
  dateKey: string;
  dateLabel: string;
  gridColumn: string;
  gridRow: string;
  eventGridRow: string;
};

export type CalendarEvent = {
  id: number;
  title: string;
  dateKey: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: CalendarCategory;
  selectedTags: string[];
  selectedMembers: string[];
  theme: CalendarTheme;
  gridColumn: string;
  gridRow: string;
};
