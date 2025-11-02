import {
  ArgumentNotProvidedException,
  ArgumentInvalidException,
  ArgumentOutOfRangeException,
} from './exceptions/index.js';
import { Guard } from './guard.js';

export interface BaseEntityProps<IdType> {
  id: IdType;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEntityProps<T, IdType> {
  id: IdType;
  props: T;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entity base class.
 *
 * An Entity is a domain object that has a unique identity that persists over time.
 * The ID defines the entity's identity - two instances with the same ID represent
 * the same domain entity, even if their other properties have different values
 * (e.g., stale vs. fresh data, or different lifecycle states).
 *
 * Key characteristics:
 * - Has a unique identifier (ID) that defines its identity
 * - Maintains identity through lifecycle changes
 * - Equality comparison is based solely on ID, not property values
 * - Tracks creation and update timestamps
 * - Must implement validation logic for business invariants
 *
 * Entities represent domain concepts that have continuity and identity throughout
 * their lifecycle (e.g., a User, an Order, a Booking).
 */
export abstract class Entity<EntityProps, IdType> {
  constructor({
    id,
    createdAt,
    updatedAt,
    props,
  }: CreateEntityProps<EntityProps, IdType>) {
    this.setId(id);
    this.validateProps(props);
    const now = new Date();
    this._createdAt = createdAt || now;
    this._updatedAt = updatedAt || now;
    this.props = props;
    this.validate();
  }

  protected readonly props: EntityProps;

  /**
   * Entity identifier set during construction via setId().
   */
  protected _id!: IdType;

  private readonly _createdAt: Date;

  private _updatedAt: Date;

  get id(): IdType {
    return this._id;
  }

  private setId(id: IdType): void {
    this._id = id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  static isEntity(entity: unknown): entity is Entity<unknown, unknown> {
    return entity instanceof Entity;
  }

  /**
   *  Checks if two entities are the same Entity by comparing ID field.
   */
  public equals(object?: Entity<EntityProps, IdType>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!Entity.isEntity(object)) {
      return false;
    }

    return this.id ? this.id === object.id : false;
  }

  /**
   * Returns entity properties.
   */
  public getProps(): EntityProps & BaseEntityProps<IdType> {
    const propsCopy = {
      id: this._id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      ...this.props,
    };
    return Object.freeze(propsCopy);
  }

  /**
   * Convert an Entity to a plain object.
   * Useful when logging an entity during testing/debugging.
   */
  public toObject(): unknown {
    const idValue = typeof this._id === 'object' && this._id !== null && 'toString' in this._id
      ? this._id.toString()
      : this._id;

    const result = {
      id: idValue,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      ...this.props,
    };
    return Object.freeze(result);
  }

  /**
   * There are certain rules that always have to be true (invariants)
   * for each entity. Validate method is called every time before
   * saving an entity to the database to make sure those rules are respected.
   */
  public abstract validate(): void;

  private validateProps(props: EntityProps): void {
    const MAX_PROPS = 50;

    if (Guard.isEmpty(props)) {
      throw new ArgumentNotProvidedException(
        'Entity props should not be empty',
      );
    }
    if (typeof props !== 'object') {
      throw new ArgumentInvalidException('Entity props should be an object');
    }
    if (Object.keys(props as any).length > MAX_PROPS) {
      throw new ArgumentOutOfRangeException(
        `Entity props should not have more than ${MAX_PROPS} properties`,
      );
    }
  }
}
