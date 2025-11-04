import { Result } from "@badrap/result";
import { ArgumentInvalidException } from "@repo/ddd";

/**
 * Safely parses JSON string into a typed object.
 * Returns Result to avoid try-catch in handlers.
 *
 * @param body - Raw JSON string from request body
 * @returns Result containing parsed object or ArgumentInvalidException
 */
export function parseJson<T = unknown>(
  body: string | null | undefined
): Result<T, ArgumentInvalidException> {
  if (!body) {
    const emptyObject = {} as T;
    return Result.ok(emptyObject);
  }

  try {
    const parsed = JSON.parse(body) as T;
    return Result.ok(parsed);
  } catch (error) {
    const exception = new ArgumentInvalidException("Invalid JSON in request body");
    return Result.err(exception);
  }
}
