/** Day labels as shown in the weekly availability editor (section headers and Day combobox). */
export enum WeeklyDayAbbrev {
  Sunday = 'Sun',
  Monday = 'Mon',
  Tuesday = 'Tue',
  Wednesday = 'Wed',
  Thursday = 'Thu',
  Friday = 'Fri',
  Saturday = 'Sat',
}

/** Section order under Weekly availability (Sun → Sat). */
export const WEEKLY_DAY_SECTION_ORDER: readonly WeeklyDayAbbrev[] = [
  WeeklyDayAbbrev.Sunday,
  WeeklyDayAbbrev.Monday,
  WeeklyDayAbbrev.Tuesday,
  WeeklyDayAbbrev.Wednesday,
  WeeklyDayAbbrev.Thursday,
  WeeklyDayAbbrev.Friday,
  WeeklyDayAbbrev.Saturday,
];

/** Weekend afternoons preset window (Confluence BTQA 3.5). */
export const WeekendAfternoonWindow = {
  start: '13:00',
  end: '17:00',
} as const;

export const AvailabilityCopy = {
  banner: 'Availability',
  weeklyHeading: 'Set your weekly free time',
  oneOffChanges: 'One-off changes',
  weekendAfternoons: 'Weekend afternoons',
  saveAvailability: 'Save availabilities',
  addException: 'Add exception',
  noSlots: 'No slots',
  invalidWeeklyTimes: 'Start time must be before end time',
} as const;
