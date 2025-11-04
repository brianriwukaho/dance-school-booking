import { Result } from '@badrap/result';
import { SearchClassesQuery } from './search-classes.query.js';
import { ClassRepository } from '../../database/repositories/class.repository.js';
import { ExceptionBase } from '@repo/ddd';
import { searchClassesRequestDTOSchema, type SearchClassesResponseDTO, type ClassDTO } from '@repo/dtos';
import { InvalidSearchFiltersException } from '../../exceptions/booking.exceptions.js';

/**
 * Query service for searching classes.
 * Returns classes filtered by type and sorted by date/time.
 */
export class SearchClassesService {
  constructor(private readonly classRepository: ClassRepository) {}

  async execute(body: unknown): Promise<Result<SearchClassesResponseDTO, ExceptionBase>> {
    const validationResult = searchClassesRequestDTOSchema.safeParse(body);
    if (!validationResult.success) {
      return Result.err(
        new InvalidSearchFiltersException(validationResult.error)
      );
    }

    const query = new SearchClassesQuery(validationResult.data.type);

    try {
      return await this.executeQuery(query);
    } catch (error) {
      if (error instanceof ExceptionBase) {
        return Result.err(error);
      }
      throw error;
    }
  }

  private async executeQuery(query: SearchClassesQuery): Promise<Result<SearchClassesResponseDTO, ExceptionBase>> {
    const classes = await this.classRepository.findByType(query.type);

    const classDTOs: ClassDTO[] = classes.map((classAggregate) => {
      const props = classAggregate.getProps();
      const classDTO: ClassDTO = {
        id: typeof props.id === 'string' ? props.id : String(props.id),
        type: props.classType.type,
        level: props.classType.level,
        date: props.dateTime.date,
        startTime: props.dateTime.startTime,
        maxSpots: props.maxSpots,
        spotsRemaining: classAggregate.spotsRemaining,
      };
      return classDTO;
    });

    classDTOs.sort((a, b) => {
      const dateTimeA = `${a.date}T${a.startTime}`;
      const dateTimeB = `${b.date}T${b.startTime}`;
      return dateTimeA.localeCompare(dateTimeB);
    });

    const response: SearchClassesResponseDTO = {
      classes: classDTOs,
    };

    return Result.ok(response);
  }
}
