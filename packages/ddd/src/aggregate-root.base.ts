import { Entity, CreateEntityProps } from "./entity.base.js";

/**
 * Aggregate Root base class.
 *
 * An Aggregate Root is an Entity that serves as the entry point to an aggregate.
 * It enforces invariants across all entities within its aggregate boundary.
 *
 * Key responsibilities:
 * - Enforce business rules and invariants for the entire aggregate
 * - Control access to entities within the aggregate
 * - Ensure consistency of the aggregate as a whole
 *
 * The aggregate root is the only entity that external objects can hold references to.
 */
export abstract class AggregateRoot<Props, IdType> extends Entity<Props, IdType> {
  constructor(props: CreateEntityProps<Props, IdType>) {
    super(props);
  }

  // In a more complex problem space, we might add methods here to manage
  // transactions, domain events, or other cross-cutting concerns
  // relevant to aggregate roots.
  //
  // But for now a straightforward extension of Entity suffices.
  //
  // The scale of this ballet class means we do not need the resiliency
  // and data consistency benefits that typically incur async boundaries.
  //
  // Example placeholder for domain event handling:
  // private _domainEvents: DomainEvent[] = [];
  // ...
  // protected addEvent, public clearEvents, public async publishEvents, etc
}
