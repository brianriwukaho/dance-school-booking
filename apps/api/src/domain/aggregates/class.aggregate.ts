import {
  AggregateRoot,
  CreateAggregateRootProps,
  AggregateRootProps,
  ConflictException,
  ArgumentInvalidException,
} from '@repo/ddd';
import { ClassType } from '../value-objects/class-type.value-object.js';
import { DateTime } from '../value-objects/date-time.value-object.js';
import { Email } from '../value-objects/email.value-object.js';
import { Booking } from '../entities/booking.entity.js';

export interface ClassProps extends AggregateRootProps {
  classType: ClassType;
  dateTime: DateTime;
  maxSpots: number;
  bookings: Booking[];
}

export interface CreateClassProps extends CreateAggregateRootProps<ClassProps> {}

export class Class extends AggregateRoot<ClassProps> {
  private constructor(props: CreateClassProps) {
    super(props);
  }

  static create(props: CreateClassProps): Class {
    return new Class(props);
  }

  get classType(): ClassType {
    return this.props.classType;
  }

  get dateTime(): DateTime {
    return this.props.dateTime;
  }

  get maxSpots(): number {
    return this.props.maxSpots;
  }

  get bookings(): Booking[] {
    return this.props.bookings;
  }

  get spotsRemaining(): number {
    return this.maxSpots - this.bookings.length;
  }

  /**
   * Book a spot in this class for the given email.
   * Enforces business rules:
   * - Class must have spots available
   * - Email cannot already be booked
   */
  public book(email: Email, bookingId: string): Booking {
    // Check if spots are available
    if (this.spotsRemaining <= 0) {
      throw new ConflictException('Class is fully booked');
    }

    // Check if email already has a booking
    const existingBooking = this.bookings.find((b) =>
      b.email.equals(email)
    );
    if (existingBooking) {
      throw new ConflictException('Email already has a booking for this class');
    }

    // Create the booking
    const booking = Booking.create({
      id: bookingId,
      props: {
        email,
        classId: this.getIdValue(),
      },
    });

    // Add to bookings list
    this.props.bookings.push(booking);

    return booking;
  }

  /**
   * Helper to get the ID as a string value
   */
  private getIdValue(): string {
    const id = this.id;
    if (typeof id === 'object' && 'value' in id) {
      return id.value;
    }
    return String(id);
  }

  validate(): void {
    if (this.maxSpots <= 0) {
      throw new ArgumentInvalidException('Max spots must be greater than 0');
    }

    if (this.bookings.length > this.maxSpots) {
      throw new ArgumentInvalidException('Bookings exceed max spots');
    }
  }
}
