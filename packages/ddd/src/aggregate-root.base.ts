import { Entity, CreateEntityProps, BaseEntityProps } from './entity.base.js';

export interface AggregateRootProps {
  version: number;
}

export interface CreateAggregateRootProps<T> extends CreateEntityProps<T> {
  version?: number;
}

/**
 * Aggregate Root base class with optimistic locking support.
 *
 * The version field is used for optimistic locking when persisting changes.
 * When updating an aggregate, the repository should check that the version
 * in the database matches the version in memory, and increment it atomically.
 * This prevents lost updates in concurrent scenarios.
 */
export abstract class AggregateRoot<Props extends AggregateRootProps> extends Entity<Props> {
  private _version: number;

  constructor(props: CreateAggregateRootProps<Props>) {
    super(props);
    this._version = props.version ?? 0;
  }

  get version(): number {
    return this._version;
  }

  /**
   * Increment version for optimistic locking.
   * This should be called by the repository after a successful update.
   */
  public incrementVersion(): void {
    this._version++;
  }

  /**
   * Override getProps to include version
   */
  public override getProps(): Props & BaseEntityProps & AggregateRootProps {
    return {
      ...super.getProps(),
      version: this._version,
    } as Props & BaseEntityProps & AggregateRootProps;
  }

  /**
   * Override toObject to include version
   */
  public override toObject(): unknown {
    const baseObject = super.toObject() as Record<string, unknown>;
    return {
      ...baseObject,
      version: this._version,
    };
  }
}
