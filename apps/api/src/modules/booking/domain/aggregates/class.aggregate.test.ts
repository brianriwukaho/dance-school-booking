import { describe, it, expect } from 'vitest';
import { Class } from './class.aggregate.js';
import { ClassType } from '../value-objects/class-type.value-object.js';
import { DateTime } from '../value-objects/date-time.value-object.js';
import { Email } from '../value-objects/email.value-object.js';
import { ClassId, DayOfWeek, ClassTime } from '../value-objects/class-id.value-object.js';
import { ArgumentInvalidException } from '@repo/ddd';
import {
  ClassFullyBookedException,
  DuplicateBookingException,
} from '../../exceptions/booking.exceptions.js';

describe('Class Aggregate', () => {
  const createTestClass = (maxSpots: number = 20) => {
    return Class.create({
      id: ClassId.create('2025-11-10', DayOfWeek.MON, ClassTime.TIME_1830),
      props: {
        classType: new ClassType('salsa', 2),
        dateTime: new DateTime('2025-11-10', '18:30'),
        maxSpots,
        bookings: [],
        bookingCount: 0,
      },
    });
  };

  describe('spotsRemaining', () => {
    it('should return maxSpots when no bookings exist', () => {
      const classAggregate = createTestClass(20);

      expect(classAggregate.spotsRemaining).toBe(20);
    });

    it('should calculate remaining spots correctly', () => {
      const classAggregate = createTestClass(20);
      const email1 = new Email('user1@example.com');
      const email2 = new Email('user2@example.com');

      classAggregate.book(email1);
      classAggregate.book(email2);

      expect(classAggregate.spotsRemaining).toBe(18);
    });

    it('should return 0 when class is fully booked', () => {
      const classAggregate = createTestClass(2);
      const email1 = new Email('user1@example.com');
      const email2 = new Email('user2@example.com');

      classAggregate.book(email1);
      classAggregate.book(email2);

      expect(classAggregate.spotsRemaining).toBe(0);
    });
  });

  describe('book', () => {
    it('should successfully book a spot when available', () => {
      const classAggregate = createTestClass();
      const email = new Email('user@example.com');

      const booking = classAggregate.book(email);

      expect(booking).toBeDefined();
      expect(classAggregate.getProps().bookings).toHaveLength(1);
      expect(classAggregate.spotsRemaining).toBe(19);
    });

    it('should throw ClassFullyBookedException when class is full', () => {
      const classAggregate = createTestClass(1);
      const email1 = new Email('user1@example.com');
      const email2 = new Email('user2@example.com');

      classAggregate.book(email1);

      expect(() => {
        classAggregate.book(email2);
      }).toThrow(ClassFullyBookedException);
    });

    it('should throw DuplicateBookingException when email already has a booking', () => {
      const classAggregate = createTestClass();
      const email = new Email('user@example.com');

      classAggregate.book(email);

      expect(() => {
        classAggregate.book(email);
      }).toThrow(DuplicateBookingException);
    });

    it('should allow different emails to book the same class', () => {
      const classAggregate = createTestClass();
      const email1 = new Email('user1@example.com');
      const email2 = new Email('user2@example.com');
      const email3 = new Email('user3@example.com');

      classAggregate.book(email1);
      classAggregate.book(email2);
      classAggregate.book(email3);

      expect(classAggregate.getProps().bookings).toHaveLength(3);
      expect(classAggregate.spotsRemaining).toBe(17);
    });

    it('should prevent overbooking at exactly maxSpots', () => {
      const classAggregate = createTestClass(2);
      const email1 = new Email('user1@example.com');
      const email2 = new Email('user2@example.com');
      const email3 = new Email('user3@example.com');

      classAggregate.book(email1);
      classAggregate.book(email2);

      expect(() => {
        classAggregate.book(email3);
      }).toThrow(ClassFullyBookedException);

      expect(classAggregate.getProps().bookings).toHaveLength(2);
    });
  });

  describe('validate', () => {
    it('should throw ArgumentInvalidException when maxSpots is 0', () => {
      expect(() => {
        const classAggregate = Class.create({
          id: ClassId.create('2025-11-10', DayOfWeek.MON, ClassTime.TIME_1830),
          props: {
            classType: new ClassType('salsa', 2),
            dateTime: new DateTime('2025-11-10', '18:30'),
            maxSpots: 0,
            bookings: [],
            bookingCount: 0,
          },
        });
        classAggregate.validate();
      }).toThrow(ArgumentInvalidException);
    });

    it('should throw ArgumentInvalidException when maxSpots is negative', () => {
      expect(() => {
        const classAggregate = Class.create({
          id: ClassId.create('2025-11-10', DayOfWeek.MON, ClassTime.TIME_1830),
          props: {
            classType: new ClassType('salsa', 2),
            dateTime: new DateTime('2025-11-10', '18:30'),
            maxSpots: -5,
            bookings: [],
            bookingCount: 0,
          },
        });
        classAggregate.validate();
      }).toThrow(ArgumentInvalidException);
    });

    it('should pass validation when maxSpots is valid', () => {
      const classAggregate = createTestClass(20);

      expect(() => {
        classAggregate.validate();
      }).not.toThrow();
    });
  });

  describe('value objects', () => {
    it('should correctly store and retrieve classType', () => {
      const classAggregate = createTestClass();
      const props = classAggregate.getProps();

      expect(props.classType.type).toBe('salsa');
      expect(props.classType.level).toBe(2);
    });

    it('should correctly store and retrieve dateTime', () => {
      const classAggregate = createTestClass();
      const props = classAggregate.getProps();

      expect(props.dateTime.date).toBe('2025-11-10');
      expect(props.dateTime.startTime).toBe('18:30');
    });

    it('should work with reggaeton (no level)', () => {
      const classAggregate = Class.create({
        id: ClassId.create('2025-11-10', DayOfWeek.MON, ClassTime.TIME_1830),
        props: {
          classType: new ClassType('reggaeton'),
          dateTime: new DateTime('2025-11-10', '18:30'),
          maxSpots: 20,
          bookings: [],
          bookingCount: 0,
        },
      });
      const props = classAggregate.getProps();

      expect(props.classType.type).toBe('reggaeton');
      expect(props.classType.level).toBeUndefined();
    });
  });

  describe('concurrency simulation', () => {
    it('should demonstrate the need for optimistic locking', () => {
      const classAggregate = createTestClass(1);
      const email1 = new Email('user1@example.com');
      const email2 = new Email('user2@example.com');

      const booking1 = classAggregate.book(email1);
      expect(booking1).toBeDefined();

      expect(() => {
        classAggregate.book(email2);
      }).toThrow(ClassFullyBookedException);

      // In a real scenario without optimistic locking, if both read the class
      // state before any writes, both would see spotsRemaining=1 and try to book.
      // The repository's optimistic locking prevents this race condition.
    });
  });
});
