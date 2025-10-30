import type { APIGatewayProxyHandler } from 'aws-lambda';
import { searchClassesRequestDTOSchema, SearchClassesResponseDTO, ClassDTO } from '@repo/dtos';
import { ClassRepository } from '../infrastructure/repositories/class.repository.js';
import { successResponse, errorResponse, mapExceptionToStatusCode } from './utils/api-response.js';
import { ExceptionBase } from '@repo/ddd';

const classRepository = new ClassRepository();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};

    // Validate request
    const validatedRequest = searchClassesRequestDTOSchema.parse(body);

    // Fetch classes
    const classes = await classRepository.findByType(validatedRequest.type);

    // Map to DTOs
    const classDTOs: ClassDTO[] = classes.map((classAggregate) => {
      const props = classAggregate.getProps();
      return {
        id: typeof props.id === 'string' ? props.id : String(props.id),
        type: classAggregate.classType.type,
        level: classAggregate.classType.level,
        date: classAggregate.dateTime.date,
        startTime: classAggregate.dateTime.startTime,
        maxSpots: classAggregate.maxSpots,
        spotsRemaining: classAggregate.spotsRemaining,
      };
    });

    // Sort by date/time
    classDTOs.sort((a, b) => {
      const dateTimeA = `${a.date}T${a.startTime}`;
      const dateTimeB = `${b.date}T${b.startTime}`;
      return dateTimeA.localeCompare(dateTimeB);
    });

    const response: SearchClassesResponseDTO = {
      classes: classDTOs,
    };

    return successResponse(200, response);
  } catch (error) {
    console.error('Error in search-classes handler:', error);

    if (error instanceof ExceptionBase) {
      return errorResponse(mapExceptionToStatusCode(error), error);
    }

    return errorResponse(500, error as Error);
  }
};
