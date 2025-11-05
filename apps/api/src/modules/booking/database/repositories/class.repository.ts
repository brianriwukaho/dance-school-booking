import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { Result } from "@badrap/result";
import {
  docClient,
  TABLE_NAME,
  GSI1_NAME,
} from "../../../../database/dynamodb.client.js";
import { IClassRepository } from "./class.repository.interface.js";
import {
  ClassMapper,
  buildTypePK,
  ClassMetadataItem,
  BookingItem,
  ClassWithVersion,
} from "../mappers/class.mapper.js";
import { ConflictException } from "@repo/ddd";
import { ClassTypeValue } from "../../domain/value-objects/class-type.value-object.js";

/**
 * Repository for Class aggregate using single-table design with PK/SK pattern.
 *
 * Table structure:
 * - PK: CLASS#2024-12-09#MON#1830 (this IS the classId)
 * - SK: METADATA (class metadata) or email (bookings)
 * - GSI1: TYPE#SALSA#1 -> date/time (for search by type)
 */
export class ClassRepository implements IClassRepository {
  async findById(classId: string): Promise<ClassWithVersion | null> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": classId,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    const metadata = result.Items.find((item) => item.SK === "METADATA") as
      | ClassMetadataItem
      | undefined;
    const bookings = result.Items.filter(
      (item) => item.SK !== "METADATA"
    ) as BookingItem[];

    if (!metadata) {
      return null;
    }

    return ClassMapper.toDomain(metadata, bookings);
  }

  async findByType(type: ClassTypeValue | "any"): Promise<ClassWithVersion[]> {
    const types: ClassTypeValue[] =
      type === "any" ? ["salsa", "bachata", "reggaeton"] : [type];

    const allClasses: ClassWithVersion[] = [];

    for (const t of types) {
      const gsi1Keys: string[] = [];

      if (t === "salsa") {
        gsi1Keys.push(buildTypePK(t, 1));
        gsi1Keys.push(buildTypePK(t, 2));
        gsi1Keys.push(buildTypePK(t, 3));
      } else if (t === "bachata") {
        gsi1Keys.push(buildTypePK(t, 1));
        gsi1Keys.push(buildTypePK(t, 2));
      } else if (t === "reggaeton") {
        gsi1Keys.push(buildTypePK(t));
      }

      const results = await Promise.all(
        gsi1Keys.map((gsi1pk) =>
          docClient.send(
            new QueryCommand({
              TableName: TABLE_NAME,
              IndexName: GSI1_NAME,
              KeyConditionExpression: "GSI1PK = :gsi1pk",
              ExpressionAttributeValues: {
                ":gsi1pk": gsi1pk,
              },
            })
          )
        )
      );

      for (const result of results) {
        for (const item of result.Items || []) {
          const metadata = item as ClassMetadataItem;
          const classWithVersion = ClassMapper.toDomain(metadata, []);
          allClasses.push(classWithVersion);
        }
      }
    }

    allClasses.sort((a, b) => {
      const aProps = a.aggregate.getProps();
      const bProps = b.aggregate.getProps();
      const aDateTime = aProps.dateTime.toISODateTime();
      const bDateTime = bProps.dateTime.toISODateTime();
      return aDateTime.localeCompare(bDateTime);
    });

    return allClasses;
  }

  /**
   * Save class aggregate with optimistic locking.
   *
   * Uses the version from ClassWithVersion wrapper to implement optimistic locking:
   * - Version N was loaded from DB in findById()
   * - We update with condition: "only if version still equals N"
   * - If another process updated first, condition fails → ConflictException
   *
   * Also inserts new bookings with conditional write to prevent duplicates.
   */
  async save(
    classWithVersion: ClassWithVersion
  ): Promise<Result<void, ConflictException>> {
    const currentVersion = classWithVersion.version;
    const newVersion = currentVersion + 1;

    const { metadata, bookings } = ClassMapper.toPersistence(classWithVersion);

    const existingBookingEmails = new Set<string>();

    try {
      const existingResult = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: {
            ":pk": metadata.PK,
          },
        })
      );

      if (existingResult.Items) {
        for (const item of existingResult.Items) {
          if (item.SK !== "METADATA") {
            existingBookingEmails.add(item.SK);
          }
        }
      }

      const newBookings = bookings.filter(
        (b) => !existingBookingEmails.has(b.SK)
      );

      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: metadata.PK, SK: "METADATA" },
          UpdateExpression:
            "SET #version = :newVersion, bookingCount = :bookingCount, updatedAt = :updatedAt",
          ConditionExpression: "#version = :expectedVersion",
          ExpressionAttributeNames: {
            "#version": "version",
          },
          ExpressionAttributeValues: {
            ":expectedVersion": currentVersion,
            ":newVersion": newVersion,
            ":bookingCount": metadata.bookingCount,
            ":updatedAt": metadata.updatedAt,
          },
        })
      );

      for (const booking of newBookings) {
        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: booking,
            ConditionExpression:
              "attribute_not_exists(PK) AND attribute_not_exists(SK)",
          })
        );
      }

      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return Result.err(
          new ConflictException(
            "Class was modified by another request or booking already exists. Please retry."
          )
        );
      }
      throw error;
    }
  }
}
