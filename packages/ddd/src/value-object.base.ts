import { ArgumentNotProvidedException } from './exceptions/index.js';
import { Guard } from './guard.js';

/**
 * Domain Primitive is an object that contains only a single value
 */
export type Primitives = string | number | boolean;
export interface DomainPrimitive<T extends Primitives | Date> {
  value: T;
}

type ValueObjectProps<T> = T extends Primitives | Date ? DomainPrimitive<T> : T;

/**
 * Value Object base class.
 *
 * A Value Object is an immutable domain object that represents a descriptive aspect
 * of the domain. Unlike entities, value objects have no identity - they are defined
 * entirely by their attributes.
 *
 * Key characteristics:
 * - Immutable - properties cannot be changed after creation
 * - No identity - equality is based on structural comparison of all properties
 * - Interchangeable - two value objects with the same values are considered identical
 * - Self-validating - ensures invariants are maintained at construction
 * - Side-effect free - methods return new instances rather than modifying state
 *
 * Value objects represent domain concepts that are best defined by what they are,
 * not who they are (e.g., Email, Money, Address, DateRange).
 *
 * Use value objects to:
 * - Encapsulate validation logic for domain concepts
 * - Make implicit concepts explicit in your domain model
 * - Reduce primitive obsession in your codebase
 */
export abstract class ValueObject<T> {
  protected readonly props: ValueObjectProps<T>;

  constructor(props: ValueObjectProps<T>) {
    this.checkIfEmpty(props);
    this.validate(props);
    this.props = props;
  }

  protected abstract validate(props: ValueObjectProps<T>): void;

  static isValueObject(obj: unknown): obj is ValueObject<unknown> {
    return obj instanceof ValueObject;
  }

  /**
   *  Check if two Value Objects are equal. Checks structural equality.
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    return JSON.stringify(this) === JSON.stringify(vo);
  }

  /**
   * Unpack a value object to get its raw properties
   */
  public unpack(): T {
    if (this.isDomainPrimitive(this.props)) {
      return this.props.value;
    }

    return Object.freeze(this.props as T);
  }

  private checkIfEmpty(props: ValueObjectProps<T>): void {
    if (
      Guard.isEmpty(props) ||
      (this.isDomainPrimitive(props) && Guard.isEmpty(props.value))
    ) {
      throw new ArgumentNotProvidedException('Property cannot be empty');
    }
  }

  private isDomainPrimitive(
    obj: unknown,
  ): obj is DomainPrimitive<T & (Primitives | Date)> {
    if (Object.prototype.hasOwnProperty.call(obj, 'value')) {
      return true;
    }
    return false;
  }
}
