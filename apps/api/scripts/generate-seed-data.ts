import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

interface ClassSchedule {
  day: DayOfWeek;
  time: string;
  type: 'salsa' | 'bachata' | 'reggaeton';
  level?: number;
}

const weeklySchedule: ClassSchedule[] = [
  // Monday
  { day: 'monday', time: '18:30', type: 'bachata', level: 1 },
  { day: 'monday', time: '19:30', type: 'bachata', level: 2 },
  { day: 'monday', time: '20:30', type: 'salsa', level: 3 },
  // Tuesday
  { day: 'tuesday', time: '18:30', type: 'salsa', level: 1 },
  { day: 'tuesday', time: '19:30', type: 'salsa', level: 2 },
  { day: 'tuesday', time: '20:30', type: 'reggaeton' },
  // Wednesday
  { day: 'wednesday', time: '18:30', type: 'bachata', level: 1 },
  { day: 'wednesday', time: '19:30', type: 'bachata', level: 2 },
  { day: 'wednesday', time: '20:30', type: 'salsa', level: 3 },
  // Thursday
  { day: 'thursday', time: '18:30', type: 'salsa', level: 1 },
  { day: 'thursday', time: '19:30', type: 'salsa', level: 2 },
  // Friday
  { day: 'friday', time: '18:30', type: 'reggaeton' },
  { day: 'friday', time: '19:30', type: 'salsa', level: 3 },
];

const dayToNumber: Record<DayOfWeek, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
};

function getNextDate(dayOfWeek: DayOfWeek, weeksFromNow: number): Date {
  const today = new Date();
  const todayDay = today.getDay();
  const targetDay = dayToNumber[dayOfWeek];
  const daysUntilTarget = (targetDay - todayDay + 7) % 7;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget + weeksFromNow * 7);
  return targetDate;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

function getDayOfWeekAbbr(date: Date): string {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[date.getDay()];
}

function buildPK(date: string, dayOfWeek: string, time: string): string {
  const timeFormatted = time.replace(':', '');
  return `CLASS#${date}#${dayOfWeek}#${timeFormatted}`;
}

function buildGSI1PK(type: string, level?: number): string {
  const typeUpper = type.toUpperCase();
  return level !== undefined ? `TYPE#${typeUpper}#${level}` : `TYPE#${typeUpper}`;
}

function buildGSI1SK(date: string, dayOfWeek: string, time: string): string {
  const timeFormatted = time.replace(':', '');
  return `${date}#${dayOfWeek}#${timeFormatted}`;
}

// Helper to generate realistic email addresses
function generateEmail(index: number): string {
  const names = [
    'alice', 'bob', 'carol', 'david', 'eve', 'frank', 'grace', 'henry',
    'iris', 'jack', 'kate', 'leo', 'maria', 'noah', 'olivia', 'peter',
    'quinn', 'rose', 'sam', 'tina', 'uma', 'victor', 'wendy', 'xander',
    'yara', 'zoe', 'alex', 'blake', 'casey', 'drew'
  ];
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'email.com'];
  const name = names[index % names.length];
  const domain = domains[Math.floor(index / names.length) % domains.length];
  const suffix = Math.floor(index / (names.length * domains.length));
  return suffix > 0 ? `${name}${suffix}@${domain}` : `${name}@${domain}`;
}

// Determine number of bookings for a class (varied distribution)
function getBookingCount(classIndex: number, totalClasses: number): number {
  // Make some classes full (20), some nearly full (18-19), some half full
  const mod = classIndex % 5;
  if (mod === 0) return 20; // 20% of classes are full
  if (mod === 1) return 19; // 20% have 19
  if (mod === 2) return 18; // 20% have 18
  if (mod === 3) return Math.floor(Math.random() * 5) + 10; // 20% have 10-14
  return Math.floor(Math.random() * 8) + 5; // 20% have 5-12
}

// Generate classes and bookings for the next 4 weeks
const items: any[] = [];
let emailIndex = 0;

for (let week = 0; week < 4; week++) {
  for (let i = 0; i < weeklySchedule.length; i++) {
    const schedule = weeklySchedule[i];
    const date = getNextDate(schedule.day, week);
    const dateStr = formatDate(date);
    const dayOfWeek = getDayOfWeekAbbr(date);

    const pk = buildPK(dateStr, dayOfWeek, schedule.time);
    const gsi1pk = buildGSI1PK(schedule.type, schedule.level);
    const gsi1sk = buildGSI1SK(dateStr, dayOfWeek, schedule.time);

    const bookingCount = getBookingCount(week * weeklySchedule.length + i, 4 * weeklySchedule.length);

    // Generate metadata item
    items.push({
      PK: pk,
      SK: 'METADATA',
      GSI1PK: gsi1pk,
      GSI1SK: gsi1sk,
      type: schedule.type,
      level: schedule.level,
      date: dateStr,
      dayOfWeek,
      startTime: schedule.time,
      maxSpots: 20,
      bookingCount,
      version: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Generate booking items
    for (let b = 0; b < bookingCount; b++) {
      const email = generateEmail(emailIndex++);
      items.push({
        PK: pk,
        SK: email,
        bookedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random time in last week
      });
    }
  }
}

// Sort items by PK then SK for better readability
items.sort((a, b) => {
  const pkCompare = a.PK.localeCompare(b.PK);
  if (pkCompare !== 0) return pkCompare;
  return a.SK.localeCompare(b.SK);
});

// Write to file (use absolute path relative to script location)
const outputPath = join(__dirname, '..', 'seed-data', 'classes.json');
writeFileSync(
  outputPath,
  JSON.stringify(items, null, 2),
  'utf-8'
);

const metadataCount = items.filter(item => item.SK === 'METADATA').length;
const bookingCount = items.filter(item => item.SK !== 'METADATA').length;

console.log(`Generated ${items.length} total items for the next 4 weeks:`);
console.log(`  - ${metadataCount} class metadata items`);
console.log(`  - ${bookingCount} booking items`);
console.log('Each item uses PK/SK pattern with GSI1 (type) for lookups');
console.log('PK is the natural key: CLASS#YYYY-MM-DD#DAY#TIME');
console.log('Some classes are full (20), some nearly full (18-19), others varied (5-14)');
