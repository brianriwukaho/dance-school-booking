import { Result } from "@badrap/result";
import { ClassTypeValue } from "../../domain/value-objects/class-type.value-object.js";
import { ConflictException } from "@repo/ddd";
import { ClassWithVersion } from "../mappers/class.mapper.js";

/**
 * Repository interface for Class aggregate.
 *
 * All methods return/accept ClassWithVersion wrapper to maintain version
 * tracking for optimistic locking without requiring a cache or polluting
 * the domain model with persistence concerns.
 */
export interface IClassRepository {
  findById(classId: string): Promise<ClassWithVersion | null>;
  findByType(type: ClassTypeValue | "any"): Promise<ClassWithVersion[]>;
  save(classWithVersion: ClassWithVersion): Promise<Result<void, ConflictException>>;
}
