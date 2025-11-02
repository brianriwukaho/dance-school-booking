import { ValueObject, DomainPrimitive, ArgumentInvalidException } from '@repo/ddd';

export class Email extends ValueObject<string> {
  constructor(value: string) {
    super({ value });
  }

  protected validate(props: DomainPrimitive<string>): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(props.value)) {
      throw new ArgumentInvalidException('Invalid email format');
    }
  }

  get value(): string {
    return this.unpack();
  }
}
