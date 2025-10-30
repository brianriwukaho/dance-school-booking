import { writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

interface ClassSchedule {
  day: number; // 0 = Sunday, 1 = Monday, etc.
  time: string;
  type: 'salsa' | 'bachata' | 'reggaeton';
  level?: number;
}

const weeklySchedule: ClassSchedule[] = [
  // Monday
  { day: 1, time: '18:30', type: 'bachata', level: 1 },
  { day: 1, time: '19:30', type: 'bachata', level: 2 },
  { day: 1, time: '20:30', type: 'salsa', level: 3 },
  // Tuesday
  { day: 2, time: '18:30', type: 'salsa', level: 1 },
  { day: 2, time: '19:30', type: 'salsa', level: 2 },
  { day: 2, time: '20:30', type: 'reggaeton' },
  // Wednesday
  { day: 3, time: '18:30', type: 'bachata', level: 1 },
  { day: 3, time: '19:30', type: 'bachata', level: 2 },
  { day: 3, time: '20:30', type: 'salsa', level: 3 },
  // Thursday
  { day: 4, time: '18:30', type: 'salsa', level: 1 },
  { day: 4, time: '19:30', type: 'salsa', level: 2 },
  // Friday
  { day: 5, time: '18:30', type: 'reggaeton' },
  { day: 5, time: '19:30', type: 'salsa', level: 3 },
];

function getNextDate(dayOfWeek: number, weeksFromNow: number): Date {
  const today = new Date();
  const todayDay = today.getDay();
  const daysUntilTarget = (dayOfWeek - todayDay + 7) % 7;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget + weeksFromNow * 7);
  return targetDate;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

// Generate classes for the next 4 weeks
const classes: any[] = [];

for (let week = 0; week < 4; week++) {
  for (const schedule of weeklySchedule) {
    const date = getNextDate(schedule.day, week);
    const dateStr = formatDate(date);
    const classId = randomUUID();

    classes.push({
      classId,
      type: schedule.type,
      level: schedule.level,
      date: dateStr,
      startTime: schedule.time,
      dateTime: `${dateStr}T${schedule.time}:00`,
      maxSpots: 20,
      bookingCount: 0,
      version: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

// Sort by datetime
classes.sort((a, b) => a.dateTime.localeCompare(b.dateTime));

// Write to file
writeFileSync(
  './seed-data/classes.json',
  JSON.stringify(classes, null, 2),
  'utf-8'
);

console.log(`Generated ${classes.length} classes for the next 4 weeks`);
