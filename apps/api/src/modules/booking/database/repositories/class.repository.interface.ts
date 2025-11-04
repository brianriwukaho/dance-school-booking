import { Result } from '@badrap/result';
import { Class } from '../../domain/aggregates/class.aggregate.js';
import { ClassTypeValue } from '../../domain/value-objects/class-type.value-object.js';
import { ConflictException } from '@repo/ddd';

export interface IClassRepository {
  findById(classId: string): Promise<Class | null>;
  findByType(type: ClassTypeValue | 'any'): Promise<Class[]>;
  save(classAggregate: Class): Promise<Result<void, ConflictException>>;
}
