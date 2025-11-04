import { Result } from '@badrap/result';
import { GetClassQuery } from './get-class.query.js';
import { ClassRepository } from '../../database/repositories/class.repository.js';
import { ExceptionBase } from '@repo/ddd';
import type { GetClassResponseDTO } from '@repo/dtos';
import { ClassNotFoundException } from '../../exceptions/booking.exceptions.js';

/**
 * Query service for getting a single class.
 */
export class GetClassService {
  constructor(private readonly classRepository: ClassRepository) {}

  async execute(classId: string): Promise<Result<GetClassResponseDTO, ExceptionBase>> {
    const query = new GetClassQuery(classId);

    try {
      const classAggregate = await this.classRepository.findById(query.classId);

      if (!classAggregate) {
        return Result.err(new ClassNotFoundException(query.classId));
      }

      const props = classAggregate.getProps();
      const response: GetClassResponseDTO = {
        id: typeof props.id === 'string' ? props.id : String(props.id),
        type: props.classType.type,
        level: props.classType.level,
        date: props.dateTime.date,
        startTime: props.dateTime.startTime,
        maxSpots: props.maxSpots,
        spotsRemaining: classAggregate.spotsRemaining,
      };

      return Result.ok(response);
    } catch (error) {
      if (error instanceof ExceptionBase) {
        return Result.err(error);
      }
      throw error;
    }
  }
}
