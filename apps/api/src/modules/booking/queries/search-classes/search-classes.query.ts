import type { ClassTypeDTO } from '@repo/dtos';

export class SearchClassesQuery {
  constructor(public readonly type: ClassTypeDTO) {}
}
