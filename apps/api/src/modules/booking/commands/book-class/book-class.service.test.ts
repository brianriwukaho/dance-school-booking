import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Result } from '@badrap/result';
import { BookClassService } from './book-class.service.js';
import { BookClassCommand } from './book-class.command.js';
import { ClassRepository } from '../../database/repositories/class.repository.js';
import { Class } from '../../domain/aggregates/class.aggregate.js';
import { ClassType } from '../../domain/value-objects/class-type.value-object.js';
import { DateTime } from '../../domain/value-objects/date-time.value-object.js';
import { Email } from '../../domain/value-objects/email.value-object.js';
import { ClassId, DayOfWeek, ClassTime } from '../../domain/value-objects/class-id.value-object.js';
import { ConflictException } from '@repo/ddd';
import {
  ClassNotFoundException,
  ClassFullyBookedException,
  DuplicateBookingException,
  InvalidBookingRequestException,
} from '../../exceptions/booking.exceptions.js';
import { ClassWithVersion } from '../../database/mappers/class.mapper.js';

describe('BookClassService', () => {
  let service: BookClassService;
  let mockRepository: ClassRepository;

  const createMockClass = (bookingsCount: number = 0, maxSpots: number = 20): ClassWithVersion => {
    const classAggregate = Class.create({
      id: ClassId.create('2025-11-10', DayOfWeek.MON, ClassTime.TIME_1830),
      props: {
        classType: new ClassType('salsa', 2),
        dateTime: new DateTime('2025-11-10', '18:30'),
        maxSpots,
        bookings: [],
        bookingCount: 0,
      },
    });

    for (let i = 0; i < bookingsCount; i++) {
      const email = new Email(`existing${i}@example.com`);
      classAggregate.book(email);
    }

    return { aggregate: classAggregate, version: 1 };
  };

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByType: vi.fn(),
      save: vi.fn(),
    } as any;

    service = new BookClassService(mockRepository);
  });

  describe('execute', () => {
    it('should successfully book a class when spots are available', async () => {
      const classWithVersion = createMockClass(0, 20);
      vi.spyOn(mockRepository, 'findById').mockResolvedValue(classWithVersion);
      vi.spyOn(mockRepository, 'save').mockResolvedValue(Result.ok(undefined));

      const result = await service.execute('CLASS#2025-11-10#MON#1830', { email: 'user@example.com' });

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toMatchObject({
          classId: 'CLASS#2025-11-10#MON#1830',
          email: 'user@example.com',
        });
        expect(result.value.bookedAt).toBeDefined();
      }
      expect(mockRepository.save).toHaveBeenCalledWith(classWithVersion);
    });

    it('should return error when class does not exist', async () => {
      vi.spyOn(mockRepository, 'findById').mockResolvedValue(null);

      const result = await service.execute('non-existent-class', { email: 'user@example.com' });

      expect(result.isErr).toBe(true);
      if (result.isErr && result.error instanceof ClassNotFoundException) {
        expect(result.error.classId).toBe('non-existent-class');
      }
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should return error when class is full', async () => {
      const classWithVersion = createMockClass(20, 20);
      vi.spyOn(mockRepository, 'findById').mockResolvedValue(classWithVersion);

      const result = await service.execute('550e8400-e29b-41d4-a716-446655440000', { email: 'newuser@example.com' });

      expect(result.isErr).toBe(true);
      if (result.isErr && result.error instanceof ClassFullyBookedException) {
        expect(result.error.classId).toBe('CLASS#2025-11-10#MON#1830');
        expect(result.error.maxSpots).toBe(20);
      }
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should return error when email already has a booking', async () => {
      const classWithVersion = createMockClass(0, 20);
      const existingEmail = new Email('duplicate@example.com');
      classWithVersion.aggregate.book(existingEmail);

      vi.spyOn(mockRepository, 'findById').mockResolvedValue(classWithVersion);

      const result = await service.execute('550e8400-e29b-41d4-a716-446655440000', { email: 'duplicate@example.com' });

      expect(result.isErr).toBe(true);
      if (result.isErr && result.error instanceof DuplicateBookingException) {
        expect(result.error.email).toBe('duplicate@example.com');
        expect(result.error.classId).toBe('CLASS#2025-11-10#MON#1830');
      }
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const classWithVersion = createMockClass(0, 20);
      vi.spyOn(mockRepository, 'findById').mockResolvedValue(classWithVersion);

      const result = await service.execute('550e8400-e29b-41d4-a716-446655440000', { email: 'invalid-email' });

      expect(result.isErr).toBe(true);
      if (result.isErr && result.error instanceof InvalidBookingRequestException) {
        expect(result.error.zodError).toBeDefined();
      }
    });

    it('should handle booking the last available spot', async () => {
      const classWithVersion = createMockClass(19, 20);
      vi.spyOn(mockRepository, 'findById').mockResolvedValue(classWithVersion);
      vi.spyOn(mockRepository, 'save').mockResolvedValue(Result.ok(undefined));

      const result = await service.execute('550e8400-e29b-41d4-a716-446655440000', { email: 'lastuser@example.com' });

      expect(result.isOk).toBe(true);
      expect(classWithVersion.aggregate.spotsRemaining).toBe(0);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should call repository.save with updated aggregate', async () => {
      const classWithVersion = createMockClass(0, 20);
      vi.spyOn(mockRepository, 'findById').mockResolvedValue(classWithVersion);
      const saveSpy = vi.spyOn(mockRepository, 'save').mockResolvedValue(Result.ok(undefined));

      await service.execute('550e8400-e29b-41d4-a716-446655440000', { email: 'user@example.com' });

      expect(saveSpy).toHaveBeenCalledOnce();
      expect(saveSpy).toHaveBeenCalledWith(classWithVersion);
      expect(classWithVersion.aggregate.getProps().bookings).toHaveLength(1);
    });
  });

  describe('optimistic locking simulation', () => {
    it('should demonstrate repository layer handles concurrent bookings', async () => {
      const classWithVersion = createMockClass(0, 1);
      vi.spyOn(mockRepository, 'findById').mockResolvedValue(classWithVersion);

      vi.spyOn(mockRepository, 'save').mockResolvedValueOnce(Result.ok(undefined));

      const result1 = await service.execute('550e8400-e29b-41d4-a716-446655440000', { email: 'user1@example.com' });
      expect(result1.isOk).toBe(true);

      vi.spyOn(mockRepository, 'save').mockResolvedValueOnce(
        Result.err(new ConflictException('Class was modified by another request. Please retry.'))
      );

      const result2 = await service.execute('550e8400-e29b-41d4-a716-446655440000', { email: 'user2@example.com' });

      expect(result2.isErr).toBe(true);
      if (result2.isErr) {
        expect(result2.error).toBeInstanceOf(ConflictException);
      }
    });
  });
});
