import { ExceptionBase } from './exception.base.js';

export class ArgumentInvalidException extends ExceptionBase {}

export class ArgumentNotProvidedException extends ExceptionBase {}

export class ArgumentOutOfRangeException extends ExceptionBase {}

export class ConflictException extends ExceptionBase {}

export class NotFoundException extends ExceptionBase {
  static readonly message = 'Not found';

  constructor(message = NotFoundException.message) {
    super(message);
  }
}

export class InternalServerErrorException extends ExceptionBase {
  static readonly message = 'Internal server error';

  constructor(message = InternalServerErrorException.message) {
    super(message);
  }
}
