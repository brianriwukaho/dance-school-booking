import { ValueObject, ArgumentInvalidException } from '@repo/ddd';

export enum DayOfWeek {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}

export enum ClassTime {
  TIME_1830 = '1830',
  TIME_1930 = '1930',
  TIME_2030 = '2030',
}

interface ClassIdProps {
  date: string;
  dayOfWeek: DayOfWeek;
  time: ClassTime;
}

/**
 * ClassId Value Object
 *
 * Represents a composite natural key for a dance class.
 * Format: CLASS#2024-12-09#MON#1830
 */
export class ClassId extends ValueObject<ClassIdProps> {
  private constructor(props: ClassIdProps) {
    super(props);
  }

  static create(date: string, dayOfWeek: DayOfWeek, time: ClassTime): ClassId {
    return new ClassId({ date, dayOfWeek, time });
  }

  static fromString(classId: string): ClassId {
    const parts = classId.split('#');
    if (parts.length !== 4 || parts[0] !== 'CLASS') {
      throw new ArgumentInvalidException(
        `Invalid classId format: ${classId}. Expected format: CLASS#YYYY-MM-DD#DAY#TIME`
      );
    }

    const dayOfWeek = parts[2] as DayOfWeek;
    const time = parts[3] as ClassTime;

    return new ClassId({
      date: parts[1]!,
      dayOfWeek,
      time,
    });
  }

  override toString(): string {
    const { date, dayOfWeek, time } = this.unpack();
    return `CLASS#${date}#${dayOfWeek}#${time}`;
  }

  protected validate(props: ClassIdProps): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(props.date)) {
      throw new ArgumentInvalidException(
        `Invalid date format: ${props.date}. Expected YYYY-MM-DD`
      );
    }

    if (!Object.values(DayOfWeek).includes(props.dayOfWeek)) {
      throw new ArgumentInvalidException(
        `Invalid day of week: ${props.dayOfWeek}. Must be one of: ${Object.values(DayOfWeek).join(', ')}`
      );
    }

    if (!Object.values(ClassTime).includes(props.time)) {
      throw new ArgumentInvalidException(
        `Invalid time: ${props.time}. Must be one of: ${Object.values(ClassTime).join(', ')}`
      );
    }

    const parsedDate = new Date(props.date);
    if (isNaN(parsedDate.getTime())) {
      throw new ArgumentInvalidException(`Invalid date: ${props.date}`);
    }
  }
}
