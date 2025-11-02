import { randomUUID } from 'crypto';

export interface SerializedException {
  message: string;
  name: string;
  correlationId: string;
  stack?: string;
  cause?: string;
  metadata?: unknown;
}

/**
 * Base class for custom exceptions.
 */
export abstract class ExceptionBase extends Error {
  public readonly correlationId: string;

  /**
   * @param message Error message
   * @param cause Original error cause
   * @param metadata Additional debugging metadata (non-sensitive only)
   */
  constructor(
    override readonly message: string,
    override readonly cause?: Error,
    readonly metadata?: unknown,
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.correlationId = randomUUID();
  }

  toJSON(): SerializedException {
    return {
      message: this.message,
      name: this.constructor.name,
      stack: this.stack,
      correlationId: this.correlationId,
      cause: JSON.stringify(this.cause),
      metadata: this.metadata,
    };
  }
}
