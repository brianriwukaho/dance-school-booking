import { z } from 'zod';
import {
  ArgumentInvalidException,
  ConflictException,
  NotFoundException,
} from '@repo/ddd';

/**
 * Thrown when the booking request body fails Zod validation
 */
export class InvalidBookingRequestException extends ArgumentInvalidException {
  constructor(public readonly zodError: z.ZodError) {
    super(`Invalid booking request: ${zodError.message}`);
  }
}

/**
 * Thrown when the search filters fail Zod validation
 */
export class InvalidSearchFiltersException extends ArgumentInvalidException {
  constructor(public readonly zodError: z.ZodError) {
    super(`Invalid search filters: ${zodError.message}`);
  }
}

/**
 * Thrown when attempting to book a class that has no spots remaining
 */
export class ClassFullyBookedException extends ConflictException {
  constructor(
    public readonly classId: string,
    public readonly maxSpots: number
  ) {
    super(
      `Class ${classId} is fully booked (${maxSpots}/${maxSpots} spots taken)`
    );
  }
}

/**
 * Thrown when an email already has a booking for the same class
 */
export class DuplicateBookingException extends ConflictException {
  constructor(
    public readonly email: string,
    public readonly classId: string
  ) {
    super(`Email ${email} already has a booking for class ${classId}`);
  }
}

/**
 * Thrown when a class with the specified ID is not found
 */
export class ClassNotFoundException extends NotFoundException {
  constructor(public readonly classId: string) {
    super(`Class with ID ${classId} not found`);
  }
}
