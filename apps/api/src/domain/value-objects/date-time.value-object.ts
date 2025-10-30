import { ValueObject, ArgumentInvalidException } from '@repo/ddd';

interface DateTimeProps {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
}

export class DateTime extends ValueObject<DateTimeProps> {
  constructor(date: string, startTime: string) {
    super({ date, startTime });
  }

  protected validate(props: DateTimeProps): void {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(props.date)) {
      throw new ArgumentInvalidException('Date must be in YYYY-MM-DD format');
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(props.startTime)) {
      throw new ArgumentInvalidException('Time must be in HH:mm format (00:00-23:59)');
    }

    // Validate that the date is actually valid
    const dateObj = new Date(props.date);
    if (isNaN(dateObj.getTime())) {
      throw new ArgumentInvalidException('Invalid date');
    }
  }

  get date(): string {
    return this.unpack().date;
  }

  get startTime(): string {
    return this.unpack().startTime;
  }

  /**
   * Returns a combined ISO datetime string for sorting/comparison
   */
  public toISODateTime(): string {
    return `${this.date}T${this.startTime}:00`;
  }
}
