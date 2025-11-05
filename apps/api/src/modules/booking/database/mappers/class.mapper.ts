import { Class } from "../../domain/aggregates/class.aggregate.js";
import { Booking } from "../../domain/value-objects/booking.value-object.js";
import { ClassId } from "../../domain/value-objects/class-id.value-object.js";
import {
  ClassType,
  ClassTypeValue,
} from "../../domain/value-objects/class-type.value-object.js";
import { DateTime } from "../../domain/value-objects/date-time.value-object.js";
import { Email } from "../../domain/value-objects/email.value-object.js";

/**
 * Metadata item in DynamoDB
 */
export interface ClassMetadataItem {
  PK: string; // CLASS#2024-12-09#MON#1830 (this IS the classId)
  SK: string; // METADATA
  GSI1PK: string; // TYPE#SALSA#1
  GSI1SK: string; // 2024-12-09#MON#1830
  type: ClassTypeValue;
  level?: number;
  date: string;
  dayOfWeek: string;
  startTime: string;
  maxSpots: number;
  bookingCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Booking item in DynamoDB
 */
export interface BookingItem {
  PK: string; // CLASS#2024-12-09#MON#1830
  SK: string; // email (e.g., john@example.com)
  bookedAt: string;
}

/**
 * Wrapper to carry domain object alongside persistence metadata.
 *
 * Version is a persistence concern, not a domain concern, so we keep it
 * separate from the aggregate using this wrapper pattern.
 *
 * Flow:
 * 1. Repository loads from DB → returns ClassWithVersion {aggregate, version: N}
 * 2. Service modifies aggregate → classWithVersion.aggregate.book(email)
 * 3. Repository saves to DB → uses version N for optimistic locking
 *
 * This keeps version in request scope (no cache needed) and prevents it from
 * polluting the domain model. Version travels with the aggregate through the
 * request lifecycle, then gets garbage collected when the request ends.
 */
export interface ClassWithVersion {
  aggregate: Class;
  version: number;
}

function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[date.getDay()]!;
}

export function buildTypePK(type: string, level?: number): string {
  const typeUpper = type.toUpperCase();
  return level !== undefined
    ? `TYPE#${typeUpper}#${level}`
    : `TYPE#${typeUpper}`;
}

function buildTypeSK(date: string, startTime: string): string {
  const dayOfWeek = getDayOfWeek(date);
  const time = startTime.replace(":", "");
  return `${date}#${dayOfWeek}#${time}`;
}

/**
 * Anti-Corruption Layer between domain model and DynamoDB persistence.
 *
 * Keeps the Class aggregate free from database concerns (keys, versions, etc.)
 * and allows independent evolution of domain and storage models.
 */
export class ClassMapper {
  /**
   * Map from persistence to domain.
   * Takes the metadata item and booking items, returns domain aggregate with version.
   *
   * Note: bookingItems can be empty for search queries (performance optimization).
   * In that case, the accurate bookingCount from metadata is used for calculations.
   */
  static toDomain(
    metadataItem: ClassMetadataItem,
    bookingItems: BookingItem[]
  ): ClassWithVersion {
    const classType = new ClassType(metadataItem.type, metadataItem.level);
    const dateTime = new DateTime(metadataItem.date, metadataItem.startTime);
    const classId = ClassId.fromString(metadataItem.PK);

    const bookings = bookingItems.map((item) =>
      Booking.create(new Email(item.SK), new Date(item.bookedAt))
    );

    if (
      bookingItems.length > 0 &&
      bookingItems.length !== metadataItem.bookingCount
    ) {
      throw new Error(
        `Booking count mismatch for ${metadataItem.PK}: metadata says ${metadataItem.bookingCount} but got ${bookingItems.length} booking items`
      );
    }

    const aggregate = Class.create({
      id: classId,
      props: {
        classType,
        dateTime,
        maxSpots: metadataItem.maxSpots,
        bookings,
        bookingCount: metadataItem.bookingCount,
      },
      createdAt: new Date(metadataItem.createdAt),
      updatedAt: new Date(metadataItem.updatedAt),
    });

    return {
      aggregate,
      version: metadataItem.version || 0,
    };
  }

  /**
   * Map from domain to persistence items.
   * Returns metadata item and booking items.
   */
  static toPersistence(
    classWithVersion: ClassWithVersion
  ): {
    metadata: ClassMetadataItem;
    bookings: BookingItem[];
  } {
    const props = classWithVersion.aggregate.getProps();
    const pk = props.id.toString();
    const date = props.dateTime.date;
    const startTime = props.dateTime.startTime;
    const dayOfWeek = getDayOfWeek(date);

    const gsi1pk = buildTypePK(props.classType.type, props.classType.level);
    const gsi1sk = buildTypeSK(date, startTime);

    const metadata: ClassMetadataItem = {
      PK: pk,
      SK: "METADATA",
      GSI1PK: gsi1pk,
      GSI1SK: gsi1sk,
      type: props.classType.type,
      level: props.classType.level,
      date,
      dayOfWeek,
      startTime,
      maxSpots: props.maxSpots,
      bookingCount: props.bookings.length,
      version: classWithVersion.version,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };

    const bookings: BookingItem[] = props.bookings.map((booking) => {
      return {
        PK: pk,
        SK: booking.email.value,
        bookedAt: booking.bookedAt.toISOString(),
      };
    });

    return { metadata, bookings };
  }
}
