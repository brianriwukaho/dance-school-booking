import {
  AggregateRoot,
  CreateEntityProps,
  ArgumentInvalidException,
} from "@repo/ddd";
import { ClassId } from "../value-objects/class-id.value-object.js";
import { ClassType } from "../value-objects/class-type.value-object.js";
import { DateTime } from "../value-objects/date-time.value-object.js";
import { Email } from "../value-objects/email.value-object.js";
import { Booking } from "../value-objects/booking.value-object.js";
import {
  ClassFullyBookedException,
  DuplicateBookingException,
} from "../../exceptions/booking.exceptions.js";

export interface ClassProps {
  classType: ClassType;
  dateTime: DateTime;
  maxSpots: number;
  bookings: Booking[];
  bookingCount: number;
}

export interface CreateClassProps extends CreateEntityProps<ClassProps, ClassId> {}

export class Class extends AggregateRoot<ClassProps, ClassId> {
  private constructor(props: CreateClassProps) {
    super(props);
  }

  static create(props: CreateClassProps): Class {
    return new Class(props);
  }

  get spotsRemaining(): number {
    return this.props.maxSpots - this.props.bookingCount;
  }

  /**
   * Book a spot in this class for the given email.
   * Enforces business rules:
   * - Class must have spots available
   * - Email cannot already be booked
   */
  public book(email: Email): Booking {
    if (this.spotsRemaining <= 0) {
      throw new ClassFullyBookedException(this.id.toString(), this.props.maxSpots);
    }

    const existingBooking = this.props.bookings.find((b) =>
      b.email.equals(email)
    );

    if (existingBooking) {
      throw new DuplicateBookingException(email.value, this.id.toString());
    }

    const booking = Booking.create(email);

    this.props.bookings.push(booking);
    this.props.bookingCount += 1;

    return booking;
  }

  validate(): void {
    if (this.props.maxSpots <= 0) {
      throw new ArgumentInvalidException("Max spots must be greater than 0");
    }

    if (this.props.bookingCount > this.props.maxSpots) {
      throw new ArgumentInvalidException("Bookings exceed max spots");
    }

    // Ensure bookingCount matches actual bookings array when bookings are loaded
    if (this.props.bookings.length > 0 && this.props.bookings.length !== this.props.bookingCount) {
      throw new ArgumentInvalidException(
        `Booking count mismatch: bookingCount is ${this.props.bookingCount} but bookings array has ${this.props.bookings.length} items`
      );
    }
  }
}
