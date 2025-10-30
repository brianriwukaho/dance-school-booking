import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { docClient, TABLES } from '../database/dynamodb.client.js';
import { IClassRepository } from './class.repository.interface.js';
import { Class } from '../../domain/aggregates/class.aggregate.js';
import { ClassMapper } from '../mappers/class.mapper.js';
import { ConflictException } from '@repo/ddd';
import { ClassTypeValue } from '../../domain/value-objects/class-type.value-object.js';

export class ClassRepository implements IClassRepository {
  async findById(classId: string): Promise<Class | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLES.CLASSES,
        Key: { classId },
      })
    );

    if (!result.Item) {
      return null;
    }

    // Fetch bookings for this class
    const bookingsResult = await docClient.send(
      new QueryCommand({
        TableName: TABLES.BOOKINGS,
        IndexName: 'ClassIndex',
        KeyConditionExpression: 'classId = :classId',
        ExpressionAttributeValues: {
          ':classId': classId,
        },
      })
    );

    return ClassMapper.toDomain(result.Item, bookingsResult.Items || []);
  }

  async findByType(type: ClassTypeValue | 'any'): Promise<Class[]> {
    let classItems: any[] = [];

    if (type === 'any') {
      // Scan for all classes (for MVP - in production, consider a different approach)
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLES.CLASSES,
          IndexName: 'TypeDateTimeIndex',
          KeyConditionExpression: '#type = :type',
          ExpressionAttributeNames: {
            '#type': 'type',
          },
          ExpressionAttributeValues: {
            ':type': 'salsa',
          },
        })
      );
      classItems.push(...(result.Items || []));

      const bachataResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.CLASSES,
          IndexName: 'TypeDateTimeIndex',
          KeyConditionExpression: '#type = :type',
          ExpressionAttributeNames: {
            '#type': 'type',
          },
          ExpressionAttributeValues: {
            ':type': 'bachata',
          },
        })
      );
      classItems.push(...(bachataResult.Items || []));

      const reggaetonResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.CLASSES,
          IndexName: 'TypeDateTimeIndex',
          KeyConditionExpression: '#type = :type',
          ExpressionAttributeNames: {
            '#type': 'type',
          },
          ExpressionAttributeValues: {
            ':type': 'reggaeton',
          },
        })
      );
      classItems.push(...(reggaetonResult.Items || []));
    } else {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLES.CLASSES,
          IndexName: 'TypeDateTimeIndex',
          KeyConditionExpression: '#type = :type',
          ExpressionAttributeNames: {
            '#type': 'type',
          },
          ExpressionAttributeValues: {
            ':type': type,
          },
        })
      );
      classItems = result.Items || [];
    }

    // Fetch bookings for all classes in parallel
    const bookingsByClass = await this.fetchBookingsForClasses(
      classItems.map((item) => item.classId)
    );

    return classItems.map((item) =>
      ClassMapper.toDomain(item, bookingsByClass[item.classId] || [])
    );
  }

  async save(classAggregate: Class): Promise<void> {
    const persistence = ClassMapper.toPersistence(classAggregate);

    try {
      // Use optimistic locking with conditional write
      await docClient.send(
        new UpdateCommand({
          TableName: TABLES.CLASSES,
          Key: { classId: persistence.class.classId },
          UpdateExpression: 'SET #version = :newVersion, bookingCount = :bookingCount',
          ConditionExpression: '#version = :expectedVersion',
          ExpressionAttributeNames: {
            '#version': 'version',
          },
          ExpressionAttributeValues: {
            ':expectedVersion': classAggregate.version,
            ':newVersion': classAggregate.version + 1,
            ':bookingCount': persistence.class.bookingCount,
          },
        })
      );

      // Save new bookings
      for (const booking of persistence.newBookings) {
        await docClient.send(
          new PutCommand({
            TableName: TABLES.BOOKINGS,
            Item: booking,
            ConditionExpression: 'attribute_not_exists(bookingId)',
          })
        );
      }

      // Increment version on the aggregate after successful save
      classAggregate.incrementVersion();
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw new ConflictException(
          'Class was modified by another request. Please retry.'
        );
      }
      throw error;
    }
  }

  private async fetchBookingsForClasses(
    classIds: string[]
  ): Promise<Record<string, any[]>> {
    const bookingsByClass: Record<string, any[]> = {};

    // Initialize all classIds
    classIds.forEach((id) => {
      bookingsByClass[id] = [];
    });

    // Fetch bookings for each class
    await Promise.all(
      classIds.map(async (classId) => {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLES.BOOKINGS,
            IndexName: 'ClassIndex',
            KeyConditionExpression: 'classId = :classId',
            ExpressionAttributeValues: {
              ':classId': classId,
            },
          })
        );
        bookingsByClass[classId] = result.Items || [];
      })
    );

    return bookingsByClass;
  }
}
