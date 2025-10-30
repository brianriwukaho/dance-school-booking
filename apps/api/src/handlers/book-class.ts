import type { APIGatewayProxyHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { bookClassRequestDTOSchema, BookClassResponseDTO } from '@repo/dtos';
import { ClassRepository } from '../infrastructure/repositories/class.repository.js';
import { Email } from '../domain/value-objects/email.value-object.js';
import { successResponse, errorResponse, mapExceptionToStatusCode } from './utils/api-response.js';
import { ExceptionBase, NotFoundException } from '@repo/ddd';

const classRepository = new ClassRepository();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const classId = event.pathParameters?.classId;

    if (!classId) {
      throw new NotFoundException('Class ID is required');
    }

    const body = event.body ? JSON.parse(event.body) : {};

    // Validate request
    const validatedRequest = bookClassRequestDTOSchema.parse(body);

    // Fetch class
    const classAggregate = await classRepository.findById(classId);

    if (!classAggregate) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // Create email value object
    const email = new Email(validatedRequest.email);

    // Book the class (domain logic enforces business rules)
    const bookingId = randomUUID();
    const booking = classAggregate.book(email, bookingId);

    // Save the updated aggregate (with optimistic locking)
    await classRepository.save(classAggregate);

    // Return response
    const bookingProps = booking.getProps();
    const response: BookClassResponseDTO = {
      bookingId: typeof bookingProps.id === 'string' ? bookingProps.id : String(bookingProps.id),
      classId,
      email: validatedRequest.email,
      createdAt: bookingProps.createdAt.toISOString(),
    };

    return successResponse(201, response);
  } catch (error) {
    console.error('Error in book-class handler:', error);

    if (error instanceof ExceptionBase) {
      return errorResponse(mapExceptionToStatusCode(error), error);
    }

    return errorResponse(500, error as Error);
  }
};
