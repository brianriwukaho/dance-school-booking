import { Class } from '../../domain/aggregates/class.aggregate.js';
import { Booking } from '../../domain/entities/booking.entity.js';
import { ClassType } from '../../domain/value-objects/class-type.value-object.js';
import { DateTime } from '../../domain/value-objects/date-time.value-object.js';
import { Email } from '../../domain/value-objects/email.value-object.js';

interface ClassPersistence {
  classId: string;
  type: string;
  level?: number;
  date: string;
  startTime: string;
  dateTime: string;
  maxSpots: number;
  bookingCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface BookingPersistence {
  bookingId: string;
  classId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export class ClassMapper {
  static toDomain(classData: any, bookingsData: any[]): Class {
    const classType = new ClassType(classData.type, classData.level);
    const dateTime = new DateTime(classData.date, classData.startTime);

    const bookings = bookingsData.map((bookingData) =>
      Booking.create({
        id: bookingData.bookingId,
        props: {
          email: new Email(bookingData.email),
          classId: classData.classId,
        },
        createdAt: new Date(bookingData.createdAt),
        updatedAt: new Date(bookingData.updatedAt),
      })
    );

    return Class.create({
      id: classData.classId,
      props: {
        classType,
        dateTime,
        maxSpots: classData.maxSpots,
        bookings,
        version: classData.version || 0,
      },
      version: classData.version || 0,
      createdAt: new Date(classData.createdAt),
      updatedAt: new Date(classData.updatedAt),
    });
  }

  static toPersistence(classAggregate: Class): {
    class: ClassPersistence;
    newBookings: BookingPersistence[];
  } {
    const props = classAggregate.getProps();
    const classId = typeof props.id === 'string' ? props.id : String(props.id);

    // Determine which bookings are new (created in this session)
    // For simplicity in MVP, we'll save all bookings
    const newBookings: BookingPersistence[] = classAggregate.bookings.map(
      (booking) => {
        const bookingProps = booking.getProps();
        const bookingId =
          typeof bookingProps.id === 'string'
            ? bookingProps.id
            : String(bookingProps.id);

        return {
          bookingId,
          classId,
          email: booking.email.value,
          createdAt: bookingProps.createdAt.toISOString(),
          updatedAt: bookingProps.updatedAt.toISOString(),
        };
      }
    );

    return {
      class: {
        classId,
        type: classAggregate.classType.type,
        level: classAggregate.classType.level,
        date: classAggregate.dateTime.date,
        startTime: classAggregate.dateTime.startTime,
        dateTime: classAggregate.dateTime.toISODateTime(),
        maxSpots: classAggregate.maxSpots,
        bookingCount: classAggregate.bookings.length,
        version: props.version,
        createdAt: props.createdAt.toISOString(),
        updatedAt: props.updatedAt.toISOString(),
      },
      newBookings,
    };
  }
}
