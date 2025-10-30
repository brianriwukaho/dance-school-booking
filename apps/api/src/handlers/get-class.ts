import type { APIGatewayProxyHandler } from 'aws-lambda';
import { GetClassResponseDTO } from '@repo/dtos';
import { ClassRepository } from '../infrastructure/repositories/class.repository.js';
import { successResponse, errorResponse, mapExceptionToStatusCode } from './utils/api-response.js';
import { ExceptionBase, NotFoundException } from '@repo/ddd';

const classRepository = new ClassRepository();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const classId = event.pathParameters?.classId;

    if (!classId) {
      throw new NotFoundException('Class ID is required');
    }

    // Fetch class
    const classAggregate = await classRepository.findById(classId);

    if (!classAggregate) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // Map to DTO
    const props = classAggregate.getProps();
    const response: GetClassResponseDTO = {
      id: typeof props.id === 'string' ? props.id : String(props.id),
      type: classAggregate.classType.type,
      level: classAggregate.classType.level,
      date: classAggregate.dateTime.date,
      startTime: classAggregate.dateTime.startTime,
      maxSpots: classAggregate.maxSpots,
      spotsRemaining: classAggregate.spotsRemaining,
    };

    return successResponse(200, response);
  } catch (error) {
    console.error('Error in get-class handler:', error);

    if (error instanceof ExceptionBase) {
      return errorResponse(mapExceptionToStatusCode(error), error);
    }

    return errorResponse(500, error as Error);
  }
};
