import type { APIGatewayProxyResult } from 'aws-lambda';
import { ExceptionBase } from '@repo/ddd';
import { ErrorResponseDTO } from '@repo/dtos';

export function successResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
}

export function errorResponse(
  statusCode: number,
  error: ExceptionBase | Error
): APIGatewayProxyResult {
  const errorBody: ErrorResponseDTO = {
    error: {
      code: error instanceof ExceptionBase ? error.code : 'INTERNAL_SERVER_ERROR',
      message: error.message,
      correlationId:
        error instanceof ExceptionBase ? error.correlationId : undefined,
    },
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(errorBody),
  };
}

export function mapExceptionToStatusCode(error: ExceptionBase | Error): number {
  if (!(error instanceof ExceptionBase)) {
    return 500;
  }

  const code = error.code;
  if (code.includes('NOT_FOUND')) return 404;
  if (code.includes('CONFLICT')) return 409;
  if (code.includes('ARGUMENT_INVALID') || code.includes('ARGUMENT_NOT_PROVIDED')) return 400;
  return 500;
}
