import { Entity, CreateEntityProps } from '@repo/ddd';
import { Email } from '../value-objects/email.value-object.js';

export interface BookingProps {
  email: Email;
  classId: string;
}

export interface CreateBookingProps extends CreateEntityProps<BookingProps> {}

export class Booking extends Entity<BookingProps> {
  private constructor(props: CreateBookingProps) {
    super(props);
  }

  static create(props: CreateBookingProps): Booking {
    return new Booking(props);
  }

  get email(): Email {
    return this.props.email;
  }

  get classId(): string {
    return this.props.classId;
  }

  validate(): void {
    // Email is validated in the value object
    // No additional validation needed here
  }
}
