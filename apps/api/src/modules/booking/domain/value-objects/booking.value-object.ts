import { ValueObject } from '@repo/ddd';
import { Email } from './email.value-object.js';

interface BookingProps {
  email: Email;
  bookedAt: Date;
}

/**
 * Booking Value Object
 *
 * A booking represents a spot reserved by an email in a class.
 * Identity is derived from (classId, email) - a booking doesn't have
 * its own independent identity.
 */
export class Booking extends ValueObject<BookingProps> {
  private constructor(props: BookingProps) {
    super(props);
  }

  static create(email: Email, bookedAt: Date = new Date()): Booking {
    return new Booking({ email, bookedAt });
  }

  get email(): Email {
    return this.props.email;
  }

  get bookedAt(): Date {
    return this.props.bookedAt;
  }

  protected validate(props: BookingProps): void {}
}
